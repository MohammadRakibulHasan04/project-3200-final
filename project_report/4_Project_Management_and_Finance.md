# Chapter 4: Project Management & Finance

---

## 4.1 Work Breakdown Structure

**Project Phases:** Planning & Setup → Design & Architecture → Core Development → AI Integration → Testing & QA → Documentation & Deployment.

**Key Deliverables:** Runnable app shell (Week 1-2), connected backend with Appwrite (Week 2), authentication module (Week 3-4), onboarding flow with AI keywords (Week 4), roadmap generation (Week 5-6), courses tab with YouTube player (Week 6), AI chat interface (Week 7-8), stable tested build (Week 9), final documentation (Week 10).

**Task Breakdown:** 1.1 (Planning: Expo setup, Appwrite config, API keys) → 1.2 (Design: architecture, schema, UI/UX) → 1.3 (Core Dev: auth, onboarding, home, roadmap, courses, discussion, profile screens) → 1.4 (AI: Gemini keywords, Perplexity roadmaps/chat, YouTube integration) → 1.5 (Testing: unit, integration, device testing, bugs) → 1.6 (Docs: README, report, release build).

## 4.2 Project Timeline

**10-Week Schedule:**

- Weeks 1-2: Planning & Setup (backend configuration)
- Weeks 3-4: Auth & Onboarding (M2: Auth Ready)
- Weeks 5-6: Core Features (M3: Roadmap/Courses functional)
- Weeks 7-8: AI Integration (M4: AI complete)
- Weeks 9-10: Testing & Documentation (M5-M6: submission)

**Milestones Achieved:** All 6 milestones met on schedule (Backend Setup, Auth Ready, Core Features, AI Complete, Testing Complete, Project Submission).

**Dependencies:** Authentication requires Appwrite setup. Onboarding requires authentication. Roadmap requires Perplexity integration. Courses require YouTube API + Roadmap. All testing requires completed development.

## 4.3 Budget Analysis

**Development Costs:** $0 total. Hardware/software already owned. Free tiers used: Appwrite Cloud (75K requests/month), YouTube API (30K units/day with 3 keys), Gemini (60 RPM), Perplexity (limited free).

**Production Scaling Estimate:** $45-145/month for paid tiers (Appwrite Pro $15, YouTube API $0-50, Gemini $10-30, Perplexity $20-50). Current free tier supports prototype and ~1,500 DAU.

## 4.4 Risk Management

**High-Risk Issues Mitigated:**

- **YouTube Quota Exhaustion (R1)**: 3-key rotation (30K units/day), session caching, fallback to cached data. Status: Successfully mitigated.
- **Gemini Rate Limiting (R2)**: Multi-model fallback (4 models tested), retry logic, fallback keyword generation. Status: Successfully mitigated.

**Medium-Risk Issues:**

- **Appwrite Downtime (R3)**: Minimal risk with 99.9% SLA, error handling implemented.
- **Scope Creep (R5)**: Fixed requirements document, sprint reviews prevented feature bloat.

**Technical Risks:** Device compatibility tested on Android/iOS. API failures handled with fallbacks. All risks proactively addressed during development.

## 4.5 Key Management Decisions

**Technology Choices:** Appwrite over Firebase (open-source, simpler SDK), Expo managed workflow (OTA updates, faster builds), Perplexity for roadmaps (real-time data), Gemini for keywords (free tier), multi-key YouTube rotation (3x quota).

**Pivots:** OpenAI → Gemini (cost), self-hosted → Appwrite Cloud (simplicity), manual roadmaps → AI-generated (scalability), single → multi-key YouTube (quota issues).

**Trade-offs:** Core features prioritized over polish (time constraint), 24-hour caching vs. real-time data (quota conservation), BaaS vs. custom backend (development speed), React Native vs. native (cross-platform efficiency).

**Lessons Learned:** API rate limits require caching + fallbacks, LLMs need structured prompts, Context API sufficient for state management, device testing essential before deployment.

---

_Chapter 4 of the LearnTube Project Report_

---

_Chapter 4 of the LearnTube Project Report_
