import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Query } from "react-native-appwrite";
import { useGlobalContext } from "../context/GlobalProvider";
import { appwriteConfig, completeOnboarding, databases } from "../lib/appwrite";
import { generateKeywords } from "../lib/gemini";
import { seedCategories } from "../lib/seed";

const Onboarding = () => {
  const { user, setUser } = useGlobalContext();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Multi-step state
  const [step, setStep] = useState<"categories" | "context">("categories");
  const [learningContext, setLearningContext] = useState("");

  // Navigation State
  const [currentParentId, setCurrentParentId] = useState(null);
  const [pathHistory, setPathHistory] = useState<any[]>([]); // Array of {id, name}

  // Selection State
  const [selectedItems, setSelectedItems] = useState<any[]>([]); // Array of category IDs at current level
  const [selectedCategoryObjects, setSelectedCategoryObjects] = useState<any[]>(
    []
  ); // Array of full objects

  useEffect(() => {
    const init = async () => {
      await seedCategories();
      fetchCategories(null);
    };
    init();
  }, []);

  const fetchCategories = async (parentId) => {
    setLoading(true);
    try {
      const queries = [
        Query.equal("parentId", parentId ? parentId : null), // .isNull() not supported in all SDK versions for relations, usually using Query.equal('parentId', [null]) or similar. But here parentId field in DB is string or null.
        // Actually Appwrite queries on null values: Query.isNull('parentId') if strictly null, but I stored null in seed?
        // Seed: parentId: null.
        // Let's try Query.equal('parentId', 'null') if string or Query.isNull('parentId').
        // Client SDK 14+ supports Query.isNull().
      ];

      // To be safe with "null" check in Appwrite:
      // If parentId is null, use Query.isNull('parentId').
      // Else Query.equal('parentId', parentId).

      const q = parentId
        ? [Query.equal("parentId", parentId)]
        : [Query.isNull("parentId")];

      const res = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        q
      );

      setCategories(res.documents);
      setSelectedItems([]); // Reset selection on level change? Or keep global?
      // UX: "Drill down" usually means new context. So reset local selection.
    } catch (error) {
      console.log("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = async (category) => {
    // Check if this category has children
    setLoading(true);
    try {
      const children = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        [Query.equal("parentId", category.originalId)] // Use originalId from seed/db
      );

      if (children.documents.length > 0) {
        // Determine we can go deeper
        setPathHistory([
          ...pathHistory,
          { id: category.originalId, name: category.name },
        ]);
        setCurrentParentId(category.originalId);
        setCategories(children.documents);
        setSelectedItems([]);
      } else {
        // Toggle selection (Leaf node or just node with no children yet)
        const isSelected = selectedItems.includes(category.$id);
        if (isSelected) {
          setSelectedItems(selectedItems.filter((id) => id !== category.$id));
          setSelectedCategoryObjects(
            selectedCategoryObjects.filter((obj) => obj.$id !== category.$id)
          );
        } else {
          setSelectedItems([...selectedItems, category.$id]);
          setSelectedCategoryObjects([...selectedCategoryObjects, category]);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (pathHistory.length === 0) return;

    const newHistory = [...pathHistory];
    newHistory.pop();
    const prevParent =
      newHistory.length > 0 ? newHistory[newHistory.length - 1].id : null;

    setPathHistory(newHistory);
    setCurrentParentId(prevParent);
    fetchCategories(prevParent);
  };

  const handleFinish = async () => {
    if (selectedItems.length === 0 && pathHistory.length === 0) {
      Alert.alert(
        "Select something",
        "Please select at least one interest or drill down to a category."
      );
      return;
    }

    // Move to context step instead of finishing immediately
    let finalCategories = [];
    if (selectedItems.length > 0) {
      finalCategories = selectedCategoryObjects.map((c) => c.name);
    } else if (pathHistory.length > 0) {
      finalCategories = [pathHistory[pathHistory.length - 1].name];
    } else {
      return;
    }

    // Move to context step
    setStep("context");
  };

  const handleCompleteOnboarding = async () => {
    // Get final categories
    let finalCategories = [];
    if (selectedItems.length > 0) {
      finalCategories = selectedCategoryObjects.map((c) => c.name);
    } else if (pathHistory.length > 0) {
      finalCategories = [pathHistory[pathHistory.length - 1].name];
    } else {
      return;
    }

    setSubmitting(true);
    try {
      console.log("[Onboarding] Selected categories:", finalCategories);
      console.log("[Onboarding] Learning context:", learningContext);

      // 1. Generate Keywords with context
      console.log("[Onboarding] Generating keywords...");
      const keywords = await generateKeywords(finalCategories, learningContext);
      console.log("[Onboarding] Generated keywords:", keywords);

      if (!keywords || keywords.length === 0) {
        Alert.alert(
          "Error",
          "Failed to generate keywords. Please try again or contact support."
        );
        setSubmitting(false);
        return;
      }

      // Additional validation: Ensure all keywords are valid strings ≤ 50 chars
      const validatedKeywords = keywords
        .filter((k: any) => typeof k === "string" && k.trim().length > 0)
        .map((k: string) => {
          const trimmed = k.trim();
          return trimmed.length > 50 ? trimmed.substring(0, 50) : trimmed;
        });

      console.log(
        `[Onboarding] Validated ${validatedKeywords.length} keywords for database`
      );

      // 2. Save Preferences & Update User
      console.log("[Onboarding] Saving preferences to database...");
      await completeOnboarding(
        user.$id,
        finalCategories,
        validatedKeywords,
        learningContext
      );
      console.log("[Onboarding] Successfully saved preferences");

      // 3. Update Local User Context
      if (user) user.onboarded = true;
      setUser({ ...user });

      router.replace("/home");
    } catch (error) {
      console.error("[Onboarding] Error:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#0f0f10", flex: 1 }}>
      {step === "categories" ? (
        <>
          <View style={{ padding: 20 }}>
            {pathHistory.length > 0 && (
              <TouchableOpacity
                onPress={handleGoBack}
                style={{
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FF8E01" />
                <Text style={{ color: "#FF8E01", marginLeft: 8 }}>Back</Text>
              </TouchableOpacity>
            )}

            <Text style={{ fontSize: 24, color: "white", fontWeight: "bold" }}>
              {pathHistory.length === 0
                ? "Choose your Field"
                : "Refine your Interest"}
            </Text>
            <Text style={{ color: "#CDCDE0", marginTop: 5 }}>
              Tap to explore or select.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
          >
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#FF8E01"
                style={{ marginTop: 50 }}
              />
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {categories.map((cat) => {
                  const isSelected = selectedItems.includes(cat.$id);
                  return (
                    <TouchableOpacity
                      key={cat.$id}
                      onPress={() => handleCategoryPress(cat)}
                      style={{
                        width: "48%",
                        aspectRatio: 1.2,
                        backgroundColor: isSelected ? "#FF8E01" : "#1E1E2D",
                        borderRadius: 16,
                        padding: 12,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: isSelected ? "#FF8E01" : "#232533",
                      }}
                    >
                      <Ionicons
                        name="code-slash"
                        size={32}
                        color={isSelected ? "white" : "#CDCDE0"}
                      />
                      <Text
                        style={{
                          color: isSelected ? "white" : "#CDCDE0",
                          marginTop: 10,
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View
            style={{ position: "absolute", bottom: 30, left: 20, right: 20 }}
          >
            <TouchableOpacity onPress={handleFinish} disabled={submitting}>
              <LinearGradient
                colors={["#FF9C01", "#FF8E01"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  height: 56,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                >
                  Next: Tell Us About Yourself
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={{ padding: 20 }}>
            <TouchableOpacity
              onPress={() => setStep("categories")}
              style={{
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FF8E01" />
              <Text style={{ color: "#FF8E01", marginLeft: 8 }}>Back</Text>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 24,
                color: "white",
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              Tell Us About Your Learning Goals
            </Text>
            <Text
              style={{ color: "#CDCDE0", marginBottom: 20, lineHeight: 22 }}
            >
              Help us personalize your experience. Tell us about your current
              situation, learning style, and what you hope to achieve.
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
          >
            <View
              style={{
                backgroundColor: "#1E1E2D",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: "#CDCDE0", fontSize: 14, marginBottom: 8 }}>
                💡 Example prompts:
              </Text>
              <Text style={{ color: "#7B7B8B", fontSize: 13, lineHeight: 20 }}>
                • "I'm a beginner looking to switch careers to web development"
                {"\n"}• "I have 2 years experience and want to learn advanced
                React"{"\n"}• "I prefer hands-on projects over theory-heavy
                content"{"\n"}• "I can dedicate 1-2 hours daily and want
                structured learning"
              </Text>
            </View>

            <TextInput
              value={learningContext}
              onChangeText={setLearningContext}
              placeholder="Tell us about your situation, goals, and how you'd like to learn..."
              placeholderTextColor="#7B7B8B"
              multiline
              numberOfLines={8}
              style={{
                backgroundColor: "#1E1E2D",
                borderRadius: 12,
                padding: 16,
                color: "white",
                fontSize: 16,
                minHeight: 200,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: "#232533",
              }}
            />

            <Text
              style={{
                color: "#7B7B8B",
                fontSize: 12,
                marginTop: 12,
                fontStyle: "italic",
              }}
            >
              This helps us generate more relevant content and create a
              personalized learning roadmap for you.
            </Text>
          </ScrollView>

          <View
            style={{ position: "absolute", bottom: 30, left: 20, right: 20 }}
          >
            <TouchableOpacity
              onPress={handleCompleteOnboarding}
              disabled={submitting}
            >
              <LinearGradient
                colors={["#FF9C01", "#FF8E01"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  height: 56,
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                >
                  {submitting
                    ? "Creating Your Roadmap..."
                    : learningContext.trim()
                    ? "Finish & Start Learning"
                    : "Skip & Start Learning"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default Onboarding;
