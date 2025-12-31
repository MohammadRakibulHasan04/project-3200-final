import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { appwriteConfig, databases } from "../../lib/appwrite";
import {
    completeStepAndMoveNext,
    generateRoadmap,
    getCurrentStep,
    getRoadmapSteps,
    RoadmapStep,
    updateStepStatus,
} from "../../lib/roadmap";

export default function Roadmap() {
  const { user } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [currentStep, setCurrentStep] = useState<RoadmapStep | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      initializeRoadmap();
      setInitialized(true);
    }
  }, [user]);

  // Refresh roadmap when screen comes into focus (e.g., after returning from profile)
  useFocusEffect(
    useCallback(() => {
      // Disabled auto-refresh to use session caching
      if (user && initialized) {
        console.log("[Roadmap] Screen focused, using cached roadmap");
        // handleRefresh(); // Removed to prevent reloading
      }
    }, [user, initialized])
  );

  const initializeRoadmap = async () => {
    setLoading(true);
    try {
      // Get user preferences
      const prefs = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.userPreferencesCollectionId!,
        [Query.equal("userId", user!.$id)]
      );

      if (prefs.documents.length === 0) {
        console.log("[Roadmap] No preferences found");
        setLoading(false);
        return;
      }

      const categories = prefs.documents[0].selectedCategories;

      // Get or generate roadmap
      let steps = await getRoadmapSteps(user!.$id);

      if (steps.length === 0) {
        console.log("[Roadmap] Generating new roadmap");
        steps = await generateRoadmap(user!.$id, categories);
      }

      setRoadmapSteps(steps);

      // Get current step
      const current = await getCurrentStep(user!.$id);
      setCurrentStep(current);
    } catch (error) {
      console.error("[Roadmap] Error initializing:", error);
      Alert.alert("Error", "Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeRoadmap();
    setRefreshing(false);
  };

  const handleStepPress = async (step: RoadmapStep) => {
    if (step.status === "not_started") {
      Alert.alert(
        "Step Locked",
        "Complete the previous steps to unlock this one.",
        [{ text: "OK" }]
      );
      return;
    }

    if (step.$id === currentStep?.$id) {
      return; // Already on this step
    }

    // Switch to this step
    setCurrentStep(step);
    await updateStepStatus(step.$id, "in_progress");

    // Refresh roadmap to show updated status
    const updatedSteps = await getRoadmapSteps(user!.$id);
    setRoadmapSteps(updatedSteps);
  };

  const handleCompleteStep = () => {
    if (!currentStep) return;

    Alert.alert(
      "Complete Step?",
      `Mark "${currentStep.title}" as completed and move to the next step?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              const nextStep = await completeStepAndMoveNext(
                user!.$id,
                currentStep.$id
              );

              // Refresh roadmap
              const updatedSteps = await getRoadmapSteps(user!.$id);
              setRoadmapSteps(updatedSteps);

              if (nextStep) {
                setCurrentStep(nextStep);
                Alert.alert("Success", "Step completed! Moving to next step.");
              } else {
                setCurrentStep(null);
                Alert.alert(
                  "Congratulations! 🎉",
                  "You have completed your entire learning roadmap!"
                );
              }
            } catch (error) {
              Alert.alert("Error", "Failed to complete step");
            }
          },
        },
      ]
    );
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "in_progress":
        return "play-circle";
      default:
        return "lock-closed";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "in_progress":
        return "#FF8E01";
      default:
        return "#7C7C8A";
    }
  };

  const renderStepItem = ({ item }: { item: RoadmapStep }) => {
    const isActive = item.$id === currentStep?.$id;
    const isLocked = item.status === "not_started";

    return (
      <TouchableOpacity
        style={{
          backgroundColor: isActive ? "#2A2A3E" : "#1E1E2D",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: isActive ? 2 : 1,
          borderColor: isActive ? "#FF8E01" : "#232533",
          opacity: isLocked ? 0.6 : 1,
        }}
        onPress={() => handleStepPress(item)}
        disabled={isLocked}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: getStatusColor(item.status) + "20",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={24}
              color={getStatusColor(item.status)}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text style={{ color: "#CDCDE0", fontSize: 12, marginRight: 8 }}>
                Step {item.stepNumber}
              </Text>
              <View
                style={{
                  backgroundColor: "#232533",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: "#CDCDE0", fontSize: 10 }}>
                  {item.category}
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: "white",
                fontSize: 15,
                fontWeight: "600",
                marginBottom: 4,
              }}
            >
              {item.title}
            </Text>
            <Text style={{ color: "#7C7C8A", fontSize: 12 }} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f10" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#FF8E01" />
          <Text style={{ color: "#CDCDE0", marginTop: 12 }}>
            Loading roadmap...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (roadmapSteps.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f10" }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Ionicons name="map-outline" size={64} color="#CDCDE0" />
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            No Roadmap Yet
          </Text>
          <Text
            style={{
              color: "#CDCDE0",
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Complete your onboarding to generate a personalized learning roadmap
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f10" }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF8E01"
            colors={["#FF8E01"]}
          />
        }
      >
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              marginBottom: 5,
            }}
          >
            Learning Roadmap
          </Text>
          <Text style={{ color: "#CDCDE0", fontSize: 14 }}>
            Follow your personalized path to mastery
          </Text>
        </View>

        {/* Roadmap Steps */}
        <View style={{ paddingHorizontal: 20 }}>
          {roadmapSteps.map((step) => (
            <View key={step.$id}>{renderStepItem({ item: step })}</View>
          ))}
        </View>

        {/* Current Step Actions */}
        {currentStep && (
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
            <View
              style={{
                backgroundColor: "#1E1E2D",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#232533",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 12,
                }}
              >
                Current Step: {currentStep.title}
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    // Navigate to courses tab
                    const navigation =
                      require("@react-navigation/native").useNavigation;
                    // Since we're in tabs, we can use router
                    const router = require("expo-router").router;
                    router.push("/(tabs)/courses");
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#FF8E01",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="school" size={20} color="white" />
                  <Text
                    style={{ color: "white", fontSize: 14, fontWeight: "600" }}
                  >
                    View Courses
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCompleteStep}
                  style={{
                    flex: 1,
                    backgroundColor: "#4CAF50",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text
                    style={{ color: "white", fontSize: 14, fontWeight: "600" }}
                  >
                    Complete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
