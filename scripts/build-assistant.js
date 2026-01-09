#!/usr/bin/env node

/**
 * EAS Build Helper
 * Provides step-by-step guidance for creating production builds
 */

const readline = require("readline");
const { execSync } = require("child_process");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║         LearnTube - Android Build Assistant               ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log("This tool will guide you through creating an Android build.\n");

console.log("📋 Build Options:\n");
console.log("1. EAS Build (APK) - Recommended");
console.log("   • Cloud-based build");
console.log("   • No Android SDK required");
console.log("   • ~10-15 minutes build time");
console.log("   • Requires Expo account\n");

console.log("2. Local Build (Advanced)");
console.log("   • Requires Android SDK installed");
console.log("   • Faster if SDK already configured");
console.log("   • More complex setup\n");

rl.question("Select build option (1 or 2): ", (answer) => {
  if (answer === "1") {
    console.log("\n🚀 Starting EAS Build Process...\n");

    console.log("Step 1: Checking EAS CLI...");
    try {
      execSync("eas --version", { stdio: "pipe" });
      console.log("✅ EAS CLI is installed\n");
    } catch {
      console.log("📦 Installing EAS CLI...");
      try {
        execSync("npm install -g eas-cli", { stdio: "inherit" });
        console.log("✅ EAS CLI installed\n");
      } catch (error) {
        console.error("❌ Failed to install EAS CLI");
        process.exit(1);
      }
    }

    console.log("Step 2: Login to Expo...");
    console.log("ℹ️  You will be prompted to login in your browser.\n");

    try {
      execSync("eas login", { stdio: "inherit" });
      console.log("\n✅ Logged in successfully\n");
    } catch (error) {
      console.error("❌ Login failed");
      process.exit(1);
    }

    console.log("Step 3: Building APK...");
    console.log(
      "ℹ️  This will take 10-15 minutes. You can close this terminal."
    );
    console.log("   You'll receive an email when the build is ready.\n");

    try {
      execSync("eas build --platform android --profile preview", {
        stdio: "inherit",
      });
      console.log("\n✅ Build submitted successfully!");
      console.log("\n📥 Download your APK from the link provided above.");
      console.log("📲 Transfer to your Android device and install.\n");
    } catch (error) {
      console.error("\n❌ Build failed. Check the error message above.");
      process.exit(1);
    }
  } else if (answer === "2") {
    console.log("\n🔧 Local Build Requirements:\n");
    console.log("✓ Android Studio installed");
    console.log("✓ Android SDK configured");
    console.log("✓ ANDROID_HOME environment variable set");
    console.log("✓ Java JDK 11 or higher\n");

    rl.question("Do you have all requirements? (y/n): ", (hasReqs) => {
      if (hasReqs.toLowerCase() === "y") {
        console.log("\n🏗️  Starting local build...\n");
        try {
          execSync("node scripts/build-android.js", { stdio: "inherit" });
        } catch (error) {
          console.error("\n❌ Local build failed.");
          console.log("\n💡 Try EAS Build instead (option 1)");
        }
      } else {
        console.log(
          "\n📖 Please install Android Studio and configure the SDK."
        );
        console.log("   Then run this script again.\n");
        console.log(
          "   Or use option 1 (EAS Build) which doesn't require Android SDK.\n"
        );
      }
      rl.close();
    });
  } else {
    console.log("\n❌ Invalid option. Please run the script again.\n");
    rl.close();
  }

  if (answer === "1") {
    rl.close();
  }
});
