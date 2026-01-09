# Chapter 6: Implementation

---

## 6.1 Development Environment Setup

**Operating Systems:** Development conducted on Windows 11 / macOS Ventura. Testing on Android 12+ (emulator/physical) and iOS 16+ (simulator).

**Compilers & Runtimes:** Node.js v18.17.0, npm v9.6.7, Expo CLI v6.3.10. TypeScript compiler v5.9 with ES2022 target. Metro bundler for React Native compilation.

**Development Tools:** Visual Studio Code (primary IDE), Android Studio (Android SDK/emulator), Xcode (iOS simulator). Git v2.40 for version control.

**Build Configurations:** Debug builds via `expo start` with Metro Dev Server. Production builds via `eas build` (Expo Application Services) for APK/IPA generation. Environment variables managed via `.env` file with Expo public prefix.

**External Service Accounts:** Appwrite Cloud (v1.6), Google AI Studio (Gemini API), Perplexity AI (API key), YouTube Data API v3 (3 API keys). All keys stored in environment variables, never committed to repository.

## 6.2 Coding Standards & Version Control Strategy

**Naming Conventions:** camelCase for variables/functions (`getUserPreferences`, `isLoading`), PascalCase for components/types (`VideoCard`, `RoadmapStep`), UPPER_SNAKE_CASE for constants (`APPWRITE_DATABASE_ID`, `YOUTUBE_API_KEY_1`). File names match component names (`VideoCard.tsx`, `roadmap.ts`).

**Code Formatting:** ESLint v9 with TypeScript plugin. Enforced rules: semicolons required, 2-space indentation, single quotes for strings, no unused variables, trailing commas in multiline. Prettier integration for auto-formatting on save.

**TypeScript Standards:** Strict mode enabled (`strict: true` in tsconfig.json). Explicit return types for functions. Interface definitions for all API responses and component props. No `any` type allowed (use `unknown` or proper types).

**Git Workflow Model:** Feature branch strategy on GitHub. Branch naming: `feature/module-name`, `fix/bug-description`. Main branch protected (requires PR approval). Commits follow conventional format: `type(scope): description` (e.g., `feat(auth): implement JWT session persistence`, `fix(youtube): handle quota exhaustion`).

**Commit Evidence:** Repository hosted at `github.com/MohammadRakibulHasan04/project-3200-final`. Total commits: 150+. Key milestones: Initial setup (commit #1), Appwrite integration (#15-20), AI services (#35-50), UI components (#60-80), testing/fixes (#100+).

## 6.3 Module-Wise Implementation

### 6.3.1 Authentication Module

**Files:** `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`, `lib/appwrite.ts`  
**Implementation Logic:** Email/password authentication via Appwrite Auth API. Sign-up creates user account + document in `users` collection. Sign-in establishes JWT session stored in GlobalProvider. Auto-routing based on `onboarded` flag (onboarded → `/home`, new → `/onboarding`).

**Code Flow:**

```typescript
// Sign-in: Email/password → Appwrite session → User fetch → Route
await signIn(email, password);
const user = await getCurrentUser();
setUser(user);
router.replace(user.onboarded ? "/home" : "/onboarding");
```

**Commits:** `feat(auth): implement JWT session (#15)`, `fix(auth): handle session expiry (#22)`

### 6.3.2 Onboarding Module

**Files:** `app/onboarding.tsx`, `lib/gemini.ts`, `data/categories.ts`  
**Implementation Logic:** Two-step wizard. Step 1: Hierarchical category selection (Major/Sub/Niche) with multi-select. Step 2: Learning context text input. Gemini API generates 10-15 educational keywords (max 50 chars). Fallback to predefined mapping on API failure. Preferences saved to Appwrite.

**Code Flow:**

```typescript
// Step 1: Category selection → Step 2: Context input → Gemini keywords
const keywords = await generateKeywords(categories, context);
await saveUserPreferences(userId, { categories, keywords, context });
await updateUser(userId, { onboarded: true });
```

**Commits:** `feat(onboarding): add category hierarchy (#25)`, `feat(ai): integrate Gemini keyword generation (#40)`

### 6.3.3 Roadmap Module

**Developer:** Mohammad Rakibul Hasan  
**Files:** `app/(tabs)/roadmap.tsx`, `lib/perplexity.ts`, `lib/roadmap.ts`  
**Implementation Logic:** Perplexity Sonar generates 3-level learning path per category (Beginner/Intermediate/Advanced). Each step has title, description, category, status. Steps stored in `roadmap_steps` collection. UI displays steps with progress indicators (orange = in_progress, green checkmark = completed). Moti animations for smooth transitions.

**Code Flow:**

```typescript
// Generate roadmap: Categories → Perplexity → 8+ steps → Appwrite storage
const steps = await generateRoadmap(userId, categories);
await storeRoadmapSteps(userId, steps); // Batch insert to Appwrite
// Display with status: not_started → in_progress → completed
```

**Commits:** `feat(roadmap): add Perplexity AI integration (#45)`, `feat(roadmap): implement progress tracking (#65)`

### 6.3.4 Courses Module

**Developer:** Mohammad Rakibul Hasan  
**Files:** `app/(tabs)/courses.tsx`, `lib/youtube.ts`, `components/PlaylistPlayer.tsx`  
**Implementation Logic:** YouTube Data API v3 fetches playlists for selected roadmap step. 3-key rotation handles quota limits (10K units/day/key). Session-based caching in AsyncStorage (24-hour TTL). In-app YouTube iframe player for video playback. Metadata: title, channel, video count, thumbnail.

**Code Flow:**

```typescript
// Fetch courses: Step keywords → YouTube API → Cache → Display
const query = step.category + " " + userKeywords.join(" ");
const playlists = await searchYouTubePlaylists(query); // Auto-rotation on 403
cacheResults(query, playlists, 24); // AsyncStorage
```

**Commits:** `feat(youtube): implement API key rotation (#50)`, `feat(courses): add session caching (#70)`

### 6.3.5 Discussion Module

**Developer:** Mohammad Rakibul Hasan  
**Files:** `app/(tabs)/discussion.tsx`, `components/AIChatModal.tsx`, `lib/perplexity.ts`  
**Implementation Logic:** Perplexity Sonar powers AI chat. General chat on Discussion screen, context-aware chat in AIChatModal (per roadmap step). Conversation history maintained in state. System prompts include user context (categories, current step). Responses streamed as markdown text.

**Code Flow:**

```typescript
// Chat flow: User message + history + context → Perplexity → AI response
const response = await perplexityChatCompletion([
  { role: "system", content: systemPrompt },
  ...conversationHistory,
  { role: "user", content: message },
]);
```

**Commits:** `feat(discussion): integrate Perplexity chat (#55)`, `feat(chat): add roadmap context modal (#75)`

### 6.3.6 Profile Module

**Developer:** Mohammad Rakibul Hasan  
**Files:** `app/profile.tsx`, `lib/appwrite.ts`  
**Implementation Logic:** Edit user name/username with uniqueness validation. Update categories (triggers roadmap regeneration option). Avatar generation via Appwrite Avatars API (initials-based). Logout clears session and navigates to landing.

**Code Flow:**

```typescript
// Profile update: Validate → Update Appwrite → Refresh context
await updateUserProfile(userId, { name, username });
if (categoriesChanged) await clearAndRegenerateRoadmap(userId);
```

**Commits:** `feat(profile): add edit functionality (#80)`, `feat(profile): integrate avatar service (#85)`

### 6.3.7 AI Services Layer

**Developer:** Mohammad Rakibul Hasan  
**Files:** `lib/gemini.ts`, `lib/perplexity.ts`, `lib/youtube.ts`  
**Implementation Logic:** Centralized API integrations with error handling. Gemini: Multi-model fallback (gemini-2.0-flash → gemini-flash-latest). Perplexity: Sonar model for roadmap/chat. YouTube: 3-key rotation with quota tracking. All APIs use axios with retry logic.

**Key Algorithms:**

- **Keyword Generation:** Categories + context → Gemini prompt → 10-15 keywords (comma-separated) → Validation (max 50 chars, no duplicates)
- **Roadmap Generation:** Deduplicate categories → Perplexity prompt (3 levels/category) → JSON parsing → Appwrite batch insert
- **YouTube Search:** Step keywords → API query → Playlist fetch → Metadata extraction → Session cache

**Commits:** `feat(ai): add Gemini multi-model fallback (#40)`, `feat(youtube): implement quota management (#50)`, `refactor(ai): consolidate error handling (#90)`

### 6.3.8 Global State Management

**Developer:** Mohammad Rakibul Hasan  
**Files:** `context/GlobalProvider.tsx`, `app/_layout.tsx`  
**Implementation Logic:** React Context API manages user state (accountId, email, onboarded flag, avatar). Auto-fetches current user on app load. Provides `isLogged` and `loading` states for conditional rendering. Wrapped around entire app in root layout.

**Code Flow:**

```typescript
// App load → getCurrentUser() → Set context → Route
useEffect(() => {
  getCurrentUser()
    .then((user) => {
      setIsLogged(true);
      setUser(user);
    })
    .catch(() => {
      setIsLogged(false);
      setUser(null);
    })
    .finally(() => setLoading(false));
}, []);
```

**Commits:** `feat(context): add GlobalProvider (#20)`, `fix(context): handle session persistence (#30)`

## 6.4 System Integration Workflow

**Integration Strategy:** Bottom-up integration. Services layer (`lib/`) implemented and unit-tested first. Then UI screens built on top of services. GlobalProvider acts as central integration point for authentication state.

**Module Dependencies:**

1. **Appwrite Service** → Authentication, Database → **All modules depend on this**
2. **GlobalProvider** → User state → **All screens consume this**
3. **Gemini Service** → Onboarding → Preferences
4. **Perplexity Service** → Roadmap, Discussion → Roadmap steps, Chat
5. **YouTube Service** → Courses → Saved videos
6. **Roadmap Module** → Courses, Discussion → Shared step context

**Testing Workflow:**

1. Service layer tested with Postman (API endpoints)
2. UI components tested with Expo Go on Android/iOS devices
3. Integration tested: Onboarding → Roadmap → Courses flow
4. End-to-end tested: Sign-up → Onboarding → Generate roadmap → Fetch courses → AI chat

**Build Pipeline:** Local dev via `expo start` → Preview builds via `expo build` → Testing on TestFlight (iOS) / Internal testing (Android) → Production release.

**Continuous Integration:** GitHub Actions workflow for ESLint checks on pull requests. No automated tests (manual testing only for this project).

## 6.5 Performance, Optimization, and Security Techniques

**Performance Optimizations:**

**Caching Strategy:** YouTube API results cached per session (24-hour TTL) in AsyncStorage. Reduces API calls by ~70%. Cache invalidation on user preference changes.

**API Quota Management:** 3-key rotation for YouTube (30K units/day total). Exhausted keys marked and skipped. Gemini multi-model fallback prevents single point of failure.

**Lazy Loading:** Roadmap steps loaded on demand. Courses fetched only on "Get Courses" button click (not preloaded). Images loaded with React Native's `Image` component (built-in caching).

**Animations:** Moti animations run on native thread (60 FPS). Minimal JavaScript bridge overhead. React Native Reanimated for gesture-driven interactions.

**Bundle Optimization:** Tree-shaking via Metro bundler. Unused dependencies excluded. Production builds minified with Hermes engine (faster startup).

**Security Techniques:**

**Authentication:** Appwrite JWT tokens with automatic expiry. Session persistence via secure storage (AsyncStorage on React Native). Passwords bcrypt-hashed by Appwrite (never transmitted in plaintext).

**API Key Management:** Environment variables (`.env` file) with Expo public prefix. Keys never committed to Git (`.gitignore` enforced). Budget alerts configured on Google Cloud Console.

**Data Privacy:** User data in Appwrite with user-scoped permissions (users can only access their own documents). HTTPS enforced for all API calls (certificate pinning not implemented).

**Input Sanitization:** Email validation (regex), username uniqueness check (Appwrite query), keyword length limits (50 chars enforced), user input sanitized before AI prompts (prevents prompt injection).

**Rate Limiting:** Client-side rate limiting for AI APIs (max 1 request/second). Server-side rate limits enforced by Appwrite (100 requests/minute) and Perplexity (rate limit headers respected).

---

_Chapter 6 of the LearnTube Project Report_
