#!/usr/bin/env node

/**
 * Simple Android APK Builder
 * Creates a production APK without requiring EAS authentication
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Android Production Build\n");
console.log("=".repeat(50));

// Step 1: Run validation
console.log("\n📋 Step 1: Running pre-build validation...");
try {
  execSync("node scripts/pre-build-check.js", { stdio: "inherit" });
} catch (error) {
  console.error("\n❌ Pre-build validation failed!");
  process.exit(1);
}

// Step 2: Install dependencies
console.log("\n📦 Step 2: Checking dependencies...");
if (!fs.existsSync(path.join(__dirname, "..", "node_modules"))) {
  console.log("Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });
} else {
  console.log("✅ Dependencies already installed");
}

// Step 3: Clear cache
console.log("\n🧹 Step 3: Clearing cache...");
try {
  execSync("npx expo start --clear", { stdio: "pipe", timeout: 5000 });
} catch (error) {
  // Timeout expected, just clearing cache
  console.log("✅ Cache cleared");
}

// Step 4: Prebuild for Android
console.log("\n🔨 Step 4: Generating native Android project...");
try {
  if (!fs.existsSync(path.join(__dirname, "..", "android"))) {
    console.log("Running expo prebuild...");
    execSync("npx expo prebuild --platform android", { stdio: "inherit" });
  } else {
    console.log("✅ Android project already exists");
  }
} catch (error) {
  console.error("❌ Prebuild failed:", error.message);
  console.log("\nℹ️  Alternative: Use EAS Build instead");
  console.log("   Run: eas build --platform android --profile preview");
  process.exit(1);
}

// Step 5: Build Release APK
console.log("\n🏗️  Step 5: Building Release APK...");
console.log("This may take several minutes...\n");

try {
  process.chdir(path.join(__dirname, "..", "android"));

  // Use gradlew to build release APK
  if (process.platform === "win32") {
    execSync(".\\gradlew assembleRelease", { stdio: "inherit" });
  } else {
    execSync("./gradlew assembleRelease", { stdio: "inherit" });
  }

  // Find the APK
  const apkPath = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    "release",
    "app-release.apk"
  );

  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("\n" + "=".repeat(50));
    console.log("✅ BUILD SUCCESSFUL!");
    console.log("=".repeat(50));
    console.log(`\n📱 APK Location: ${apkPath}`);
    console.log(`📊 APK Size: ${sizeMB} MB`);
    console.log("\n📲 To install on device:");
    console.log(`   adb install "${apkPath}"`);
    console.log(
      "\nOr transfer the APK to your Android device and install manually."
    );
  } else {
    console.error("❌ APK file not found at expected location");
    process.exit(1);
  }
} catch (error) {
  console.error("\n❌ Build failed:", error.message);
  console.log("\n💡 Alternative Options:");
  console.log(
    "   1. Use EAS Build: eas build --platform android --profile preview"
  );
  console.log("   2. Check BUILD_GUIDE.md for detailed instructions");
  console.log("   3. Ensure Android SDK is properly installed");
  process.exit(1);
}
