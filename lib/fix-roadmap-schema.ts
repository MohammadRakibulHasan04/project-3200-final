/**
 * Fix Roadmap Schema - Add Missing Attributes
 * This script adds the missing attributes to the roadmap_steps collection
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
const ROADMAP_STEPS_COLLECTION = "roadmap_steps";

async function addMissingAttributes() {
  try {
    console.log(
      "🔧 Adding missing attributes to roadmap_steps collection...\n"
    );

    // Add status enum attribute (optional with default handled in code)
    try {
      console.log("Adding 'status' attribute...");
      await databases.createEnumAttribute(
        DATABASE_ID,
        ROADMAP_STEPS_COLLECTION,
        "status",
        ["not_started", "in_progress", "completed"],
        false, // not required - we'll handle default in code
        "not_started" // default value for optional attribute
      );
      console.log("✅ Created status attribute");
      // Wait for attribute to be available
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  status attribute already exists");
      } else {
        throw error;
      }
    }

    // Add playlistsFetched boolean attribute (optional with default)
    try {
      console.log("Adding 'playlistsFetched' attribute...");
      await databases.createBooleanAttribute(
        DATABASE_ID,
        ROADMAP_STEPS_COLLECTION,
        "playlistsFetched",
        false, // not required
        false // default value
      );
      console.log("✅ Created playlistsFetched attribute");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  playlistsFetched attribute already exists");
      } else {
        throw error;
      }
    }

    // Add completedAt datetime attribute (optional)
    try {
      console.log("Adding 'completedAt' attribute...");
      await databases.createDatetimeAttribute(
        DATABASE_ID,
        ROADMAP_STEPS_COLLECTION,
        "completedAt",
        false // not required
      );
      console.log("✅ Created completedAt attribute");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  completedAt attribute already exists");
      } else {
        throw error;
      }
    }

    // Add createdAt datetime attribute (optional with default handled in code)
    try {
      console.log("Adding 'createdAt' attribute...");
      await databases.createDatetimeAttribute(
        DATABASE_ID,
        ROADMAP_STEPS_COLLECTION,
        "createdAt",
        false // not required - we always provide it in code
      );
      console.log("✅ Created createdAt attribute");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  createdAt attribute already exists");
      } else {
        throw error;
      }
    }

    // Add updatedAt datetime attribute (optional with default handled in code)
    try {
      console.log("Adding 'updatedAt' attribute...");
      await databases.createDatetimeAttribute(
        DATABASE_ID,
        ROADMAP_STEPS_COLLECTION,
        "updatedAt",
        false // not required - we always provide it in code
      );
      console.log("✅ Created updatedAt attribute");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        console.log("⚠️  updatedAt attribute already exists");
      } else {
        throw error;
      }
    }

    console.log("\n✅ All missing attributes have been added!");
    console.log(
      "⏳ Please wait 10-15 seconds for attributes to become fully available before using the app."
    );
  } catch (error) {
    console.error("\n❌ Error adding attributes:", error);
    throw error;
  }
}

// Run the fix
addMissingAttributes()
  .then(() => {
    console.log("\n🎉 Schema fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Schema fix failed:", error);
    process.exit(1);
  });
