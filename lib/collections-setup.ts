/**
 * Collections Setup Script
 * Run this script to create the necessary Appwrite collections for the roadmap feature
 * Usage: npx ts-node lib/collections-setup.ts
 */

import { config } from "dotenv";
import { Client, Databases, Permission, Role } from "node-appwrite";

// Load environment variables
config();

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const ROADMAP_STEPS_COLLECTION = "roadmap_steps";
const SAVED_VIDEOS_COLLECTION = "saved_videos";

async function createRoadmapStepsCollection() {
  try {
    console.log("📦 Creating roadmap_steps collection...");

    const collection = await databases.createCollection(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "Roadmap Steps",
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log("✅ Collection created");

    // Create string attributes
    await databases.createStringAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "userId",
      255,
      true
    );
    console.log("✅ Created userId");

    await databases.createStringAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "title",
      500,
      true
    );
    console.log("✅ Created title");

    await databases.createStringAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "description",
      2000,
      true
    );
    console.log("✅ Created description");

    await databases.createStringAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "category",
      255,
      true
    );
    console.log("✅ Created category");

    // Create integer attribute
    await databases.createIntegerAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "stepNumber",
      true,
      0,
      1000
    );
    console.log("✅ Created stepNumber");

    // Create enum attribute for status (without default for required attribute)
    await databases.createEnumAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "status",
      ["not_started", "in_progress", "completed"],
      false
    );
    console.log("✅ Created status");

    // Create boolean attribute (without default for required attribute)
    await databases.createBooleanAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "playlistsFetched",
      false
    );
    console.log("✅ Created playlistsFetched");

    // Create datetime attributes
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "completedAt",
      false
    );
    console.log("✅ Created completedAt");

    await databases.createDatetimeAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "createdAt",
      true
    );
    console.log("✅ Created createdAt");

    await databases.createDatetimeAttribute(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "updatedAt",
      true
    );
    console.log("✅ Created updatedAt");

    // Create indexes
    await databases.createIndex(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "userId_idx",
      "fulltext" as any,
      ["userId"]
    );
    console.log("✅ Created index: userId_idx");

    await databases.createIndex(
      DATABASE_ID,
      ROADMAP_STEPS_COLLECTION,
      "userId_stepNumber_idx",
      "fulltext" as any,
      ["userId", "stepNumber"]
    );
    console.log("✅ Created index: userId_stepNumber_idx");

    console.log("✅ roadmap_steps collection setup complete!");
    return collection;
  } catch (error) {
    console.error("❌ Error creating roadmap_steps collection:", error);
    throw error;
  }
}

async function createSavedVideosCollection() {
  try {
    console.log("\n📦 Creating saved_videos collection...");

    const collection = await databases.createCollection(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "Saved Videos",
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log("✅ Collection created");

    // Create all string attributes
    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "userId",
      255,
      true
    );
    console.log("✅ Created userId");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "stepId",
      255,
      true
    );
    console.log("✅ Created stepId");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "playlistId",
      255,
      true
    );
    console.log("✅ Created playlistId");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "title",
      500,
      true
    );
    console.log("✅ Created title");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "description",
      2000,
      false
    );
    console.log("✅ Created description");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "thumbnailUrl",
      1000,
      false
    );
    console.log("✅ Created thumbnailUrl");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "channelTitle",
      255,
      false
    );
    console.log("✅ Created channelTitle");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "platform",
      100,
      false
    );
    console.log("✅ Created platform");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "url",
      1000,
      true
    );
    console.log("✅ Created url");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "level",
      50,
      true
    );
    console.log("✅ Created level");

    await databases.createStringAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "type",
      50,
      false
    );
    console.log("✅ Created type");

    // Create integer attributes
    await databases.createIntegerAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "stepNumber",
      true
    );
    console.log("✅ Created stepNumber");

    await databases.createIntegerAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "videoCount",
      false
    );
    console.log("✅ Created videoCount");

    // Create datetime attribute
    await databases.createDatetimeAttribute(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "createdAt",
      true
    );
    console.log("✅ Created createdAt");

    // Create indexes
    await databases.createIndex(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "userId_stepId_idx",
      "fulltext" as any,
      ["userId", "stepId"]
    );
    console.log("✅ Created index: userId_stepId_idx");

    await databases.createIndex(
      DATABASE_ID,
      SAVED_VIDEOS_COLLECTION,
      "stepId_idx",
      "fulltext" as any,
      ["stepId"]
    );
    console.log("✅ Created index: stepId_idx");

    console.log("✅ saved_videos collection setup complete!");
    return collection;
  } catch (error) {
    console.error("❌ Error creating saved_videos collection:", error);
    throw error;
  }
}

export async function setupCollections() {
  try {
    console.log("🚀 Starting collections setup...\n");

    await createRoadmapStepsCollection();
    await createSavedVideosCollection();

    console.log("\n✅ All collections created successfully!");
  } catch (error: any) {
    if (error.code === 409) {
      console.log("\n⚠️  Collections already exist");
    } else {
      console.error("\n❌ Setup failed:", error);
      throw error;
    }
  }
}

// Run setup
setupCollections()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
