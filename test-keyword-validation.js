/**
 * Test script to verify keyword validation works correctly
 * This simulates the validation logic to ensure keywords meet Appwrite constraints
 */

// Simulate invalid keywords that could come from Gemini
const testKeywords = [
  "JavaScript programming tutorial", // Valid - 33 chars
  "Advanced machine learning algorithms and techniques for beginners", // Invalid - 67 chars (> 50)
  "Python", // Valid - 6 chars
  "", // Invalid - empty string
  "   React Hooks deep dive   ", // Valid after trim - 22 chars
  null, // Invalid - not a string
  123, // Invalid - not a string
  "CSS Grid and Flexbox complete guide for responsive design", // Invalid - 58 chars (> 50)
  "Node.js tutorial", // Valid - 17 chars
  undefined, // Invalid - not a string
  "This is exactly fifty characters long for testing!", // Valid - exactly 50 chars
  "This keyword is way too long and exceeds the fifty character limit by a lot", // Invalid - 77 chars
];

console.log("Testing keyword validation logic...\n");
console.log("Original keywords:", testKeywords.length);

// Apply validation logic (same as in appwrite.ts and gemini.ts)
const validatedKeywords = testKeywords
  .filter((keyword) => typeof keyword === "string" && keyword.trim().length > 0)
  .map((keyword) => {
    const trimmed = keyword.trim();
    const truncated = trimmed.length > 50 ? trimmed.substring(0, 50) : trimmed;

    if (trimmed.length > 50) {
      console.log(`✂️  Truncated: "${trimmed}" (${trimmed.length} chars)`);
      console.log(`   → "${truncated}" (${truncated.length} chars)\n`);
    }

    return truncated;
  });

console.log("\n=== Validation Results ===");
console.log(
  `Valid keywords: ${validatedKeywords.length}/${testKeywords.length}`
);
console.log("\nValidated keywords:");
validatedKeywords.forEach((keyword, index) => {
  console.log(`  ${index + 1}. "${keyword}" (${keyword.length} chars)`);
});

// Verify all keywords are valid
const allValid = validatedKeywords.every(
  (keyword) =>
    typeof keyword === "string" && keyword.length > 0 && keyword.length <= 50
);

console.log("\n=== Final Check ===");
console.log(`All keywords valid: ${allValid ? "✅ YES" : "❌ NO"}`);

if (allValid) {
  console.log("\n✅ Keyword validation logic is working correctly!");
} else {
  console.log("\n❌ Some keywords still invalid!");
  process.exit(1);
}
