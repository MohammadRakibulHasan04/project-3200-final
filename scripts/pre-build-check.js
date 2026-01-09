#!/usr/bin/env node

/**
 * Pre-build validation script
 * Checks for required environment variables and configurations
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Running pre-build validation...\n");

let hasErrors = false;

// Check for .env file
const envPath = path.join(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found!");
  console.log("   Create a .env file with required API keys.");
  hasErrors = true;
} else {
  console.log("✅ .env file found");
}

// Check for required images
const requiredImages = [
  "assets/images/icon.png",
  "assets/images/splash-icon.png",
  "assets/images/android-icon-foreground.png",
  "assets/images/android-icon-background.png",
];

requiredImages.forEach((imagePath) => {
  const fullPath = path.join(__dirname, "..", imagePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing required image: ${imagePath}`);
    hasErrors = true;
  } else {
    console.log(`✅ Found ${imagePath}`);
  }
});

// Check app.json
const appJsonPath = path.join(__dirname, "..", "app.json");
if (!fs.existsSync(appJsonPath)) {
  console.error("❌ app.json not found!");
  hasErrors = true;
} else {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

    if (!appJson.expo.version) {
      console.error("❌ Version not set in app.json");
      hasErrors = true;
    } else {
      console.log(`✅ App version: ${appJson.expo.version}`);
    }

    if (!appJson.expo.android?.package) {
      console.error("❌ Android package name not set");
      hasErrors = true;
    } else {
      console.log(`✅ Android package: ${appJson.expo.android.package}`);
    }
  } catch (error) {
    console.error("❌ Error parsing app.json:", error.message);
    hasErrors = true;
  }
}

// Summary
console.log("\n" + "=".repeat(50));
if (hasErrors) {
  console.error("❌ Pre-build validation FAILED");
  console.log("   Please fix the errors above before building.\n");
  process.exit(1);
} else {
  console.log("✅ Pre-build validation PASSED");
  console.log("   Ready to build!\n");
  process.exit(0);
}
