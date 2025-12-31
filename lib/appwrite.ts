import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID,
  // Add other collection IDs here as we define them
  categoriesCollectionId: "categories",
  userPreferencesCollectionId: "preferences",
  savedVideosCollectionId: "saved_videos",
  roadmapStepsCollectionId: "roadmap_steps",
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint!)
  .setProject(appwriteConfig.projectId!)
  .setPlatform(appwriteConfig.platform!);

export const account = new Account(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);

// Auth Services
export async function createUser(
  email: string,
  password: string,
  username: string,
  name: string
) {
  try {
    // Step 1: Create account in Appwrite Auth
    console.log("[createUser] Creating account...");
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Failed to create account");
    console.log("[createUser] Account created:", newAccount.$id);

    // Step 2: Sign in the new user
    console.log("[createUser] Signing in...");
    await signIn(email, password);

    // Step 3: Create user document in database
    console.log("[createUser] Creating user document...");
    const documentData = {
      accountId: newAccount.$id,
      email: email,
      username: username,
      name: name,
      onboarded: false,
    };
    console.log(
      "[createUser] Document data:",
      JSON.stringify(documentData, null, 2)
    );

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.userCollectionId!,
      ID.unique(),
      documentData
    );

    console.log("[createUser] User created successfully:", newUser.$id);
    return newUser;
  } catch (error: any) {
    console.error("[createUser] Error:", error);
    // Provide more context in the error message
    const errorMessage =
      error?.message || error?.toString() || "Unknown error during signup";
    throw new Error(`Signup failed: ${errorMessage}`);
  }
}

export async function signIn(email, password) {
  try {
    // user might be already logged in, try to delete session first just in case?
    // Or just let it fail. Better to plain createSession.
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.userCollectionId!,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser.documents.length) throw Error;
    return currentUser.documents[0];
  } catch (error) {
    // Appwrite throws 401 if user is not logged in (Guest).
    // We can safely ignore this log for checking current session.
    // console.log(error);
    return null;
  }
}

export async function signOut() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export async function completeOnboarding(
  userId,
  selectedCategories,
  keywords,
  learningContext?: string
) {
  try {
    // Validate and sanitize keywords to ensure they meet Appwrite constraints
    // Each keyword must be a string and no longer than 50 characters
    const validatedKeywords = keywords
      .filter(
        (keyword: any) =>
          typeof keyword === "string" && keyword.trim().length > 0
      )
      .map((keyword: string) => {
        const trimmed = keyword.trim();
        // Truncate to 50 characters if longer (Appwrite constraint)
        return trimmed.length > 50 ? trimmed.substring(0, 50) : trimmed;
      });

    console.log(
      `[Onboarding] Validated ${validatedKeywords.length} keywords (from ${keywords.length} original)`
    );

    const documentData: any = {
      userId: userId,
      selectedCategories: selectedCategories, // Ensure this is array of strings
      keywords: validatedKeywords, // Validated and sanitized keywords
    };

    // Add learningContext if provided
    if (learningContext && learningContext.trim()) {
      documentData.learningContext = learningContext.trim();
    }

    await databases.createDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.userPreferencesCollectionId!,
      ID.unique(),
      documentData
    );

    await databases.updateDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.userCollectionId!,
      userId,
      {
        onboarded: true,
      }
    );

    return true;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}

// Update user profile information
export async function updateUserProfile(
  userId: string,
  name: string,
  username: string
) {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId!,
      appwriteConfig.userCollectionId!,
      userId,
      {
        name: name,
        username: username,
      }
    );
    return true;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  selectedCategories: string[]
) {
  try {
    // Get existing preferences document
    const prefs = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.userPreferencesCollectionId!,
      [Query.equal("userId", userId)]
    );

    if (prefs.documents.length > 0) {
      const prefId = prefs.documents[0].$id;
      await databases.updateDocument(
        appwriteConfig.databaseId!,
        appwriteConfig.userPreferencesCollectionId!,
        prefId,
        {
          selectedCategories: selectedCategories,
        }
      );
    }
    return true;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}

// Check if categories have changed (for determining if reinitialization is needed)
export async function haveCategoriesChanged(
  userId: string,
  newCategories: string[]
): Promise<boolean> {
  try {
    const prefs = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.userPreferencesCollectionId!,
      [Query.equal("userId", userId)]
    );

    if (prefs.documents.length === 0) {
      return false; // No existing preferences
    }

    const existing = prefs.documents[0];
    const oldCategories = (existing.selectedCategories || []) as string[];

    // Check if category array has changed
    const categoriesChanged =
      JSON.stringify([...oldCategories].sort()) !==
      JSON.stringify([...newCategories].sort());

    return categoriesChanged;
  } catch (error) {
    console.error("Error checking category changes:", error);
    return false;
  }
}

// Check username availability
export async function checkUsernameAvailability(
  username: string,
  currentUserId: string
): Promise<boolean> {
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.userCollectionId!,
      [Query.equal("username", username)]
    );

    // Username is available if no users found, or only the current user has it
    return (
      users.documents.length === 0 ||
      (users.documents.length === 1 && users.documents[0].$id === currentUserId)
    );
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Fetch all categories from database
export async function fetchCategoriesFromDB() {
  try {
    const categories = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.categoriesCollectionId!,
      [Query.equal("type", "major"), Query.limit(100)]
    );
    return categories.documents;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Fetch sub categories based on parent category originalId
export async function fetchSubCategoriesFromDB(parentOriginalId: string) {
  try {
    const subCategories = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.categoriesCollectionId!,
      [
        Query.equal("parentId", parentOriginalId),
        Query.equal("type", "sub"),
        Query.limit(100),
      ]
    );
    return subCategories.documents;
  } catch (error) {
    console.error("Error fetching sub categories:", error);
    return [];
  }
}

// Fetch niches based on sub category originalId
export async function fetchNichesFromDB(parentOriginalId: string) {
  try {
    const niches = await databases.listDocuments(
      appwriteConfig.databaseId!,
      appwriteConfig.categoriesCollectionId!,
      [
        Query.equal("parentId", parentOriginalId),
        Query.equal("type", "niche"),
        Query.limit(100),
      ]
    );
    return niches.documents;
  } catch (error) {
    console.error("Error fetching niches:", error);
    return [];
  }
}
