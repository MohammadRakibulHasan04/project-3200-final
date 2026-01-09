# Chapter 3: Requirements & Team Workflow

---

## 3.1 Functional Requirements

**FR-01 (Authentication):** User registration with email/username/password, login with credentials, session persistence across restarts, logout functionality.

**FR-02 (Onboarding & Personalization):** Hierarchical category selection (Major → Sub → Niche), multi-category selection, learning context text input, AI-powered keyword generation via Gemini.

**FR-03 (Learning Roadmap):** AI-generated 8+ step learning paths via Perplexity, visual progress indicators (not_started/in_progress/completed), manual step completion, auto-progression to next step.

**FR-04 (Course Discovery):** YouTube playlist fetching per roadmap step, course metadata display (title, channel, video count), in-app playlist player with iframe, session-based caching.

**FR-05 (AI Chat):** General AI chat in Discussion tab, context-aware chat modal per roadmap step, conversation history maintenance.

**FR-06 (Profile Management):** Edit name/username with availability check, update category preferences, roadmap regeneration on preference change.

## 3.2 Non-Functional Requirements

**Performance:** App launch <3s, AI operations <5s (roadmap generation 10-15s), 24-hour YouTube cache, cached data accessible offline.

**Security:** Appwrite JWT session tokens, environment variable API key storage, HTTPS for all calls, Appwrite-managed password encryption.

**Usability:** iOS/Android support via React Native, safe area handling for notches, 60 FPS animations with Moti, user-friendly error alerts.

**Scalability:** Appwrite Cloud auto-scales users, YouTube 3-key rotation (30,000 units/day), Appwrite managed database scaling.

**Reliability:** Gemini fallback keywords on API failure, YouTube key rotation on quota exhaustion, cached data returned on API errors.

## 3.3 System Constraints

**Hardware:** Android API 21+ (5.0), iOS 13.0+, 2GB RAM minimum, ~50MB app storage.

**Software:** Expo SDK 54, React Native 0.81.5, Node.js 18+ for development.

**API Limits:** YouTube 10,000 units/day/key, Gemini rate limits (15 RPM free), Perplexity token-based limits, Appwrite 75 requests/minute.

**Legal:** YouTube ToS compliance (embed only, no downloads), Google API Terms, GDPR-compatible data handling via Appwrite.

## 3.4 Technology Stack

**Frontend:** React Native (cross-platform), Expo SDK 54 (OTA updates, managed workflow), TypeScript (type safety).

**Navigation/UI:** Expo Router (file-based routing), Moti (declarative animations), React Native Reanimated (native-thread animations).

**Backend:** Appwrite BaaS (open-source, self-hostable, auth + database + storage).

**AI:** Google Gemini (keyword generation, free tier), Perplexity AI (roadmaps, recommendations, chat).

**Content:** YouTube Data API v3 (video search, playlists) with 3-key rotation.

**Storage:** AsyncStorage (local caching, key-value store).

**Rationale:** React Native enables single codebase for iOS/Android. Expo simplifies builds. BaaS accelerates development without server management. External AI APIs provide state-of-the-art NLP without ML infrastructure. YouTube offers billions of free educational videos.

## 3.5 Development Workflow

**Timeline:** 10-week project divided into 5 sprints (2 weeks each): Sprint 1 (Setup & Auth), Sprint 2 (Onboarding), Sprint 3 (Core Features), Sprint 4 (AI & Polish), Sprint 5 (Testing & Docs).

**Project Management:** Trello board with columns (Backlog, To Do, In Progress, Review, Done). GitHub feature branches merged to develop, then main for releases.

**Collaboration:** WhatsApp (daily standups), Discord (pair programming), GitHub Issues (bug tracking), Google Meet (sprint reviews).

**Team Roles:** Project Lead (architecture, core implementation), UI/UX Developer (screens, styling, animations), Backend Developer (Appwrite setup, schema), AI Specialist (Gemini/Perplexity integration), QA/Docs (testing, documentation).

---

_Chapter 3 of the LearnTube Project Report_
