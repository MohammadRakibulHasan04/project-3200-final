# Chapter 5: System Design & Architecture

---

## 5.1 Methodological Structure

LearnTube follows a **3-tier BaaS (Backend-as-a-Service) architecture** with external API integration:

**Tier 1 - Presentation Layer:** React Native/Expo mobile application with TypeScript. Screens include authentication (Sign In/Up), onboarding (category selection, context input), main tabs (Home, Roadmap, Courses, Discussion), and profile management. State managed via React Context API. Navigation via Expo Router (file-based routing).

**Tier 2 - Service Layer:** Business logic modules in `/lib` directory. Services: `appwrite.ts` (auth, CRUD operations), `gemini.ts` (keyword generation), `perplexity.ts` (roadmap/chat AI), `youtube.ts` (video search with key rotation), `roadmap.ts` (roadmap management). Data flows: User input → Service layer → External APIs → Database/Cache.

**Tier 3 - External Services:** Appwrite Cloud (authentication, NoSQL database, storage), Google Gemini 2.0 (AI keyword generation), Perplexity AI Sonar (roadmap generation, recommendations, chat), YouTube Data API v3 (video/playlist search).

**Rationale:** BaaS eliminates server infrastructure overhead. External AI APIs provide state-of-the-art NLP without ML expertise. React Native enables single codebase for iOS/Android.

## 5.2 High-Level Architecture Diagram

**Layer Communication Flow:**

```
┌────────────────────────────────────────────────┐
│         PRESENTATION LAYER (React Native)      │
│  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ │
│  │  Auth  │ │Onboarding│ │Roadmap │ │Courses │ │
│  └────┬───┘ └────┬─────┘ └──┬─────┘ └──┬─────┘ │
└───────┼──────────┼──────────┼──────────┼───────┘
        │          │          │          │
        ↓          ↓          ↓          ↓
┌─────────────────────────────────────────────────┐
│           SERVICE LAYER (lib/)                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │appwrite│ │ gemini │ │youtube │ │perplexity│  │
│  └────┬───┘ └───┬────┘ └───┬────┘ └────┬─────┘  │
└───────┼─────────┼──────────┼───────────┼────────┘
        │         │          │           │
        ↓         ↓          ↓           ↓
┌─────────────────────────────────────────────────┐
│         EXTERNAL SERVICES                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │Appwrite│ │Gemini  │ │YouTube │ │Perplexity│  │
│  │ Cloud  │ │API 2.0 │ │Data API│ │AI Sonar  │  │
│  └────────┘ └────────┘ └────────┘ └──────────┘  │
└─────────────────────────────────────────────────┘
```

**Data Exchange:** Presentation sends user actions to Service layer. Services make REST API calls to External Services. Responses flow back: External Services → Services (parsing/caching) → Presentation (state updates). AsyncStorage provides session cache for YouTube data (24-hour TTL).

## 5.3 Module Interaction Diagram

**Problem Domain:** Online learning suffers from information overload (YouTube's billion videos), lack of structure (no learning paths), and distractions (engagement-optimized recommendations). LearnTube operates in the personalized education technology domain, specifically AI-curated learning path generation from open content.

**Module Interactions:**

1. **Authentication Module** (`app/(auth)`) ↔ **Appwrite Service** (`lib/appwrite.ts`): User signup/login creates account, session token stored in GlobalProvider context.

2. **Onboarding Module** (`app/onboarding.tsx`) → **Gemini Service** (`lib/gemini.ts`): Selected categories + learning context sent to Gemini API. Returns 10-15 educational keywords (max 50 chars). Fallback: predefined keyword mapping if API fails.

3. **Roadmap Module** (`app/(tabs)/roadmap.tsx`) ↔ **Perplexity Service** (`lib/perplexity.ts`): User preferences trigger roadmap generation. Perplexity returns 8+ steps (title, description, level). Steps stored in Appwrite `roadmap_steps` collection.

4. **Courses Module** (`app/(tabs)/courses.tsx`) ↔ **YouTube Service** (`lib/youtube.ts`): Roadmap step ID passed to YouTube search. Returns playlists (title, thumbnail, channel, video count). Session cache avoids repeated API calls.

5. **Discussion Module** (`app/(tabs)/discussion.tsx`) ↔ **Perplexity Service**: User message + conversation history + user context sent. AI returns contextual response. AIChatModal adds roadmap step context for targeted guidance.

**Cross-Module Data Sharing:** GlobalProvider context holds user state (accountId, email, onboarded status). Roadmap data passed via navigation params. YouTube cache in AsyncStorage shared across sessions.

## 5.4 Database Schema / ER Diagram

**Appwrite Collections (NoSQL Documents):**

**users** (Primary Collection)

- accountId: string (PK, links to Appwrite Auth)
- email: string (unique)
- username: string (unique)
- name: string
- onboarded: boolean

**categories** (Hierarchical)

- originalId: string (PK)
- name: string
- parentId: string | null (FK to categories.originalId)
- type: enum (major, sub, niche)
- image: string (url)

**preferences** (User Settings)

- userId: string (FK to users.accountId)
- selectedCategories: string[] (category names)
- keywords: string[] (Gemini-generated, max 50 chars each)
- learningContext: string (user input)

**roadmap_steps** (Learning Path)

- userId: string (FK to users.accountId)
- stepNumber: integer (order)
- title: string
- description: string
- category: string
- status: enum (not_started, in_progress, completed)
- playlistsFetched: boolean
- completedAt: datetime | null

**saved_videos** (YouTube Playlists)

- userId: string (FK to users.accountId)
- stepId: string (FK to roadmap_steps.$id)
- playlistId: string (YouTube ID)
- title: string
- description: string
- thumbnailUrl: string
- channelTitle: string
- videoCount: integer
- platform: string ("YouTube")
- url: string
- level: string
- type: string ("playlist")

**Relationships:** users 1:N preferences, users 1:N roadmap_steps, roadmap_steps 1:N saved_videos, categories self-referencing (parentId).

## 5.5 Interface Specifications / API Contracts

**Appwrite API (BaaS):**

- Endpoint: `https://cloud.appwrite.io/v1`
- Auth: `POST /account/sessions/email` (body: email, password) → Returns session JWT
- Database: `POST /databases/{databaseId}/collections/{collectionId}/documents` → Create document
- Query: `GET /databases/{databaseId}/collections/{collectionId}/documents?queries[]=equal("userId", "123")` → List documents

**Gemini API (Keyword Generation):**

- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Request: `POST` with JSON `{contents: [{parts: [{text: "Generate keywords for..."}]}]}`
- Response: `{candidates: [{content: {parts: [{text: "keyword1, keyword2..."}]}}]}`
- Models: gemini-2.0-flash (primary), gemini-flash-latest (fallback)
- Rate Limit: 15 RPM free tier

**Perplexity AI (Roadmap/Chat):**

- Endpoint: `https://api.perplexity.ai/chat/completions`
- Request: `POST` with JSON `{model: "sonar", messages: [{role: "user", content: "..."}]}`
- Response: `{choices: [{message: {content: "..."}}]}`
- Auth: Bearer token in header
- Use Cases: Roadmap generation, course recommendations, AI chat

**YouTube Data API v3 (Content):**

- Endpoint: `https://www.googleapis.com/youtube/v3`
- Search: `GET /search?key={apiKey}&q={query}&type=playlist&maxResults=10`
- Playlist: `GET /playlists?key={apiKey}&id={playlistIds}&part=snippet,contentDetails`
- Response: JSON with items array (id, snippet with title/description/thumbnails)
- Quota: 10,000 units/day/key (search = 100 units)
- Rotation: 3 keys → 30,000 units/day total

## 5.6 Security & Performance Design

**Security Measures:**

**Authentication:** Appwrite JWT tokens with expiry. Session persistence via secure storage. Email/password bcrypt-hashed by Appwrite.

**API Keys:** Environment variables (`.env`) with Expo public prefix. Never committed to Git. Client-side keys monitored with budget alerts.

**Data Privacy:** User data in Appwrite with user-scoped permissions. HTTPS enforced for all API calls. No sensitive data in AsyncStorage except session tokens.

**Input Sanitization:** Email format validation, username uniqueness check, keyword length limits (50 chars), user input sanitized before AI prompts to prevent injection.

**Performance Optimizations:**

**Caching:** YouTube results cached per session (24-hour TTL) in AsyncStorage. Reduces API calls by ~70%. Cache keys: `youtube_cache_{query}`.

**API Quota Management:** 3-key rotation for YouTube (exhausted keys tracked, skipped). Gemini multi-model fallback prevents single point of failure.

**Lazy Loading:** Roadmap steps loaded on demand. Courses fetched only when user clicks "Get Courses" button.

**Animations:** Moti uses native-thread animations (60 FPS target). React Native Reanimated for smooth transitions.

**Response Times:** Authentication <2s, keyword generation 3-5s, roadmap generation 10-15s, YouTube search 1-2s (cached) / 2-4s (fresh), AI chat 3-8s. All within acceptable UX thresholds.

---

_Chapter 5 of the LearnTube Project Report_
