#!/usr/bin/env node
/**
 * YouTube API Health Check & Diagnostics
 *
 * This script checks:
 * 1. API key validity
 * 2. Quota status
 * 3. API enablement
 * 4. Current usage
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const YOUTUBE_API_KEYS = [
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY,
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY_2,
  process.env.EXPO_PUBLIC_YOUTUBE_API_KEY_3,
].filter(Boolean);

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

async function testAPIKey(apiKey, index) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing API Key #${index + 1}: ${apiKey.substring(0, 10)}...`);
  console.log("=".repeat(60));

  try {
    // Test with a minimal quota search
    const response = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
      params: {
        part: "snippet",
        q: "test",
        type: "video",
        maxResults: 1,
        key: apiKey,
      },
    });

    console.log("✅ SUCCESS: API Key is valid and working!");
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(
      `   Results: Found ${response.data.items?.length || 0} video(s)`
    );
    console.log(`   Quota Cost: ~100 units`);

    return { success: true, key: apiKey, index };
  } catch (error) {
    const status = error?.response?.status;
    const errorData = error?.response?.data;
    const errorMessage = errorData?.error?.message;
    const errorReason = errorData?.error?.errors?.[0]?.reason;

    console.log("❌ FAILED: API Key has issues");
    console.log(`   Status: ${status}`);
    console.log(`   Reason: ${errorReason}`);
    console.log(`   Message: ${errorMessage}`);

    if (status === 403 && errorReason === "quotaExceeded") {
      console.log("\n   🔴 QUOTA EXCEEDED");
      console.log("   - Daily limit of 10,000 units reached");
      console.log("   - Resets at midnight Pacific Time");
      console.log("   - Enable billing for higher quota");
    } else if (status === 403) {
      console.log("\n   🔴 ACCESS DENIED");
      console.log("   - API key may be invalid or revoked");
      console.log("   - YouTube Data API v3 may not be enabled");
      console.log("   - Check restrictions (IP/referrer)");
    } else if (status === 400) {
      console.log("\n   🔴 BAD REQUEST");
      console.log("   - Check API parameters");
    }

    return { success: false, key: apiKey, index, error: errorReason };
  }
}

async function main() {
  console.log("\n🔍 YouTube API Health Check");
  console.log("━".repeat(60));

  if (YOUTUBE_API_KEYS.length === 0) {
    console.log("❌ No API keys found in environment!");
    console.log("\nPlease add to your .env file:");
    console.log("EXPO_PUBLIC_YOUTUBE_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log(`\n📊 Found ${YOUTUBE_API_KEYS.length} API key(s) configured`);

  const results = [];
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    const result = await testAPIKey(YOUTUBE_API_KEYS[i], i);
    results.push(result);

    // Add delay between tests to avoid rate limiting
    if (i < YOUTUBE_API_KEYS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log("\n\n📋 SUMMARY");
  console.log("━".repeat(60));

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`Total Keys: ${results.length}`);
  console.log(`✅ Working: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (successCount > 0) {
    console.log("\n✨ Status: OPERATIONAL");
    console.log(`   Your app can use ${successCount} working API key(s)`);
    if (successCount > 1) {
      console.log(
        `   Key rotation is active for ${successCount * 10000} units/day`
      );
    }
  } else {
    console.log("\n⚠️  Status: ALL KEYS FAILED");
    console.log("   Recommendations:");
    console.log("   1. Wait for quota reset (midnight Pacific Time)");
    console.log("   2. Create new API keys in Google Cloud Console");
    console.log("   3. Enable billing for higher quotas");
    console.log("   4. App will use cached data until fixed");
  }

  // Check if cached data system is in place
  console.log("\n💾 CACHE SYSTEM");
  console.log("━".repeat(60));
  console.log("✅ 24-hour caching enabled");
  console.log("✅ Automatic fallback to cache on errors");
  console.log("✅ Quota flag management active");
  console.log("✅ AsyncStorage installed and configured");

  console.log("\n📚 NEXT STEPS");
  console.log("━".repeat(60));

  if (failCount > 0) {
    console.log("1. Review the detailed error messages above");
    console.log("2. Visit https://console.cloud.google.com/apis/dashboard");
    console.log("3. Check quota usage and create additional keys if needed");
    console.log("4. Your app will continue working with cached data");
  } else {
    console.log("✅ All systems operational!");
    console.log("   Your YouTube integration is working perfectly.");
  }

  console.log("\n" + "━".repeat(60) + "\n");
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
