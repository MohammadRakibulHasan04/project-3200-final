import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { extractYouTubeId, getPlaylistVideos } from "../lib/youtube";

interface PlaylistPlayerProps {
  visible: boolean;
  onClose: () => void;
  playlistUrl: string;
  courseTitle: string;
}

interface PlaylistVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  position: number;
}

const PlaylistPlayer = ({
  visible,
  onClose,
  playlistUrl,
  courseTitle,
}: PlaylistPlayerProps) => {
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible && playlistUrl) {
      loadPlaylist();
    }
  }, [visible, playlistUrl]);

  const loadPlaylist = async () => {
    setLoading(true);
    setError("");

    try {
      // Extract playlist ID from URL
      const extracted = extractYouTubeId(playlistUrl);

      if (!extracted || extracted.type !== "playlist") {
        setError("Invalid playlist URL. Please try another course.");
        setLoading(false);
        return;
      }

      console.log("[PlaylistPlayer] Loading playlist:", extracted.id);

      // Fetch playlist videos
      const playlistItems = await getPlaylistVideos(extracted.id);

      if (playlistItems.length === 0) {
        setError(
          "This playlist is not accessible or has no videos. Please try another course."
        );
        setLoading(false);
        return;
      }

      // Transform to our format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedVideos: PlaylistVideo[] = playlistItems.map(
        (item: any, index: number) => ({
          id: item.contentDetails.videoId, // Use videoId as unique identifier instead of item.id
          videoId: item.contentDetails.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url,
          channelTitle: item.snippet.channelTitle,
          position: index,
        })
      );

      setVideos(transformedVideos);
      setCurrentVideoIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("[PlaylistPlayer] Error loading playlist:", err);

      // Better error message based on error type
      if (err?.response?.data?.error?.code === 404) {
        setError(
          "This playlist no longer exists or is private. Please try another course."
        );
      } else if (err?.response?.data?.error?.code === 403) {
        setError("Cannot access this playlist. It may be restricted.");
      } else {
        setError(
          "Failed to load playlist. Please check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
  };

  const handlePlayerStateChange = (state: string) => {
    if (state === "ended") {
      // Auto-play next video
      if (currentVideoIndex < videos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const renderVideoItem = ({
    item,
    index,
  }: {
    item: PlaylistVideo;
    index: number;
  }) => {
    const isCurrentVideo = index === currentVideoIndex;

    return (
      <TouchableOpacity
        style={[styles.videoItem, isCurrentVideo && styles.currentVideoItem]}
        onPress={() => handleVideoSelect(index)}
        activeOpacity={0.7}
      >
        <View style={styles.videoThumbnailContainer}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
          {isCurrentVideo && (
            <View style={styles.playingIndicator}>
              <Ionicons name="play-circle" size={28} color="#FF8E01" />
            </View>
          )}
          <View style={styles.videoPosition}>
            <Text style={styles.videoPositionText}>{index + 1}</Text>
          </View>
        </View>

        <View style={styles.videoInfo}>
          <Text
            style={[
              styles.videoTitle,
              isCurrentVideo && styles.activeVideoTitle,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text style={styles.videoChannel} numberOfLines={1}>
            {item.channelTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const currentVideo = videos[currentVideoIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {courseTitle}
            </Text>
            <Text style={styles.headerSubtitle}>
              {videos.length > 0 ? `${videos.length} videos` : "Loading..."}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8E01" />
            <Text style={styles.loadingText}>Loading course videos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF5252" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadPlaylist}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Video Player */}
            {currentVideo && (
              <View style={styles.playerContainer}>
                <YoutubePlayer
                  height={220}
                  videoId={currentVideo.videoId}
                  play={isPlaying}
                  onChangeState={handlePlayerStateChange}
                />
                <View style={styles.currentVideoInfo}>
                  <Text style={styles.currentVideoTitle} numberOfLines={2}>
                    {currentVideo.title}
                  </Text>
                  <Text style={styles.currentVideoMeta}>
                    Video {currentVideoIndex + 1} of {videos.length}
                  </Text>
                </View>
              </View>
            )}

            {/* Playlist */}
            <View style={styles.playlistContainer}>
              <Text style={styles.playlistHeader}>Course Content</Text>
              <FlatList
                data={videos}
                renderItem={renderVideoItem}
                keyExtractor={(item, index) =>
                  item?.videoId
                    ? `${item.videoId}-${index}`
                    : `video-item-${index}`
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.playlistContent}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f10",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#1E1E2D",
    borderBottomWidth: 1,
    borderBottomColor: "#232533",
  },
  closeButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#CDCDE0",
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#CDCDE0",
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#FF5252",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#FF8E01",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  playerContainer: {
    backgroundColor: "#1E1E2D",
  },
  currentVideoInfo: {
    padding: 16,
  },
  currentVideoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  currentVideoMeta: {
    color: "#CDCDE0",
    fontSize: 12,
  },
  playlistContainer: {
    flex: 1,
    marginTop: 8,
  },
  playlistHeader: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playlistContent: {
    paddingHorizontal: 16,
  },
  videoItem: {
    flexDirection: "row",
    backgroundColor: "#1E1E2D",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#232533",
  },
  currentVideoItem: {
    borderColor: "#FF8E01",
    backgroundColor: "#2A2A3E",
  },
  videoThumbnailContainer: {
    position: "relative",
    width: 120,
    height: 68,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
  },
  playingIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  videoPosition: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoPositionText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  videoInfo: {
    flex: 1,
    justifyContent: "center",
  },
  videoTitle: {
    color: "#CDCDE0",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  activeVideoTitle: {
    color: "white",
  },
  videoChannel: {
    color: "#7C7C8A",
    fontSize: 11,
  },
});

export default PlaylistPlayer;
