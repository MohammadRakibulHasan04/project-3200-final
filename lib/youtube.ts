import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// API Key Rotation - support multiple keys
const YOUTUBE_API_KEYS = [
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY,
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY_2,
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY_3,
].filter(Boolean); // Remove undefined keys

// Log API key configuration on module load
console.log(
  `[YouTube] 🔑 Initialized with ${YOUTUBE_API_KEYS.length} API keys`
);
if (YOUTUBE_API_KEYS.length === 0) {
  console.error(
    "[YouTube] ⚠️  WARNING: No API keys configured! Check your .env file"
  );
} else {
  YOUTUBE_API_KEYS.forEach((key, index) => {
    const maskedKey = key
      ? `${key.slice(0, 8)}...${key.slice(-4)}`
      : "undefined";
    console.log(`[YouTube] Key #${index + 1}: ${maskedKey}`);
  });
}

let currentKeyIndex = 0;
const exhaustedKeys = new Set<number>(); // Track exhausted keys

// Get current API key with rotation support
const getAPIKey = () => {
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error("[YouTube] No API keys configured!");
    return null;
  }

  // If all keys are exhausted, reset and try again
  if (exhaustedKeys.size === YOUTUBE_API_KEYS.length) {
    console.warn("[YouTube] All API keys exhausted, resetting...");
    exhaustedKeys.clear();
  }

  // Find next non-exhausted key
  let attempts = 0;
  while (
    exhaustedKeys.has(currentKeyIndex) &&
    attempts < YOUTUBE_API_KEYS.length
  ) {
    currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
    attempts++;
  }

  console.log(
    `[YouTube] Using API key #${currentKeyIndex + 1}/${YOUTUBE_API_KEYS.length}`
  );
  return YOUTUBE_API_KEYS[currentKeyIndex];
};

// Mark current key as exhausted and rotate
const markKeyExhausted = () => {
  console.warn(`[YouTube] API key #${currentKeyIndex + 1} quota exhausted`);
  exhaustedKeys.add(currentKeyIndex);
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
};

// Rotate to next API key
const rotateAPIKey = () => {
  if (YOUTUBE_API_KEYS.length > 1) {
    const oldIndex = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
    console.log(
      `[YouTube] Rotated from key #${oldIndex + 1} to key #${
        currentKeyIndex + 1
      }`
    );
  }
};

// Reset exhausted keys (call this when quotas reset or for testing)
export const resetAPIKeyRotation = () => {
  exhaustedKeys.clear();
  currentKeyIndex = 0;
  console.log("[YouTube] API key rotation reset - all keys available");
};

// Get API key stats (useful for debugging)
export const getAPIKeyStats = () => {
  return {
    totalKeys: YOUTUBE_API_KEYS.length,
    currentKey: currentKeyIndex + 1,
    exhaustedKeys: exhaustedKeys.size,
    availableKeys: YOUTUBE_API_KEYS.length - exhaustedKeys.size,
  };
};

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const QUOTA_EXCEEDED_FLAG = "youtube_quota_exceeded";

// Check if quota is exceeded (cached for 24 hours)
const isQuotaExceeded = async () => {
  try {
    const flag = await AsyncStorage.getItem(QUOTA_EXCEEDED_FLAG);
    if (flag) {
      const timestamp = JSON.parse(flag);
      const now = Date.now();
      // Check if less than 24 hours since quota exceeded
      if (now - timestamp < CACHE_EXPIRY) {
        console.warn(
          "[YouTube] API quota exceeded. Using cached/alternative data."
        );
        return true;
      } else {
        // Clear flag after 24 hours
        await AsyncStorage.removeItem(QUOTA_EXCEEDED_FLAG);
      }
    }
    return false;
  } catch (error) {
    console.error("[YouTube] Error checking quota flag:", error);
    return false;
  }
};

// Mark quota as exceeded
const markQuotaExceeded = async () => {
  try {
    await AsyncStorage.setItem(QUOTA_EXCEEDED_FLAG, JSON.stringify(Date.now()));
  } catch (error) {
    console.error("[YouTube] Error setting quota flag:", error);
  }
};

// Handle YouTube API errors with detailed diagnosis
const handleYouTubeError = async (error, operation = "YouTube API") => {
  const status = error?.response?.status;
  const errorData = error?.response?.data;
  const errorMessage = errorData?.error?.message || error?.message;
  const errorReason = errorData?.error?.errors?.[0]?.reason;

  console.error(`[YouTube] ${operation} Error:`, {
    status,
    reason: errorReason,
    message: errorMessage,
  });

  // Handle quota exceeded
  if (
    status === 403 &&
    (errorReason === "quotaExceeded" || errorReason === "dailyLimitExceeded")
  ) {
    console.error(
      `[YouTube] ⚠️  QUOTA EXCEEDED on key #${currentKeyIndex + 1}`
    );
    markKeyExhausted();

    // Check if we have more keys available
    if (exhaustedKeys.size < YOUTUBE_API_KEYS.length) {
      console.log(
        `[YouTube] ${
          YOUTUBE_API_KEYS.length - exhaustedKeys.size
        } keys remaining, will retry...`
      );
      return { quotaExceeded: true, shouldRetry: true };
    } else {
      console.error(
        "[YouTube] ⚠️  ALL API KEYS EXHAUSTED. Solutions:",
        "\n1. Wait 24 hours for quota reset (resets at midnight Pacific Time)",
        "\n2. Enable billing in Google Cloud Console for higher quota",
        "\n3. Create additional API keys"
      );
      await markQuotaExceeded();
      return { quotaExceeded: true, shouldRetry: false };
    }
  }

  // Handle other 403 errors (invalid key, etc.)
  if (status === 403) {
    console.error(
      `[YouTube] ⚠️  ACCESS DENIED on key #${
        currentKeyIndex + 1
      } - Possible causes:`,
      "\n1. API key invalid or revoked",
      "\n2. YouTube Data API v3 not enabled in Google Cloud Console",
      "\n3. IP/referrer restrictions blocking requests"
    );
    // Mark key as potentially invalid and try next
    markKeyExhausted();
    return {
      accessDenied: true,
      shouldRetry: exhaustedKeys.size < YOUTUBE_API_KEYS.length,
    };
  }

  // Handle 400 errors
  if (status === 400) {
    console.error("[YouTube] ⚠️  BAD REQUEST - Check API parameters");
  }

  return { error: errorMessage, shouldRetry: false };
};

// Cache management
const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp < CACHE_EXPIRY) {
        console.log("[YouTube] Using cached data for:", key);
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error("[YouTube] Cache read error:", error);
    return null;
  }
};

const setCachedData = async (key, data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheObject));
  } catch (error) {
    console.error("[YouTube] Cache write error:", error);
  }
};

export const searchVideos = async (query) => {
  // Check if quota is exceeded
  if (await isQuotaExceeded()) {
    const cached = await getCachedData(`search_${query}`);
    if (cached) return cached;
    console.warn("[YouTube] No cached data available for:", query);
    return [];
  }

  // Try all available keys
  const maxAttempts = YOUTUBE_API_KEYS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        console.error("[YouTube] No API key available");
        return [];
      }

      console.log(
        `[YouTube] Searching videos (attempt ${attempt + 1}/${maxAttempts})...`
      );

      const response = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
        params: {
          part: "snippet",
          q: query,
          type: "video",
          maxResults: 10,
          key: apiKey,
          videoEmbeddable: "true",
          relevanceLanguage: "en",
        },
      });

      const items = response.data.items;
      console.log(`[YouTube] ✅ Found ${items.length} videos`);

      // Cache the results
      await setCachedData(`search_${query}`, items);
      return items;
    } catch (error) {
      const result = await handleYouTubeError(error, "Video Search");

      // If we should retry with next key, continue loop
      if (result?.shouldRetry && attempt < maxAttempts - 1) {
        console.log("[YouTube] Retrying with next API key...");
        continue;
      }

      // All attempts failed or shouldn't retry
      break;
    }
  }

  // All keys failed, try to return cached data
  console.warn("[YouTube] All API keys failed, attempting cache...");
  const cached = await getCachedData(`search_${query}`);
  if (cached) {
    console.log("[YouTube] Returning cached data");
    return cached;
  }

  console.error("[YouTube] No data available for:", query);
  return [];
};

export const getVideosByKeywords = async (keywords) => {
  if (!keywords || keywords.length === 0) return [];

  // Check quota before proceeding
  if (await isQuotaExceeded()) {
    const cacheKey = `keywords_${keywords.slice(0, 2).join("_")}`;
    const cached = await getCachedData(cacheKey);
    if (cached) return cached;
    console.warn("[YouTube] Quota exceeded, no cached data for keywords");
    return [];
  }

  // Shuffle or Pick random 2-3 keywords to vary the feed
  const shuffled = keywords.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 2).join(" "); // combine 2 keywords for context

  // Append "tutorial" or "course" to ensure educational content
  const query = `${selected} tutorial course`;

  return await searchVideos(query);
};

// Search for YouTube playlists (courses/tutorials)
export const searchPlaylists = async (query, maxResults = 10) => {
  const cacheKey = `playlists_${query}_${maxResults}`;

  // Check quota before proceeding
  if (await isQuotaExceeded()) {
    const cached = await getCachedData(cacheKey);
    if (cached) return cached;
    console.warn("[YouTube] Quota exceeded, no cached playlists for:", query);
    return [];
  }

  // Try all available keys
  const maxAttempts = YOUTUBE_API_KEYS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        console.error("[YouTube] No API key available");
        return [];
      }

      console.log(
        `[YouTube] Searching playlists for: ${query} (attempt ${
          attempt + 1
        }/${maxAttempts})`
      );

      const response = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
        params: {
          part: "snippet",
          q: query,
          type: "playlist",
          maxResults,
          key: apiKey,
          relevanceLanguage: "en",
          order: "relevance",
        },
      });

      const items = response.data.items || [];
      console.log(`[YouTube] ✅ Found ${items.length} playlists`);

      // Cache the results
      await setCachedData(cacheKey, items);
      return items;
    } catch (error) {
      const result = await handleYouTubeError(error, "Playlist Search");

      // If we should retry with next key, continue loop
      if (result?.shouldRetry && attempt < maxAttempts - 1) {
        console.log("[YouTube] Retrying playlist search with next API key...");
        continue;
      }

      // All attempts failed or shouldn't retry
      break;
    }
  }

  // All keys failed, try to return cached data
  console.warn(
    "[YouTube] All API keys failed for playlists, attempting cache..."
  );
  const cached = await getCachedData(cacheKey);
  if (cached) {
    console.log("[YouTube] Returning cached playlists");
    return cached;
  }

  console.error("[YouTube] No playlist data available for:", query);
  return [];
};

// Get playlist details including video count and description
export const getPlaylistDetails = async (playlistId) => {
  const cacheKey = `playlist_details_${playlistId}`;

  // Check quota before proceeding
  if (await isQuotaExceeded()) {
    const cached = await getCachedData(cacheKey);
    if (cached) return cached;
    console.warn(
      "[YouTube] Quota exceeded, no cached details for:",
      playlistId
    );
    return null;
  }

  // Try all available keys
  const maxAttempts = YOUTUBE_API_KEYS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        console.error("[YouTube] No API key available");
        return null;
      }

      console.log(
        `[YouTube] Getting playlist details for: ${playlistId} (attempt ${
          attempt + 1
        }/${maxAttempts})`
      );
      const response = await axios.get(`${YOUTUBE_BASE_URL}/playlists`, {
        params: {
          part: "snippet,contentDetails",
          id: playlistId,
          key: apiKey,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        const details = response.data.items[0];
        // Cache the results
        await setCachedData(cacheKey, details);
        return details;
      }
      return null;
    } catch (error) {
      const result = await handleYouTubeError(error, "Playlist Details");

      // If we should retry with next key, continue loop
      if (result?.shouldRetry && attempt < maxAttempts - 1) {
        console.log("[YouTube] Retrying playlist details with next API key...");
        continue;
      }

      // All attempts failed or shouldn't retry
      break;
    }
  }

  // All keys failed, try to return cached data
  const cached = await getCachedData(cacheKey);
  if (cached) {
    console.log("[YouTube] Returning cached playlist details");
    return cached;
  }

  return null;
};

// Get videos from a playlist
export const getPlaylistVideos = async (playlistId, maxResults = 50) => {
  const cacheKey = `playlist_videos_${playlistId}_${maxResults}`;

  // Check quota before proceeding
  if (await isQuotaExceeded()) {
    const cached = await getCachedData(cacheKey);
    if (cached) return cached;
    console.warn("[YouTube] Quota exceeded, no cached videos for:", playlistId);
    return [];
  }

  // Try all available keys
  const maxAttempts = YOUTUBE_API_KEYS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        console.error("[YouTube] No API key available");
        return [];
      }

      console.log(
        `[YouTube] Getting videos from playlist: ${playlistId} (attempt ${
          attempt + 1
        }/${maxAttempts})`
      );
      const response = await axios.get(`${YOUTUBE_BASE_URL}/playlistItems`, {
        params: {
          part: "snippet,contentDetails",
          playlistId,
          maxResults,
          key: apiKey,
        },
      });

      const items = response.data.items || [];
      console.log(`[YouTube] ✅ Found ${items.length} videos in playlist`);

      // Cache the results
      await setCachedData(cacheKey, items);
      return items;
    } catch (error) {
      const result = await handleYouTubeError(error, "Playlist Videos");

      // If we should retry with next key, continue loop
      if (result?.shouldRetry && attempt < maxAttempts - 1) {
        console.log("[YouTube] Retrying playlist videos with next API key...");
        continue;
      }

      // All attempts failed or shouldn't retry
      break;
    }
  }

  // All keys failed, try to return cached data
  const cached = await getCachedData(cacheKey);
  if (cached) {
    console.log("[YouTube] Returning cached playlist videos");
    return cached;
  }

  return [];
};

// Extract YouTube video or playlist ID from URL
export const extractYouTubeId = (url) => {
  if (!url) return null;

  try {
    // Playlist patterns
    const playlistMatch = url.match(/[?&]list=([^&]+)/);
    if (playlistMatch) {
      return { type: "playlist", id: playlistMatch[1] };
    }

    // Video patterns
    const videoPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
      /youtube\.com\/embed\/([^&?/]+)/,
      /youtube\.com\/v\/([^&?/]+)/,
    ];

    for (const pattern of videoPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { type: "video", id: match[1] };
      }
    }

    return null;
  } catch (error) {
    console.error("[YouTube] Error extracting ID:", error);
    return null;
  }
};

// Search for course-like content (playlists and long videos)
export const searchCourses = async (topic, maxResults = 6) => {
  const cacheKey = `courses_${topic}_${maxResults}`;

  // Check quota before proceeding
  if (await isQuotaExceeded()) {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("[YouTube] Returning cached courses for:", topic);
      return cached;
    }
    console.warn("[YouTube] Quota exceeded, no cached courses for:", topic);
    return [];
  }

  try {
    console.log("[YouTube] Searching for courses on:", topic);

    // Search for playlists (courses/tutorials)
    const playlistQuery = `${topic} course tutorial complete`;
    const playlists = await searchPlaylists(playlistQuery, maxResults);

    if (playlists.length === 0) {
      console.log("[YouTube] No playlists found for:", topic);
      return [];
    }

    // Transform playlists into course format with validation
    const coursePromises = playlists.map(async (playlist) => {
      try {
        const playlistId = playlist.id.playlistId;

        // Validate that the playlist exists and get details
        const details = await getPlaylistDetails(playlistId);

        if (!details) {
          console.log(
            "[YouTube] Playlist not found or inaccessible:",
            playlistId
          );
          return null;
        }

        const videoCount = details?.contentDetails?.itemCount || 0;

        // Only include playlists with actual videos
        if (videoCount === 0) {
          console.log("[YouTube] Playlist is empty:", playlistId);
          return null;
        }

        return {
          id: playlistId,
          title: playlist.snippet.title,
          description:
            playlist.snippet.description || "No description available",
          platform: "YouTube",
          channelTitle: playlist.snippet.channelTitle,
          thumbnailUrl:
            playlist.snippet.thumbnails.high?.url ||
            playlist.snippet.thumbnails.default?.url,
          videoCount,
          type: "playlist",
          url: `https://www.youtube.com/playlist?list=${playlistId}`,
        };
      } catch (error) {
        console.error("[YouTube] Error processing playlist:", error);
        return null;
      }
    });

    const courses = await Promise.all(coursePromises);

    // Filter out null values (failed validations)
    const validCourses = courses.filter((c) => c !== null);

    console.log("[YouTube] Found", validCourses.length, "valid courses");

    // Cache the results
    await setCachedData(cacheKey, validCourses);

    return validCourses;
  } catch (error) {
    await handleYouTubeError(error, "Course Search");

    // Try to return cached data on error
    const cached = await getCachedData(cacheKey);
    if (cached) {
      console.log("[YouTube] Returning cached courses due to error");
      return cached;
    }

    return [];
  }
};

// Clear YouTube cache (useful for troubleshooting)
export const clearYouTubeCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const youtubeKeys = keys.filter(
      (key) =>
        key.startsWith("search_") ||
        key.startsWith("playlists_") ||
        key.startsWith("playlist_") ||
        key.startsWith("courses_") ||
        key.startsWith("keywords_")
    );
    await AsyncStorage.multiRemove(youtubeKeys);
    console.log(
      "[YouTube] Cache cleared:",
      youtubeKeys.length,
      "items removed"
    );
  } catch (error) {
    console.error("[YouTube] Error clearing cache:", error);
  }
};

// Reset quota flag manually
export const resetQuotaFlag = async () => {
  try {
    await AsyncStorage.removeItem(QUOTA_EXCEEDED_FLAG);
    console.log("[YouTube] Quota flag reset - API will be retried");
  } catch (error) {
    console.error("[YouTube] Error resetting quota flag:", error);
  }
};
