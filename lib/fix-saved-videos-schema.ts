/**
 * Fix Saved Videos Schema - Add All Missing Attributes
 * This script adds all required attributes to the saved_videos collection
 */

import { config } from "dotenv";
import { Client, Databases } from "node-appwrite";

// Load environment variables
config();

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const SAVED_VIDEOS_COLLECTION = "saved_videos";

async function addAttribute(
  name: string,
  createFunc: () => Promise<any>
): Promise<void> {
  try {
    console.log(`Adding '${name}' attribute...`);
    await createFunc();
    console.log(`✅ Created ${name}`);
    // Wait for attribute to be available
    await new Promise((resolve) => setTimeout(resolve, 1500));
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log(`⚠️  ${name} attribute already exists`);
    } else {
      throw error;
    }
  }
}

async function addMissingAttributes() {
  try {
    console.log("🔧 Adding all attributes to saved_videos collection...\n");

    // String attributes - Required
    await addAttribute("userId", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "userId",
        255,
        false // optional - we always provide it
      )
    );

    await addAttribute("stepId", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "stepId",
        255,
        false // optional - we always provide it
      )
    );

    await addAttribute("playlistId", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "playlistId",
        255,
        false // optional - we always provide it
      )
    );

    await addAttribute("title", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "title",
        500,
        false // optional - we always provide it
      )
    );

    await addAttribute("url", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "url",
        1000,
        false // optional - we always provide it
      )
    );

    await addAttribute("level", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "level",
        50,
        false // optional - we always provide it
      )
    );

    // String attributes - Optional
    await addAttribute("description", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "description",
        2000,
        false
      )
    );

    await addAttribute("thumbnailUrl", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "thumbnailUrl",
        1000,
        false
      )
    );

    await addAttribute("channelTitle", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "channelTitle",
        255,
        false
      )
    );

    await addAttribute("platform", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "platform",
        100,
        false,
        "YouTube" // default value
      )
    );

    await addAttribute("type", () =>
      databases.createStringAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "type",
        50,
        false,
        "playlist" // default value
      )
    );

    // Integer attributes
    await addAttribute("stepNumber", () =>
      databases.createIntegerAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "stepNumber",
        false, // optional - we always provide it
        0,
        10000
      )
    );

    await addAttribute("videoCount", () =>
      databases.createIntegerAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "videoCount",
        false,
        0,
        10000,
        0 // default value
      )
    );

    // Datetime attribute
    await addAttribute("createdAt", () =>
      databases.createDatetimeAttribute(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "createdAt",
        false // optional - we always provide it
      )
    );

    console.log("\n✅ All attributes have been added!");
    console.log("⏳ Waiting for indexes...\n");

    // Create indexes for efficient querying
    try {
      console.log("Creating 'stepId_idx' index...");
      await databases.createIndex(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "stepId_idx",
        "key" as any,
        ["stepId"]
      );
      console.log("✅ Created stepId_idx");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  stepId_idx already exists");
      } else {
        console.log("⚠️  Could not create stepId_idx:", error.message);
      }
    }

    try {
      console.log("Creating 'userId_idx' index...");
      await databases.createIndex(
        DATABASE_ID,
        SAVED_VIDEOS_COLLECTION,
        "userId_idx",
        "key" as any,
        ["userId"]
      );
      console.log("✅ Created userId_idx");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  userId_idx already exists");
      } else {
        console.log("⚠️  Could not create userId_idx:", error.message);
      }
    }

    console.log("\n✅ Schema setup complete!");
    console.log(
      "⏳ Please wait 10-15 seconds for all attributes to become fully available."
    );
  } catch (error) {
    console.error("\n❌ Error adding attributes:", error);
    throw error;
  }
}

// Run the fix
addMissingAttributes()
  .then(() => {
    console.log("\n🎉 saved_videos schema fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Schema fix failed:", error);
    process.exit(1);
  });
