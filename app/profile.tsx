import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "../context/GlobalProvider";
import {
    appwriteConfig,
    checkUsernameAvailability,
    databases,
    fetchCategoriesFromDB,
    fetchNichesFromDB,
    fetchSubCategoriesFromDB,
    haveCategoriesChanged,
    signOut,
    updateUserPreferences,
    updateUserProfile,
} from "../lib/appwrite";
import { reinitializeUserLearningData } from "../lib/roadmap";

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);

  // Dropdown states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showNicheModal, setShowNicheModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<any[]>(
    []
  );
  const [availableNiches, setAvailableNiches] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
    loadCategories();
  }, [user]);

  useEffect(() => {
    if (
      isEditing &&
      username !== originalUsername &&
      username.trim().length >= 3
    ) {
      const timer = setTimeout(() => {
        checkUsername();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, isEditing]);

  const checkUsername = async () => {
    setCheckingUsername(true);
    try {
      const available = await checkUsernameAvailability(
        username.trim(),
        user.$id
      );
      setUsernameAvailable(available);
    } catch (error) {
      console.error("[Profile] Username check error:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await fetchCategoriesFromDB();
      setAvailableCategories(cats);
    } catch (error) {
      console.error("[Profile] Error loading categories:", error);
    }
  };

  const loadSubCategories = async (categoryOriginalIds: string[]) => {
    try {
      const allSubs: any[] = [];
      for (const originalId of categoryOriginalIds) {
        const subs = await fetchSubCategoriesFromDB(originalId);
        allSubs.push(...subs);
      }
      setAvailableSubCategories(allSubs);
    } catch (error) {
      console.error("[Profile] Error loading sub categories:", error);
    }
  };

  const loadNiches = async (subCategoryOriginalIds: string[]) => {
    try {
      const allNiches: any[] = [];
      for (const originalId of subCategoryOriginalIds) {
        const niches = await fetchNichesFromDB(originalId);
        allNiches.push(...niches);
      }
      setAvailableNiches(allNiches);
    } catch (error) {
      console.error("[Profile] Error loading niches:", error);
    }
  };

  const loadUserData = async () => {
    if (!user?.$id) return;

    setIsLoading(true);
    try {
      setName(user.name || "");
      setUsername(user.username || "");
      setOriginalUsername(user.username || "");
      setEmail(user.email || "");

      // Fetch user preferences
      const prefs = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.userPreferencesCollectionId!,
        [Query.equal("userId", user.$id)]
      );

      if (prefs.documents.length > 0) {
        const pref = prefs.documents[0];
        const categories = pref.selectedCategories || [];

        setSelectedCategories(categories);
        // Note: subcategories and niches are UI-only for filtering, not stored in DB
        setSelectedSubCategories([]);
        setSelectedNiches([]);

        // Load related options
        if (categories.length > 0) {
          await loadSubCategories(categories);
        }
      }
    } catch (error) {
      console.error("[Profile] Error loading data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = async (categoryOriginalId: string) => {
    // Only allow one category at a time
    // If clicking the same category, deselect it
    const updated = selectedCategories.includes(categoryOriginalId)
      ? []
      : [categoryOriginalId];

    setSelectedCategories(updated);

    // Reload subcategories based on selected category
    if (updated.length > 0) {
      await loadSubCategories(updated);
    } else {
      setAvailableSubCategories([]);
      setSelectedSubCategories([]);
      setAvailableNiches([]);
      setSelectedNiches([]);
    }
  };

  const handleSubCategorySelect = async (subCategoryOriginalId: string) => {
    const updated = selectedSubCategories.includes(subCategoryOriginalId)
      ? selectedSubCategories.filter((id) => id !== subCategoryOriginalId)
      : [...selectedSubCategories, subCategoryOriginalId];

    setSelectedSubCategories(updated);

    // Reload niches based on selected subcategories
    if (updated.length > 0) {
      await loadNiches(updated);
    } else {
      setAvailableNiches([]);
      setSelectedNiches([]);
    }
  };

  const handleNicheSelect = (nicheOriginalId: string) => {
    const updated = selectedNiches.includes(nicheOriginalId)
      ? selectedNiches.filter((id) => id !== nicheOriginalId)
      : [...selectedNiches, nicheOriginalId];

    setSelectedNiches(updated);
  };

  const handleSave = async () => {
    if (!user?.$id) return;

    // Validate username
    if (username.trim().length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters");
      return;
    }

    if (username !== originalUsername && !usernameAvailable) {
      Alert.alert("Error", "Username is not available");
      return;
    }

    setIsSaving(true);
    try {
      // Check if categories have changed (this determines if we need to reinitialize)
      console.log("[Profile] Checking if categories changed...");
      const categoriesHaveChanged = await haveCategoriesChanged(
        user.$id,
        selectedCategories
      );

      if (categoriesHaveChanged) {
        // Show confirmation dialog for reinitialization
        Alert.alert(
          "Preferences Changed",
          "Your learning categories have changed. This will reset your roadmap and recommendations to match your new interests. Do you want to continue?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setIsSaving(false);
              },
            },
            {
              text: "Continue",
              onPress: async () => {
                try {
                  // Update user profile
                  await updateUserProfile(
                    user.$id,
                    name.trim(),
                    username.trim()
                  );

                  // Update preferences first
                  await updateUserPreferences(user.$id, selectedCategories);

                  // Reinitialize learning data (roadmap, saved videos, etc.)
                  console.log("[Profile] Starting reinitialization...");
                  await reinitializeUserLearningData(
                    user.$id,
                    selectedCategories
                  );

                  // Update local user state
                  setUser({
                    ...user,
                    name: name.trim(),
                    username: username.trim(),
                  });

                  setOriginalUsername(username.trim());
                  setIsEditing(false);

                  Alert.alert(
                    "Success",
                    "Your profile has been updated and your learning path has been refreshed!"
                  );
                } catch (error) {
                  console.error("[Profile] Reinitialization error:", error);
                  Alert.alert(
                    "Partial Success",
                    "Profile updated but there was an issue refreshing your learning path. Please restart the app."
                  );
                } finally {
                  setIsSaving(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        // No category changes, just update profile and preferences normally
        await updateUserProfile(user.$id, name.trim(), username.trim());

        await updateUserPreferences(user.$id, selectedCategories);

        // Update local user state
        setUser({
          ...user,
          name: name.trim(),
          username: username.trim(),
        });

        setOriginalUsername(username.trim());
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("[Profile] Save error:", error);
      Alert.alert("Error", "Failed to save changes");
      setIsSaving(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLogged(false);
      router.replace("/(auth)/sign-in");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          backgroundColor: "#0f0f10",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
        edges={["left", "right", "bottom"]}
      >
        <ActivityIndicator size="large" color="#FF8E01" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ backgroundColor: "#0f0f10", flex: 1 }}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar style="light" hidden={false} backgroundColor="#0f0f10" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            width: "100%",
            paddingTop: 16,
            paddingHorizontal: 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 30,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditing(false);
                      loadUserData();
                    }}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons name="close" size={28} color="#9ca3af" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={isSaving}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#10b981" />
                    ) : (
                      <Ionicons name="checkmark" size={28} color="#10b981" />
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons name="create-outline" size={26} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={logout}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={26}
                      color="#FF5A5A"
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Profile Picture */}
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <View
              style={{
                width: 90,
                height: 90,
                borderColor: "#FF8E01",
                borderWidth: 1.5,
                borderRadius: 14,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("../assets/images/profile.png")}
                style={{ width: "90%", height: "90%", borderRadius: 12 }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Profile Form */}
          <View style={{ width: "100%", paddingHorizontal: 8 }}>
            {/* Name */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                NAME
              </Text>
              {isEditing ? (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={{
                    backgroundColor: "#1E1E2D",
                    color: "white",
                    padding: 14,
                    borderRadius: 10,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: "#3b82f6",
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor="#6b7280"
                />
              ) : (
                <Text style={{ color: "white", fontSize: 16, padding: 14 }}>
                  {name || "Not set"}
                </Text>
              )}
            </View>

            {/* Username */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                USERNAME
              </Text>
              {isEditing ? (
                <>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    style={{
                      backgroundColor: "#1E1E2D",
                      color: "white",
                      padding: 14,
                      borderRadius: 10,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor:
                        usernameAvailable === false
                          ? "#ef4444"
                          : usernameAvailable === true
                          ? "#10b981"
                          : "#3b82f6",
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor="#6b7280"
                    autoCapitalize="none"
                  />
                  {username !== originalUsername &&
                    username.trim().length >= 3 && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        {checkingUsername ? (
                          <ActivityIndicator size="small" color="#3b82f6" />
                        ) : usernameAvailable ? (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#10b981"
                            />
                            <Text
                              style={{
                                color: "#10b981",
                                fontSize: 12,
                                marginLeft: 4,
                              }}
                            >
                              Username available
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color="#ef4444"
                            />
                            <Text
                              style={{
                                color: "#ef4444",
                                fontSize: 12,
                                marginLeft: 4,
                              }}
                            >
                              Username not available
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                </>
              ) : (
                <Text style={{ color: "white", fontSize: 16, padding: 14 }}>
                  {username || "Not set"}
                </Text>
              )}
            </View>

            {/* Email (read-only) */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                EMAIL
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 16, padding: 14 }}>
                {email || "Not set"}
              </Text>
            </View>

            {/* Categories */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                CATEGORY
              </Text>
              {isEditing ? (
                <TouchableOpacity
                  onPress={() => setShowCategoryModal(true)}
                  style={{
                    backgroundColor: "#1E1E2D",
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#3b82f6",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedCategories.length > 0 ? "white" : "#6b7280",
                      fontSize: 16,
                    }}
                  >
                    {selectedCategories.length > 0
                      ? availableCategories.find(
                          (c) => c.originalId === selectedCategories[0]
                        )?.name || "1 selected"
                      : "Select category"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: 8,
                  }}
                >
                  {selectedCategories.length > 0 ? (
                    selectedCategories.map((categoryOriginalId, index) => {
                      const cat = availableCategories.find(
                        (c) => c.originalId === categoryOriginalId
                      );
                      return (
                        <View
                          key={`cat-${categoryOriginalId}-${index}`}
                          style={{
                            backgroundColor: "#FF8E01",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {cat?.name || categoryOriginalId}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ color: "#6b7280", fontSize: 14 }}>
                      No category selected
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Sub Categories */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                SUB CATEGORIES
              </Text>
              {isEditing ? (
                <TouchableOpacity
                  onPress={() =>
                    availableSubCategories.length > 0 &&
                    setShowSubCategoryModal(true)
                  }
                  disabled={availableSubCategories.length === 0}
                  style={{
                    backgroundColor: "#1E1E2D",
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor:
                      availableSubCategories.length > 0 ? "#3b82f6" : "#374151",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedSubCategories.length > 0 ? "white" : "#6b7280",
                      fontSize: 16,
                    }}
                  >
                    {availableSubCategories.length === 0
                      ? "Select categories first"
                      : selectedSubCategories.length > 0
                      ? `${selectedSubCategories.length} selected`
                      : "Select sub categories"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: 8,
                  }}
                >
                  {selectedSubCategories.length > 0 ? (
                    selectedSubCategories.map((subOriginalId, index) => {
                      const sub = availableSubCategories.find(
                        (s) => s.originalId === subOriginalId
                      );
                      return (
                        <View
                          key={`sub-${subOriginalId}-${index}`}
                          style={{
                            backgroundColor: "#3b82f6",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {sub?.name || subOriginalId}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ color: "#6b7280", fontSize: 14 }}>
                      No sub categories selected
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Niches */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#9ca3af",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                NICHES
              </Text>
              {isEditing ? (
                <TouchableOpacity
                  onPress={() =>
                    availableNiches.length > 0 && setShowNicheModal(true)
                  }
                  disabled={availableNiches.length === 0}
                  style={{
                    backgroundColor: "#1E1E2D",
                    padding: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor:
                      availableNiches.length > 0 ? "#3b82f6" : "#374151",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: selectedNiches.length > 0 ? "white" : "#6b7280",
                      fontSize: 16,
                    }}
                  >
                    {availableNiches.length === 0
                      ? "Select sub categories first"
                      : selectedNiches.length > 0
                      ? `${selectedNiches.length} selected`
                      : "Select niches"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: 8,
                  }}
                >
                  {selectedNiches.length > 0 ? (
                    selectedNiches.map((nicheOriginalId, index) => {
                      const niche = availableNiches.find(
                        (n) => n.originalId === nicheOriginalId
                      );
                      return (
                        <View
                          key={`niche-${nicheOriginalId}-${index}`}
                          style={{
                            backgroundColor: "#10b981",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            {niche?.name || nicheOriginalId}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ color: "#6b7280", fontSize: 14 }}>
                      No niches selected
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1E1E2D",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#374151",
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Select Category (One Only)
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.$id}
                  onPress={() => handleCategorySelect(cat.originalId)}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    backgroundColor: selectedCategories.includes(cat.originalId)
                      ? "#3b82f6"
                      : "#0f0f10",
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>
                    {cat.name}
                  </Text>
                  {selectedCategories.includes(cat.originalId) && (
                    <Ionicons name="radio-button-on" size={24} color="white" />
                  )}
                  {!selectedCategories.includes(cat.originalId) && (
                    <Ionicons
                      name="radio-button-off"
                      size={24}
                      color="#6b7280"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sub Category Modal */}
      <Modal visible={showSubCategoryModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1E1E2D",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#374151",
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Select Sub Categories
              </Text>
              <TouchableOpacity onPress={() => setShowSubCategoryModal(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              {availableSubCategories.map((sub) => (
                <TouchableOpacity
                  key={sub.$id}
                  onPress={() => handleSubCategorySelect(sub.originalId)}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    backgroundColor: selectedSubCategories.includes(
                      sub.originalId
                    )
                      ? "#3b82f6"
                      : "#0f0f10",
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>
                    {sub.name}
                  </Text>
                  {selectedSubCategories.includes(sub.originalId) && (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Niche Modal */}
      <Modal visible={showNicheModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.8)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#1E1E2D",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#374151",
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                Select Niches
              </Text>
              <TouchableOpacity onPress={() => setShowNicheModal(false)}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20 }}>
              {availableNiches.map((niche) => (
                <TouchableOpacity
                  key={niche.$id}
                  onPress={() => handleNicheSelect(niche.originalId)}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    backgroundColor: selectedNiches.includes(niche.originalId)
                      ? "#10b981"
                      : "#0f0f10",
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>
                    {niche.name}
                  </Text>
                  {selectedNiches.includes(niche.originalId) && (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
