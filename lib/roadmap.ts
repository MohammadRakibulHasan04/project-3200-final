/**
 * Roadmap Service
 * Handles all roadmap and saved videos operations
 */

import { ID, Query } from "react-native-appwrite";
import { appwriteConfig, databases } from "./appwrite";
import { getCourseRecommendations } from "./perplexity";

export interface RoadmapStep {
  $id: string;
  userId: string;
  stepNumber: number;
  title: string;
  description: string;
  category: string;
  status: "not_started" | "in_progress" | "completed";
  playlistsFetched: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedVideo {
  $id: string;
  userId: string;
  stepId: string;
  stepNumber: number;
  playlistId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  videoCount: number;
  platform: string;
  url: string;
  level: string;
  type: string;
  createdAt: string;
}

/**
 * Generate roadmap steps based on user preferences
 */
export const generateRoadmap = async (userId: string, categories: string[]) => {
  try {
    console.log("[Roadmap] Generating roadmap for user:", userId);
    console.log("[Roadmap] Categories:", categories);

    // Check if roadmap already exists
    const existing = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.roadmapStepsCollectionId!,
      [Query.equal("userId", userId)]
    );

    if (existing.documents.length > 0) {
      console.log("[Roadmap] Roadmap already exists");
      return existing.documents as RoadmapStep[];
    }

    // Generate progressive learning steps for each category
    const steps: any[] = [];
    let stepNumber = 1;

    // Deduplicate categories to prevent duplicate steps
    const uniqueCategories = [...new Set(categories)];
    console.log("[Roadmap] Unique categories:", uniqueCategories);

    for (const category of uniqueCategories) {
      // Create 3 progressive steps per category: Beginner → Intermediate → Advanced
      const levels = [
        {
          level: "Beginner",
          title: `${category} - Getting Started`,
          description: `Learn the fundamentals of ${category} with beginner-friendly tutorials and projects.`,
        },
        {
          level: "Intermediate",
          title: `${category} - Building Skills`,
          description: `Enhance your ${category} skills with intermediate concepts and real-world applications.`,
        },
        {
          level: "Advanced",
          title: `${category} - Mastering Concepts`,
          description: `Master advanced ${category} techniques and build professional-level projects.`,
        },
      ];

      for (const levelData of levels) {
        steps.push({
          userId,
          stepNumber,
          title: levelData.title,
          description: levelData.description,
          category,
          status: stepNumber === 1 ? "in_progress" : "not_started", // First step starts in progress
          playlistsFetched: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        stepNumber++;
      }
    }

    // Save all steps to database
    const createdSteps: RoadmapStep[] = [];
    for (const step of steps) {
      const created = await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.roadmapStepsCollectionId!,
        ID.unique(),
        step
      );
      createdSteps.push(created as RoadmapStep);
    }

    console.log("[Roadmap] Created", createdSteps.length, "steps");
    return createdSteps;
  } catch (error) {
    console.error("[Roadmap] Error generating roadmap:", error);
    throw error;
  }
};

/**
 * Get user's roadmap steps
 */
export const getRoadmapSteps = async (
  userId: string
): Promise<RoadmapStep[]> => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.roadmapStepsCollectionId!,
      [Query.equal("userId", userId), Query.orderAsc("stepNumber")]
    );
    return response.documents as RoadmapStep[];
  } catch (error) {
    console.error("[Roadmap] Error fetching roadmap:", error);
    return [];
  }
};

/**
 * Get current active step (first in_progress or not_started step)
 */
export const getCurrentStep = async (
  userId: string
): Promise<RoadmapStep | null> => {
  try {
    const steps = await getRoadmapSteps(userId);
    return steps.find((s) => s.status !== "completed") || null;
  } catch (error) {
    console.error("[Roadmap] Error getting current step:", error);
    return null;
  }
};

/**
 * Update step status
 */
export const updateStepStatus = async (
  stepId: string,
  status: "not_started" | "in_progress" | "completed"
) => {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completedAt = new Date().toISOString();
    }

    const updated = await databases.updateDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.roadmapStepsCollectionId!,
      stepId,
      updateData
    );

    console.log("[Roadmap] Step status updated:", stepId, status);
    return updated as RoadmapStep;
  } catch (error) {
    console.error("[Roadmap] Error updating step status:", error);
    throw error;
  }
};

/**
 * Fetch and save playlists for a step
 */
export const fetchAndSavePlaylistsForStep = async (
  step: RoadmapStep
): Promise<SavedVideo[]> => {
  try {
    console.log("[Roadmap] Fetching playlists for step:", step.title);

    // Check if already fetched
    if (step.playlistsFetched) {
      console.log("[Roadmap] Playlists already fetched, loading from DB");
      return await getSavedVideosForStep(step.$id);
    }

    // Fetch playlists from Perplexity/YouTube
    const playlists = await getCourseRecommendations([step.category]);

    if (playlists.length === 0) {
      console.log("[Roadmap] No playlists found");
      return [];
    }

    // Save to database
    const savedVideos: SavedVideo[] = [];
    for (const playlist of playlists) {
      const videoData = {
        userId: step.userId,
        stepId: step.$id,
        stepNumber: step.stepNumber,
        playlistId:
          playlist.id || playlist.url.split("list=")[1] || ID.unique(),
        title: playlist.title,
        description: playlist.description,
        thumbnailUrl: playlist.thumbnailUrl || "",
        channelTitle: playlist.channelTitle || "",
        videoCount: playlist.videoCount || 0,
        platform: "YouTube",
        url: playlist.url,
        level: playlist.level,
        type: "playlist",
        createdAt: new Date().toISOString(),
      };

      const saved = await databases.createDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.savedVideosCollectionId!,
        ID.unique(),
        videoData
      );
      savedVideos.push(saved as SavedVideo);
    }

    // Mark step as playlists fetched
    await databases.updateDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.roadmapStepsCollectionId!,
      step.$id,
      {
        playlistsFetched: true,
        updatedAt: new Date().toISOString(),
      }
    );

    console.log("[Roadmap] Saved", savedVideos.length, "playlists to DB");
    return savedVideos;
  } catch (error) {
    console.error("[Roadmap] Error fetching and saving playlists:", error);
    throw error;
  }
};

/**
 * Get saved videos for a specific step
 */
export const getSavedVideosForStep = async (
  stepId: string
): Promise<SavedVideo[]> => {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.savedVideosCollectionId!,
      [Query.equal("stepId", stepId)]
    );
    return response.documents as SavedVideo[];
  } catch (error) {
    console.error("[Roadmap] Error fetching saved videos:", error);
    return [];
  }
};

/**
 * Complete current step and move to next
 */
export const completeStepAndMoveNext = async (
  userId: string,
  currentStepId: string
) => {
  try {
    // Mark current step as completed
    await updateStepStatus(currentStepId, "completed");

    // Get all steps
    const steps = await getRoadmapSteps(userId);
    const currentIndex = steps.findIndex((s) => s.$id === currentStepId);

    // If there's a next step, mark it as in_progress
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      await updateStepStatus(nextStep.$id, "in_progress");
      return nextStep;
    }

    return null; // No more steps
  } catch (error) {
    console.error("[Roadmap] Error completing step:", error);
    throw error;
  }
};

/**
 * Delete user's roadmap (useful for reset)
 */
export const deleteRoadmap = async (userId: string) => {
  try {
    console.log("[Roadmap] Starting deletion for user:", userId);

    // Delete all steps
    const steps = await getRoadmapSteps(userId);
    for (const step of steps) {
      await databases.deleteDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.roadmapStepsCollectionId!,
        step.$id
      );
    }
    console.log(`[Roadmap] Deleted ${steps.length} steps`);

    // Delete all saved videos
    const videos = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.savedVideosCollectionId!,
      [Query.equal("userId", userId), Query.limit(500)]
    );
    for (const video of videos.documents) {
      await databases.deleteDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.savedVideosCollectionId!,
        video.$id
      );
    }
    console.log(`[Roadmap] Deleted ${videos.documents.length} saved videos`);

    console.log("[Roadmap] Deletion complete for user:", userId);
  } catch (error) {
    console.error("[Roadmap] Error deleting roadmap:", error);
    throw error;
  }
};

/**
 * Reinitialize entire learning system when categories change
 * This ensures all recommendations are fresh and aligned with new preferences
 */
export const reinitializeUserLearningData = async (
  userId: string,
  newCategories: string[]
): Promise<boolean> => {
  try {
    console.log(
      "[Roadmap] Starting complete reinitialization for user:",
      userId
    );
    console.log("[Roadmap] New categories:", newCategories);

    // Step 1: Delete existing roadmap and saved videos
    await deleteRoadmap(userId);

    // Step 2: Generate new roadmap based on new categories
    console.log("[Roadmap] Generating new roadmap...");
    const newSteps = await generateRoadmap(userId, newCategories);
    console.log(`[Roadmap] Created ${newSteps.length} new steps`);

    // Step 3: Fetch playlists for the first step to get user started
    if (newSteps.length > 0) {
      const firstStep = newSteps[0];
      console.log("[Roadmap] Fetching playlists for first step...");
      try {
        await fetchAndSavePlaylistsForStep(firstStep);
        console.log("[Roadmap] First step playlists fetched successfully");
      } catch (error) {
        console.error(
          "[Roadmap] Error fetching first step playlists (non-critical):",
          error
        );
        // Don't fail the whole operation if playlist fetching fails
      }
    }

    console.log("[Roadmap] Reinitialization complete!");
    return true;
  } catch (error) {
    console.error("[Roadmap] Error during reinitialization:", error);
    throw error;
  }
};
