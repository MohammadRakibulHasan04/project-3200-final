import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import SearchFooter from "../../components/SearchFooter";
import VideoCard from "../../components/VideoCard";
import { useGlobalContext } from "../../context/GlobalProvider";
import { appwriteConfig, databases } from "../../lib/appwrite";
import { getRecentVideos } from "../../lib/perplexity";
import { getVideosByKeywords } from "../../lib/youtube";

const Home = () => {
  const { user } = useGlobalContext();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (user && !hasFetched.current) {
      fetchFeed();
      hasFetched.current = true;
    }
  }, [user]);

  // Refresh feed when screen comes into focus (e.g., after returning from profile)
  useFocusEffect(
    useCallback(() => {
      // Focus effect logic if needed in future (e.g. status bar update)
      // We removed the automatic fetchFeed(false) here to cache the current video list
      // The list will only update on initial load (useEffect) or manual refresh
      if (user) {
        // Optional: Check if we need to re-validate auth or other lightweight checks
      }
    }, [user])
  );

  const fetchFeed = async (forceRefresh = false, customSearch = "") => {
    setLoading(true);
    try {
      console.log(
        `[Home] Fetching feed... (refresh: ${forceRefresh}, custom: ${!!customSearch})`
      );
      // 1. Get User Preferences to find categories
      const prefs = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.userPreferencesCollectionId!,
        [Query.equal("userId", user!.$id)]
      );

      if (prefs.documents.length > 0) {
        const categories = prefs.documents[0].selectedCategories;
        const learningContext = prefs.documents[0].learningContext;

        // 2. Fetch Videos based on custom query or preferences
        let fetchedVideos;

        if (customSearch.trim()) {
          // User has specified what they're looking for
          console.log("[Home] Fetching based on custom query:", customSearch);

          // Combine custom query with user categories to maintain relevance
          const contextualQuery = `${customSearch} ${categories.join(
            " "
          )} tutorial course`;
          fetchedVideos = await getVideosByKeywords([contextualQuery]);
        } else if (forceRefresh) {
          console.log("[Home] Using Perplexity API for fresh content...");
          const courses = await getRecentVideos(categories);
          // Convert Course objects to video format for VideoCard
          fetchedVideos = courses.map((course, index) => ({
            id: {
              videoId:
                course.id || course.url || `refresh-${Date.now()}-${index}`,
            },
            snippet: {
              title: course.title,
              description: course.description,
              channelTitle: course.channelTitle || "YouTube",
              thumbnails: {
                high: { url: course.thumbnailUrl || "" },
              },
            },
            url: course.url,
            level: course.level,
          }));
        } else {
          console.log("[Home] Using YouTube for initial load...");
          const keywords = prefs.documents[0].keywords || categories;
          fetchedVideos = await getVideosByKeywords(keywords);
        }

        setVideos(fetchedVideos);
        console.log(`[Home] Loaded ${fetchedVideos.length} videos`);
      } else {
        // Handle case where preferences are missing? Should not happen if onboarded.
        console.log("No preferences found");
      }
    } catch (error) {
      console.log("Error fetching feed:", error);
      Alert.alert("Error", "Could not load your personalized feed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log("[Home] Manual refresh triggered - fetching fresh content");
    await fetchFeed(true); // Force refresh with Perplexity API
    setRefreshing(false);
  };

  const handleCustomSearch = async () => {
    if (!customQuery.trim()) {
      Alert.alert("Empty Query", "Please enter what you're looking for");
      return;
    }

    setRefreshing(true);
    console.log("[Home] Custom search:", customQuery);
    await fetchFeed(false, customQuery.trim());
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ backgroundColor: "#0f0f10", flex: 1 }}>
      <FlatList
        data={videos}
        keyExtractor={(item, index) =>
          item?.id?.videoId || item?.id || `video-${index}-${Date.now()}`
        }
        renderItem={({ item }) => <VideoCard video={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF8E01"
            colors={["#FF8E01"]}
          />
        }
        ListHeaderComponent={() => (
          <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
            <View
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexDirection: "row",
                marginBottom: 20,
              }}
            >
              <View>
                <Text style={{ fontSize: 14, color: "#CDCDE0" }}>
                  Welcome Back,
                </Text>
                <Text
                  style={{ fontSize: 24, fontWeight: "bold", color: "white" }}
                >
                  {user?.username}
                </Text>
              </View>
              <View style={{ marginTop: 1.5 }}>
                <TouchableOpacity onPress={() => router.push("/profile")}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: "white",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#1E1E2D",
                    }}
                  >
                    <Image
                      source={require("../../assets/images/profile.png")}
                      style={{ width: 36, height: 36, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ color: "#CDCDE0", fontSize: 14, marginBottom: 5 }}>
              Based on your interests
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: "white",
                marginBottom: 10,
              }}
            >
              {refreshing ? "Fetching Latest Videos..." : "Recommended Videos"}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#FF8E01" />
            ) : (
              <Text style={{ color: "white" }}>No videos found.</Text>
            )}
          </View>
        )}
        ListFooterComponent={
          <SearchFooter
            query={customQuery}
            setQuery={setCustomQuery}
            onSearch={handleCustomSearch}
            isRefreshing={refreshing}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default Home;
