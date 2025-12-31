import axios from "axios";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Available Gemini models in order of preference (gemini-1.5-flash was deprecated)
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

// Build the API URL for a given model
const getGeminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Delay utility for retry logic
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fallback keywords generator based on categories
const generateFallbackKeywords = (categories: string[]): string[] => {
  const fallbackMap: Record<string, string[]> = {
    programming: [
      "programming tutorial",
      "coding basics",
      "software development",
      "learn to code",
    ],
    "web development": [
      "web development",
      "HTML CSS",
      "JavaScript tutorial",
      "frontend development",
      "backend development",
    ],
    "mobile development": [
      "mobile app development",
      "React Native",
      "Flutter tutorial",
      "iOS development",
      "Android development",
    ],
    "data science": [
      "data science tutorial",
      "machine learning",
      "Python data analysis",
      "statistics tutorial",
    ],
    "artificial intelligence": [
      "AI tutorial",
      "deep learning",
      "neural networks",
      "machine learning basics",
    ],
    cybersecurity: [
      "cybersecurity basics",
      "ethical hacking",
      "network security",
      "penetration testing",
    ],
    "cloud computing": [
      "cloud computing",
      "AWS tutorial",
      "Azure basics",
      "DevOps",
    ],
    database: [
      "database design",
      "SQL tutorial",
      "MongoDB",
      "database management",
    ],
  };

  const keywords: string[] = [];

  categories.forEach((category) => {
    const lowerCategory = category.toLowerCase();
    // Try exact match
    if (fallbackMap[lowerCategory]) {
      keywords.push(...fallbackMap[lowerCategory]);
    } else {
      // Try partial match
      Object.keys(fallbackMap).forEach((key) => {
        if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
          keywords.push(...fallbackMap[key]);
        }
      });
    }
  });

  // If no matches, use generic keywords
  if (keywords.length === 0) {
    keywords.push(...categories.map((cat) => `${cat} tutorial`));
    keywords.push(...categories.map((cat) => `learn ${cat}`));
    keywords.push(...categories.map((cat) => `${cat} course`));
  }

  // Remove duplicates, enforce 50 char limit, and limit to 15
  return [...new Set(keywords)]
    .map((keyword) => {
      const trimmed = keyword.trim();
      return trimmed.length > 50 ? trimmed.substring(0, 50) : trimmed;
    })
    .slice(0, 15);
};

export const generateKeywords = async (
  categories: string[],
  learningContext?: string
): Promise<string[]> => {
  console.log(
    "[Gemini] Starting keyword generation for categories:",
    categories
  );
  if (learningContext) {
    console.log(
      "[Gemini] Using learning context:",
      learningContext.substring(0, 100) + "..."
    );
  }

  // Validate API key
  if (!GEMINI_API_KEY) {
    console.error("[Gemini] API key is missing! Using fallback keywords.");
    return generateFallbackKeywords(categories);
  }

  // Build enhanced prompt with context
  let prompt = `Act as an expert educational content curator and search optimization specialist.
  
  Your task is to generate a comprehensive list of exactly 18 high-quality YouTube search keywords/phrases for a user interested in the following headers: [ ${categories.join(
    ", "
  )} ].`;

  if (learningContext && learningContext.trim()) {
    prompt += `\n\nUser's Specific Context & Goals:\n"${learningContext}"\n`;
    prompt += `\nCustomize the keywords to match their specific level and interests described above.`;
  }

  prompt += `\n\nTo ensure the best learning results, your list MUST include a mix of:
  1. Core Concepts: Fundamental topics within these fields (e.g., if 'React', include 'React Hooks', 'State Management').
  2. Tools & Ecosystem: Relevant libraries, frameworks, or tools (e.g., 'Redux', 'Expo', 'Vite', 'Pandas').
  3. Learning Formats: "Crash Course", "Full Course", "Tutorial for Beginners", "Advanced Patterns".
  4. Specific & Long-tail: "Build a [Project] in [Tech]", "Best practices for [Topic]".
  
  CRITICAL CONSTRAINTS:
  - Return A RAW JSON ARRAY of strings only. No markdown, no "json" tags.
  - Example: ["React Native Crash Course", "Understanding UseEffect", "Python Data Science Roadmap"]
  - Each keyword must be strictly under 50 characters.
  - Ensure meaningful variety. Do not just repeat the category name.`;

  console.log(
    "[Gemini] Enhanced prompt prepared with",
    learningContext ? "user context" : "default context"
  );

  // Try each model until one works
  for (const model of GEMINI_MODELS) {
    console.log(`[Gemini] Trying model: ${model}`);

    try {
      const response = await axios.post(
        getGeminiUrl(model),
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log(`[Gemini] Received response from model: ${model}`);

      // Extract text from response
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn(
          `[Gemini] No text in response from ${model}, trying next model...`
        );
        continue;
      }

      console.log("[Gemini] Raw response text:", text);

      // Clean up the response - remove markdown formatting
      let jsonStr = text.trim();

      // Remove markdown code blocks
      jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");

      // Find the first [ and last ] to extract just the JSON array
      const firstBracket = jsonStr.indexOf("[");
      const lastBracket = jsonStr.lastIndexOf("]");

      if (firstBracket === -1 || lastBracket === -1) {
        console.warn(
          `[Gemini] Could not find JSON array in response from ${model}, trying next model...`
        );
        continue;
      }

      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);

      console.log("[Gemini] Cleaned JSON string:", jsonStr);

      // Parse JSON
      const keywords = JSON.parse(jsonStr);

      // Validate the result
      if (!Array.isArray(keywords) || keywords.length === 0) {
        console.warn(
          `[Gemini] Invalid response from ${model}, trying next model...`
        );
        continue;
      }

      // Validate all items are strings and enforce 50 character limit (Appwrite constraint)
      const validKeywords = keywords
        .filter((k) => typeof k === "string" && k.trim().length > 0)
        .map((k: string) => {
          const trimmed = k.trim();
          // Truncate to 50 characters if longer
          return trimmed.length > 50 ? trimmed.substring(0, 50) : trimmed;
        });

      if (validKeywords.length === 0) {
        console.warn(
          `[Gemini] No valid keywords from ${model}, trying next model...`
        );
        continue;
      }

      console.log(
        "[Gemini] Successfully generated",
        validKeywords.length,
        "keywords using model:",
        model
      );
      return validKeywords;
    } catch (error: any) {
      const statusCode = error?.response?.status;
      const errorMessage = error?.message || String(error);

      console.warn(`[Gemini] Model ${model} failed with: ${errorMessage}`);

      // If it's a rate limit error (429), wait before trying next model
      if (statusCode === 429) {
        console.log(
          "[Gemini] Rate limited, waiting 2 seconds before trying next model..."
        );
        await delay(2000);
      }

      // If it's a 404 (model not found), try next model immediately
      if (statusCode === 404) {
        console.log(`[Gemini] Model ${model} not found, trying next model...`);
      }

      // Continue to try next model
      continue;
    }
  }

  // All models failed, use fallback
  console.error("[Gemini] All models failed. Using fallback keywords.");
  return generateFallbackKeywords(categories);
};
