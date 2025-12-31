import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import PlaylistPlayer from "../../components/PlaylistPlayer";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
    fetchAndSavePlaylistsForStep,
    getCurrentStep,
    getSavedVideosForStep,
    RoadmapStep,
    SavedVideo,
} from "../../lib/roadmap";

export default function Courses() {
  const { user } = useGlobalContext();
  const [courses, setCourses] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<SavedVideo | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<RoadmapStep | null>(null);

  // Cache management - session-based for same step
  const cachedStepId = useRef<string | null>(null);
  const isFetching = useRef<boolean>(false);

  // Smart fetch: Check for step changes on focus
  useFocusEffect(
    useCallback(() => {
      if (user && !isFetching.current) {
        // Always check if the active step has changed when returning to screen
        fetchCourses(false);
      }
    }, [user])
  );

  const fetchCourses = async (forceRefresh = false) => {
    // Prevent duplicate fetches
    if (isFetching.current && !forceRefresh) {
      console.log("[Courses] Already fetching, skipping...");
      return;
    }

    isFetching.current = true;
    setLoading(true);

    try {
      console.log("[Courses] Fetching current step playlists...");

      // Get current active step
      const step = await getCurrentStep(user!.$id);

      // Check if step changed
      const stepChanged = step?.$id !== cachedStepId.current;

      setCurrentStep(step);

      if (!step) {
        console.log("[Courses] No active step found");
        setCourses([]);
        cachedStepId.current = null;
        setLoading(false);
        isFetching.current = false;
        return;
      }

      // Only fetch videos if step changed or forced refresh
      if (stepChanged || forceRefresh || courses.length === 0) {
        console.log(
          "[Courses] Step changed or refresh requested, fetching videos..."
        );

        // Get saved videos for current step
        const videos = await getSavedVideosForStep(step.$id);

        if (videos.length === 0 && !step.playlistsFetched) {
          // Fetch playlists for the first time
          console.log("[Courses] Fetching playlists for step:", step.title);
          const newVideos = await fetchAndSavePlaylistsForStep(step);
          setCourses(newVideos);
        } else {
          setCourses(videos);
        }

        // Update cache - will persist for entire session for this step
        cachedStepId.current = step.$id;
        console.log("[Courses] Cached playlists for step:", step.$id);
      } else {
        console.log("[Courses] Using session cache for same step");
      }
    } catch (error) {
      console.error("[Courses] Error fetching courses:", error);
      Alert.alert("Error", "Could not load course playlists");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Force refresh to bypass cache
    await fetchCourses(true);
    setRefreshing(false);
  };

  const handleCoursePress = (course: SavedVideo) => {
    console.log("[Courses] Opening course:", course.title);
    setSelectedCourse(course);
    setPlayerVisible(true);
  };

  const handleClosePlayer = () => {
    setPlayerVisible(false);
    setSelectedCourse(null);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "#4CAF50";
      case "intermediate":
        return "#FF8E01";
      case "advanced":
        return "#FF5252";
      default:
        return "#CDCDE0";
    }
  };

  const renderCourse = ({ item }: { item: SavedVideo }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#1E1E2D",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#232533",
      }}
      activeOpacity={0.7}
      onPress={() => handleCoursePress(item)}
    >
      {/* Course Thumbnail */}
      {item.thumbnailUrl && (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={{ width: "100%", height: 180 }}
          resizeMode="cover"
        />
      )}

      {/* Course Info */}
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 4,
              }}
            >
              {item.title}
            </Text>
            {item.channelTitle && (
              <Text style={{ color: "#CDCDE0", fontSize: 11, marginBottom: 6 }}>
                {item.channelTitle}
              </Text>
            )}
            <Text
              style={{ color: "#CDCDE0", fontSize: 12, marginBottom: 8 }}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>
          <Ionicons name="play-circle" size={28} color="#FF8E01" />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              style={{
                backgroundColor: "#232533",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name="logo-youtube" size={14} color="#FF0000" />
              <Text
                style={{ color: "#CDCDE0", fontSize: 11, fontWeight: "600" }}
              >
                YouTube
              </Text>
            </View>

            {item.videoCount && item.videoCount > 0 && (
              <View
                style={{
                  backgroundColor: "#232533",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{ color: "#CDCDE0", fontSize: 11, fontWeight: "600" }}
                >
                  {item.videoCount} videos
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: getLevelColor(item.level) + "20",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: getLevelColor(item.level),
            }}
          >
            <Text
              style={{
                color: getLevelColor(item.level),
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {item.level}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f0f10" }}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "white",
            marginBottom: 5,
          }}
        >
          {currentStep ? currentStep.title : "Your Courses"}
        </Text>
        <Text style={{ color: "#CDCDE0", fontSize: 14, marginBottom: 20 }}>
          {currentStep
            ? currentStep.description
            : "Complete your roadmap to see courses"}
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#FF8E01" />
          <Text style={{ color: "#CDCDE0", marginTop: 12 }}>
            Finding best courses for you...
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
          }}
        >
          <Ionicons name="school-outline" size={64} color="#CDCDE0" />
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            {currentStep ? "No Playlists Available" : "No Active Step"}
          </Text>
          <Text
            style={{
              color: "#CDCDE0",
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {currentStep
              ? "Check back soon for curated playlists"
              : "Complete your onboarding and check your roadmap"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourse}
          keyExtractor={(item, index) => item?.$id || `course-${index}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF8E01"
              colors={["#FF8E01"]}
            />
          }
        />
      )}

      {/* Playlist Player Modal */}
      {selectedCourse && (
        <PlaylistPlayer
          visible={playerVisible}
          onClose={handleClosePlayer}
          playlistUrl={selectedCourse.url}
          courseTitle={selectedCourse.title}
        />
      )}
    </SafeAreaView>
  );
}
