import axios from "axios";
import { searchCourses } from "./youtube";

const PERPLEXITY_API_KEY = process.env.EXPO_PUBLIC_PERPLEXITY_API_KEY2;
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";

interface Course {
  id?: string;
  title: string;
  description: string;
  platform: string;
  url: string;
  level: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  videoCount?: number;
  type?: string;
}

// Generate fallback courses from YouTube directly
const generateFallbackCourses = async (
  categories: string[]
): Promise<Course[]> => {
  console.log(
    "[Perplexity] Using YouTube fallback for categories:",
    categories
  );

  try {
    // Fetch YouTube playlists for each category
    const allCourses: Course[] = [];

    for (const category of categories.slice(0, 3)) {
      // Limit to 3 categories
      const youtubeCourses = await searchCourses(category, 2); // 2 courses per category
      allCourses.push(
        ...youtubeCourses.map((course) => ({
          ...course,
          level: "Beginner", // Default level for YouTube courses
        }))
      );
    }

    return allCourses.slice(0, 6); // Return max 6 courses
  } catch (error) {
    console.error("[Perplexity] YouTube fallback error:", error);
    // Return static fallback if YouTube also fails
    return categories.slice(0, 3).map((category) => ({
      title: `${category} Complete Course`,
      description: `Learn ${category} from scratch with hands-on projects`,
      platform: "YouTube",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        category + " complete course tutorial"
      )}`,
      level: "Beginner",
    }));
  }
};

export const getCourseRecommendations = async (
  categories: string[]
): Promise<Course[]> => {
  console.log(
    "[Perplexity] Fetching YouTube course recommendations for:",
    categories
  );

  // Validate API key - if missing, go straight to YouTube
  if (!PERPLEXITY_API_KEY) {
    console.error("[Perplexity] API key is missing! Using YouTube fallback.");
    return generateFallbackCourses(categories);
  }

  try {
    // NEW STRATEGY: Ask Perplexity for search keywords/topics, not URLs
    // This avoids hallucinated playlist IDs
    const prompt = `You are a learning path expert. For someone interested in ${categories.join(
      ", "
    )}, suggest 6 specific course topics or search terms that would help them find YouTube playlists.

For each topic, provide:
- title: Specific course topic (e.g., "Python for Data Science", "React Hooks Tutorial")
- description: Brief 1-sentence description of what they'll learn
- level: Beginner, Intermediate, or Advanced
- searchQuery: The exact search term to use on YouTube (e.g., "python data science complete course")

Return ONLY a JSON array, no markdown. Example:
[{"title": "...", "description": "...", "level": "...", "searchQuery": "..."}]`;

    console.log("[Perplexity] Requesting course topics...");

    const response = await axios.post(
      PERPLEXITY_URL,
      {
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a learning path expert who suggests relevant course topics and search terms. Never make up URLs or playlist IDs.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[Perplexity] Received response");

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error(
        "[Perplexity] No content in response. Using YouTube fallback."
      );
      return generateFallbackCourses(categories);
    }

    console.log("[Perplexity] Raw response:", content);

    // Clean up response - extract JSON
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");

    const firstBracket = jsonStr.indexOf("[");
    const lastBracket = jsonStr.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      console.error(
        "[Perplexity] Could not find JSON array. Using YouTube fallback."
      );
      return generateFallbackCourses(categories);
    }

    jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);

    console.log("[Perplexity] Cleaned JSON:", jsonStr);

    interface TopicSuggestion {
      title: string;
      description: string;
      level: string;
      searchQuery: string;
    }

    const topics: TopicSuggestion[] = JSON.parse(jsonStr);

    if (!Array.isArray(topics) || topics.length === 0) {
      console.error(
        "[Perplexity] Invalid topics array. Using YouTube fallback."
      );
      return generateFallbackCourses(categories);
    }

    console.log(
      "[Perplexity] Got",
      topics.length,
      "course topics, now fetching real playlists from YouTube..."
    );

    // Now use YouTube API to find REAL playlists for each topic
    const allCourses: Course[] = [];

    for (const topic of topics.slice(0, 6)) {
      try {
        // Search YouTube for actual playlists using the suggested query
        const youtubeCourses = await searchCourses(topic.searchQuery, 1); // Get 1 best match per topic

        if (youtubeCourses.length > 0) {
          const course = youtubeCourses[0];
          allCourses.push({
            ...course,
            title: topic.title, // Use Perplexity's nicer title
            description: topic.description, // Use Perplexity's description
            level: topic.level, // Use Perplexity's level
          });
        }
      } catch (error) {
        console.error(
          "[Perplexity] Error fetching playlist for topic:",
          topic.title,
          error
        );
      }
    }

    if (allCourses.length === 0) {
      console.error(
        "[Perplexity] No playlists found from YouTube. Using fallback."
      );
      return generateFallbackCourses(categories);
    }

    console.log(
      "[Perplexity] Successfully fetched",
      allCourses.length,
      "real YouTube playlists"
    );
    return allCourses;
  } catch (error: any) {
    console.error(
      "[Perplexity] Error:",
      error?.response?.data || error?.message || error
    );

    if (error?.response?.status === 400) {
      console.error("[Perplexity] 400 Bad Request - Invalid request");
      console.error(
        "[Perplexity] Error details:",
        JSON.stringify(error?.response?.data, null, 2)
      );
      console.error("[Perplexity] API Key present:", !!PERPLEXITY_API_KEY);
      console.error("[Perplexity] Model used: sonar");
    } else if (error?.response?.status === 401) {
      console.error("[Perplexity] 401 Unauthorized - Check API key");
    } else if (error?.response?.status === 429) {
      console.error("[Perplexity] 429 Rate limit exceeded");
    } else if (error?.code === "ECONNABORTED") {
      console.error("[Perplexity] Request timeout");
    }

    console.log("[Perplexity] Using YouTube fallback courses");
    return generateFallbackCourses(categories);
  }
};

/**
 * Get recent trending videos based on user preferences
 * Used for home feed refresh functionality
 */
export const getRecentVideos = async (
  categories: string[]
): Promise<Course[]> => {
  console.log("[Perplexity] Fetching recent trending videos for:", categories);

  // Validate API key - if missing, go straight to YouTube
  if (!PERPLEXITY_API_KEY) {
    console.error("[Perplexity] API key is missing! Using YouTube fallback.");
    return generateFallbackCourses(categories);
  }

  try {
    const prompt = `You are a trending content expert. Based on these interests: ${categories.join(
      ", "
    )}, suggest 8 recent/trending YouTube video topics from the past month that would be valuable for learning.

For each topic, provide:
- title: Specific video topic (e.g., "New React 19 Features", "Python 3.12 Updates")
- description: Brief 1-sentence description
- level: Beginner, Intermediate, or Advanced
- searchQuery: Exact YouTube search term including "2024" or "2025" or "latest" for recency

Focus on:
- Recent tutorials and updates (last 3-6 months)
- Trending topics in these categories
- Practical, hands-on content
- Mix of beginner and intermediate content

Return ONLY a JSON array, no markdown. Example:
[{"title": "...", "description": "...", "level": "...", "searchQuery": "..."}]`;

    console.log("[Perplexity] Requesting recent video topics...");

    const response = await axios.post(
      PERPLEXITY_URL,
      {
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a trending content expert who suggests current, relevant video topics and search terms. Focus on recent content from 2024-2025. Never make up URLs.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5, // Slightly higher for more diverse suggestions
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("[Perplexity] Received response for recent videos");

    const content = response.data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error(
        "[Perplexity] No content in response. Using YouTube fallback."
      );
      return generateFallbackCourses(categories);
    }

    // Clean up response - extract JSON
    let jsonStr = content.trim();
    jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");

    const firstBracket = jsonStr.indexOf("[");
    const lastBracket = jsonStr.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      console.error(
        "[Perplexity] Could not find JSON array. Using YouTube fallback."
      );
      return generateFallbackCourses(categories);
    }

    jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);

    interface TopicSuggestion {
      title: string;
      description: string;
      level: string;
      searchQuery: string;
    }

    const topics: TopicSuggestion[] = JSON.parse(jsonStr);

    if (!Array.isArray(topics) || topics.length === 0) {
      console.error(
        "[Perplexity] Invalid topics array. Using YouTube fallback."
      );
      return generateFallbackCourses(categories);
    }

    console.log(
      "[Perplexity] Got",
      topics.length,
      "recent video topics, fetching from YouTube..."
    );

    // Fetch real YouTube videos for each topic
    const allVideos: Course[] = [];

    for (const topic of topics.slice(0, 8)) {
      try {
        // Search YouTube for recent videos
        const youtubeCourses = await searchCourses(topic.searchQuery, 1);

        if (youtubeCourses.length > 0) {
          const video = youtubeCourses[0];
          allVideos.push({
            ...video,
            title: topic.title,
            description: topic.description,
            level: topic.level,
          });
        }
      } catch (error) {
        console.error(
          "[Perplexity] Error fetching video for topic:",
          topic.title,
          error
        );
      }
    }

    if (allVideos.length === 0) {
      console.error(
        "[Perplexity] No videos found from YouTube. Using fallback."
      );
      return generateFallbackCourses(categories);
    }

    console.log(
      "[Perplexity] Successfully fetched",
      allVideos.length,
      "recent videos"
    );
    return allVideos;
  } catch (error: any) {
    console.error(
      "[Perplexity] Error fetching recent videos:",
      error?.response?.data || error?.message || error
    );

    console.log("[Perplexity] Using YouTube fallback videos");
    return generateFallbackCourses(categories);
  }
};

// Chat with LearnTube AI - Context-aware conversation
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UserContext {
  name: string;
  selectedCategories: string[];
  keywords: string[];
}

export const chatWithLearnTubeAI = async (
  userMessage: string,
  userContext: UserContext,
  chatHistory: ChatMessage[] = []
): Promise<string> => {
  console.log("[Perplexity] Chat request from:", userContext.name);

  if (!PERPLEXITY_API_KEY) {
    return "I'm sorry, but I'm currently unavailable. Please try again later.";
  }

  try {
    // Build the system prompt with user context
    const systemPrompt = `You are LearnTube AI, a focused and helpful learning assistant. Your role is to help users learn and grow in their chosen fields.

**User Profile:**
- Name: ${userContext.name}
- Learning Focus: ${userContext.selectedCategories.join(", ")}
- Interests: ${userContext.keywords.join(", ")}

**Your Responsibilities:**
1. Answer questions about the user's learning fields (${userContext.selectedCategories.join(
      ", "
    )})
2. Help with planning their learning journey and creating study schedules
3. Clarify concepts and explain difficult topics in their areas of interest
4. Provide recommendations for what to learn next
5. Assist with doubts and questions about their coursework

**IMPORTANT Rules:**
- Stay focused ONLY on topics related to: ${userContext.selectedCategories.join(
      ", "
    )} and learning/education
- If the user asks about irrelevant topics (personal life, entertainment, off-topic subjects), politely redirect them: "I'm here to help with your learning in ${
      userContext.selectedCategories[0]
    } and related topics. How can I assist with your studies?"
- Be encouraging, patient, and supportive
- Provide clear, concise explanations
- When discussing learning plans, be specific and actionable
- Always relate your answers back to their learning goals

Keep responses concise (2-4 sentences unless explanation requires more detail).`;

    // Prepare messages array
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      // Include recent chat history (last 6 messages for context)
      ...chatHistory.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    console.log("[Perplexity] Sending chat request...");

    const response = await axios.post(
      PERPLEXITY_URL,
      {
        model: "sonar",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      const aiResponse = response.data.choices[0].message.content.trim();
      console.log("[Perplexity] Chat response received");
      return aiResponse;
    } else {
      console.error("[Perplexity] Unexpected response format:", response.data);
      return "I apologize, but I couldn't process that request. Could you try rephrasing?";
    }
  } catch (error: any) {
    console.error(
      "[Perplexity] Chat error:",
      error?.response?.data || error?.message || error
    );

    // Provide user-friendly error messages
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return "I'm taking longer than expected to respond. Please try again.";
    }

    if (error?.response?.status === 429) {
      return "I'm receiving too many requests right now. Please wait a moment and try again.";
    }

    return "I'm having trouble responding right now. Please try again in a moment.";
  }
};
