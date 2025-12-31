const sdk = require("node-appwrite");
require("dotenv").config();

const client = new sdk.Client();
const databases = new sdk.Databases(client);

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

async function addLearningContextField() {
  try {
    console.log("Adding learningContext field to preferences collection...");

    const result = await databases.createStringAttribute(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
      "preferences",
      "learningContext",
      10000, // Max length
      false, // Not required
      null, // No default value
      false // Not an array
    );

    console.log("✅ Successfully added learningContext field:", result);
    console.log("\n📝 Field details:");
    console.log("- Key: learningContext");
    console.log("- Type: String");
    console.log("- Size: 10000 characters");
    console.log("- Required: false");
  } catch (error) {
    if (error.message && error.message.includes("already exists")) {
      console.log("⚠️  Field already exists, skipping...");
    } else {
      console.error("❌ Error adding field:", error.message || error);
    }
  }
}

addLearningContextField();
