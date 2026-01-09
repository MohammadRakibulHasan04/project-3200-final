# LearnTube - AI-Powered Personalized Learning Platform

<div align="center">

![LearnTube Logo](https://img.shields.io/badge/Learn-Tube-FF8E01?style=for-the-badge&logo=youtube&logoColor=white)

**Focus on learning. Remove the noise.**

[![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Appwrite](https://img.shields.io/badge/Appwrite-Backend-FD366E?style=flat-square&logo=appwrite)](https://appwrite.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)

</div>

---

## � Complete Documentation Available!

**For teachers, presentations, and understanding the project:**

- 🎯 **[START HERE: Documentation Index](DOCUMENTATION_INDEX.md)** - Find exactly what you need
- ⚡ **[Quick Reference](QUICK_REFERENCE.md)** - 1-page cheat sheet (print this!)
- 🎤 **[Presentation Guide](PRESENTATION_GUIDE.md)** - How to present to your teacher
- 📖 **[Complete Explanation](PROJECT_EXPLANATION.md)** - Every file explained in detail
- 🏗️ **[Architecture Diagrams](ARCHITECTURE_DIAGRAM.md)** - Visual system design
- 🚀 **[Build Guide](BUILD_GUIDE.md)** - How to create Android APK

**Quick Actions:**

- Need to present? → Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) + [PRESENTATION_GUIDE.md](PRESENTATION_GUIDE.md)
- Need to build? → Run `npm run build` or see [QUICK_START.md](QUICK_START.md)
- Want to understand everything? → Read [PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md)

---

## �📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Screens & Components](#-screens--components)
- [API Integrations](#-api-integrations)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Key Functionalities](#-key-functionalities)
- [Contributors](#-contributors)

---

## 🎯 Overview

**LearnTube** is an AI-powered mobile learning platform built with React Native and Expo. The application addresses the challenge of information overload on YouTube by providing users with a **personalized, structured learning experience** tailored to their specific goals and interests.

### Problem Statement

YouTube contains vast educational content, but learners often struggle with:

- **Information overload** - Too many videos to choose from
- **Lack of structure** - No clear learning path
- **Distraction** - Recommended videos often lead away from learning goals
- **No progress tracking** - Difficulty measuring learning journey

### Solution

LearnTube solves these problems by:

1. **AI-Generated Learning Roadmaps** - Personalized step-by-step learning paths
2. **Curated Course Recommendations** - Relevant YouTube playlists for each learning step
3. **AI Tutor** - Context-aware chat assistant for learning support
4. **Progress Tracking** - Visual roadmap with step completion tracking
5. **Focused Experience** - Distraction-free video player for courses

---

## ✨ Features

### 🔐 Authentication & User Management

- Email/password authentication via Appwrite
- User profile management with avatar generation
- Username availability checking
- Session management with auto-routing

### 📚 Personalized Onboarding

- Multi-step category selection (Major → Sub → Niche)
- Hierarchical category navigation (e.g., Computer Science → Web Development → React Native)
- AI-powered keyword generation based on selected interests
- Learning context input for personalized recommendations

### 🗺️ Learning Roadmap

- AI-generated learning paths with 8+ structured steps
- Visual progress tracking (Not Started → In Progress → Completed)
- Step-by-step progression with descriptions
- Animated UI with Moti for enhanced UX
- Context-aware AI chat for each roadmap step

### 📺 Course Discovery

- YouTube playlist recommendations for current learning step
- In-app playlist player with video selection
- Session-based caching for performance
- Manual refresh capability

### 🏠 Home Feed

- Personalized video recommendations based on keywords
- Custom search functionality
- Pull-to-refresh for new content
- Video cards with rich metadata

### 💬 AI Discussion

- Full-screen AI chat interface
- Context-aware responses based on user preferences
- Chat history with user context
- Powered by Perplexity AI

### 👤 Profile Management

- Edit name and username
- Update learning preferences (categories)
- Automatic roadmap regeneration on preference changes
- Account logout functionality

---

## 🛠️ Technology Stack

### Frontend

| Technology              | Version | Purpose                            |
| ----------------------- | ------- | ---------------------------------- |
| React Native            | 0.81.5  | Cross-platform mobile framework    |
| Expo                    | SDK 54  | Development toolkit & build system |
| TypeScript              | 5.9     | Type-safe JavaScript               |
| Expo Router             | 6.0     | File-based navigation              |
| Moti                    | 0.30.0  | Declarative animations             |
| React Native Reanimated | 4.1     | High-performance animations        |

### Backend & Services

| Service                 | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| **Appwrite**            | Authentication, Database, User Management    |
| **Google Gemini AI**    | Keyword generation from learning preferences |
| **Perplexity AI**       | Course recommendations & AI chat             |
| **YouTube Data API v3** | Video search, playlist fetching              |

### Key Libraries

| Library                                     | Purpose                       |
| ------------------------------------------- | ----------------------------- |
| `react-native-appwrite`                     | Appwrite SDK for React Native |
| `axios`                                     | HTTP client for API calls     |
| `react-native-youtube-iframe`               | YouTube video playback        |
| `expo-linear-gradient`                      | Gradient UI components        |
| `expo-blur`                                 | iOS-style blur effects        |
| `@react-native-async-storage/async-storage` | Local data caching            |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Home   │ │ Courses │ │ Roadmap │ │Discussion│ │ Profile │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │         │
│  ┌────┴───────────┴───────────┴───────────┴───────────┴────┐   │
│  │                    Global Context                        │   │
│  │              (User State, Authentication)                │   │
│  └─────────────────────────┬───────────────────────────────┘   │
└────────────────────────────┼───────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────┐
│                      SERVICE LAYER                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ appwrite │ │  gemini  │ │ youtube  │ │    perplexity    │   │
│  │   .ts    │ │   .ts    │ │   .ts    │ │       .ts        │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                │              │
│  ┌────┴────────────┴────────────┴────────────────┴──────────┐  │
│  │                      roadmap.ts                           │  │
│  │         (Roadmap Generation, Step Management)             │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Appwrite │ │  Gemini  │ │ YouTube  │ │    Perplexity    │   │
│  │   Cloud  │ │   API    │ │ Data API │ │       API        │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
project-3200-final/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Authentication routes
│   │   ├── _layout.tsx           # Auth layout wrapper
│   │   ├── sign-in.tsx           # Login screen
│   │   └── sign-up.tsx           # Registration screen
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── home.tsx              # Video feed screen
│   │   ├── courses.tsx           # Course playlist screen
│   │   ├── roadmap.tsx           # Learning roadmap screen
│   │   └── discussion.tsx        # AI chat screen
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Landing/splash screen
│   ├── onboarding.tsx            # Category selection & context
│   ├── profile.tsx               # User profile screen
│   └── modal.tsx                 # Modal screen
│
├── components/                   # Reusable UI components
│   ├── AIChatModal.tsx           # Context-aware AI chat modal
│   ├── PlaylistPlayer.tsx        # YouTube playlist player
│   ├── VideoCard.tsx             # Video thumbnail card
│   ├── FormField.tsx             # Input form component
│   ├── SearchFooter.tsx          # Search input component
│   └── ui/                       # Base UI components
│
├── context/                      # React Context providers
│   └── GlobalProvider.tsx        # Authentication & user state
│
├── lib/                          # Service layer & utilities
│   ├── appwrite.ts               # Appwrite SDK configuration & auth
│   ├── gemini.ts                 # Gemini AI keyword generation
│   ├── youtube.ts                # YouTube API with key rotation
│   ├── perplexity.ts             # Perplexity AI recommendations
│   ├── roadmap.ts                # Roadmap management service
│   ├── collections-setup.ts      # Database schema setup
│   ├── seed.ts                   # Category seeding script
│   └── fix-*.ts                  # Schema migration scripts
│
├── data/                         # Static data
│   └── categories.ts             # Category hierarchy definitions
│
├── hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts       # Theme detection
│   └── use-theme-color.ts        # Theme color utilities
│
├── constants/                    # App constants
│   └── Colors.ts                 # Color palette
│
├── assets/                       # Static assets (images, fonts)
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
└── .env                          # Environment variables (not in repo)
```

---

## 📱 Screens & Components

### Landing Screen (`index.tsx`)

- App branding with animated logo (Moti)
- Gradient "Get Started" button
- Auto-redirect based on auth state

### Authentication Screens

| Screen      | Features                                              |
| ----------- | ----------------------------------------------------- |
| **Sign In** | Email/password login, form validation, error handling |
| **Sign Up** | Full name, username, email, password registration     |

### Onboarding Screen (`onboarding.tsx`)

Two-step personalized setup:

1. **Category Selection**
   - Hierarchical drill-down navigation
   - Major → Sub → Niche category selection
   - Multi-select capability at leaf nodes
2. **Learning Context**
   - Free-text input for learning goals
   - Example prompts for guidance
   - Context used for keyword generation

### Tab Screens

#### Home Tab

- Video feed from personalized keywords
- Search footer for custom queries
- Pull-to-refresh functionality
- Video cards with thumbnails and metadata

#### Courses Tab

- Recommended playlists for current roadmap step
- Session-based caching
- In-app playlist player modal
- Video count and channel information

#### Roadmap Tab

- Visual step-by-step learning path
- Status indicators (Not Started, In Progress, Completed)
- Step expansion with descriptions
- "Ask AI" button for contextual help
- Step completion with auto-progression

#### Discussion Tab

- Full AI chat interface
- Context-aware responses
- Message history with timestamps
- User/AI message differentiation

### Profile Screen

- Avatar with initials
- Editable name and username
- Category preference management
- Automatic data reinitialization on changes
- Logout functionality

### Key Components

#### `AIChatModal`

Reusable AI chat modal that accepts:

- `contextTitle` - Learning topic
- `contextDescription` - Additional context
- Integrates with Perplexity AI for responses

#### `PlaylistPlayer`

YouTube playlist viewer with:

- Video list with thumbnails
- Current video indicator
- Auto-advancement on video end
- Close/minimize controls

---

## 🔌 API Integrations

### 1. Appwrite (Backend as a Service)

**Configuration:** `lib/appwrite.ts`

| Function                  | Purpose                         |
| ------------------------- | ------------------------------- |
| `createUser()`            | Register new user with document |
| `signIn()`                | Email/password authentication   |
| `getCurrentUser()`        | Fetch current session user      |
| `signOut()`               | Destroy current session         |
| `completeOnboarding()`    | Save preferences & keywords     |
| `updateUserProfile()`     | Update name/username            |
| `updateUserPreferences()` | Update categories               |
| `fetchCategoriesFromDB()` | Get category hierarchy          |

### 2. Google Gemini AI

**Configuration:** `lib/gemini.ts`

| Function             | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `generateKeywords()` | Generate search keywords from categories |

**Features:**

- Multi-model fallback (gemini-2.0-flash → gemini-flash-latest)
- Rate limit handling with retry logic
- Fallback keyword generation on failure
- 50-character keyword validation for Appwrite

### 3. YouTube Data API v3

**Configuration:** `lib/youtube.ts`

| Function                | Purpose                              |
| ----------------------- | ------------------------------------ |
| `searchVideos()`        | Search videos by query               |
| `getVideosByKeywords()` | Get videos from user keywords        |
| `searchPlaylists()`     | Find course playlists                |
| `getPlaylistDetails()`  | Fetch playlist metadata              |
| `getPlaylistVideos()`   | Get videos in a playlist             |
| `searchCourses()`       | Combined playlist search for courses |

**Features:**

- **API Key Rotation** - Support for 3 API keys
- **Quota Management** - Auto-rotation on exhaustion
- **24-Hour Caching** - AsyncStorage caching
- **Quota Flag** - Prevents repeated failed calls

### 4. Perplexity AI

**Configuration:** `lib/perplexity.ts`

| Function                     | Purpose                        |
| ---------------------------- | ------------------------------ |
| `getCourseRecommendations()` | AI-powered course discovery    |
| `getRecentVideos()`          | Trending content for home feed |
| `chatWithLearnTubeAI()`      | Context-aware chat responses   |

**Chat Features:**

- System prompt with user context
- Chat history for conversation continuity
- Optional topic context for focused responses

---

## 🗄️ Database Schema

### Appwrite Collections

#### `users`

| Attribute   | Type    | Description                  |
| ----------- | ------- | ---------------------------- |
| `accountId` | String  | Appwrite Auth account ID     |
| `email`     | String  | User email address           |
| `username`  | String  | Unique username              |
| `name`      | String  | Display name                 |
| `onboarded` | Boolean | Onboarding completion status |

#### `categories`

| Attribute    | Type        | Description                |
| ------------ | ----------- | -------------------------- |
| `originalId` | String      | Unique category identifier |
| `name`       | String      | Category display name      |
| `parentId`   | String/Null | Parent category ID         |
| `type`       | String      | "major", "sub", or "niche" |
| `image`      | String      | Category icon URL          |

#### `preferences`

| Attribute            | Type          | Description                  |
| -------------------- | ------------- | ---------------------------- |
| `userId`             | String        | Reference to user document   |
| `selectedCategories` | Array[String] | Selected category names      |
| `keywords`           | Array[String] | AI-generated search keywords |
| `learningContext`    | String        | User's learning goals text   |

#### `roadmap_steps`

| Attribute          | Type    | Description                               |
| ------------------ | ------- | ----------------------------------------- |
| `userId`           | String  | Reference to user                         |
| `stepNumber`       | Integer | Order in roadmap                          |
| `title`            | String  | Step title                                |
| `description`      | String  | Step description                          |
| `category`         | String  | Associated category                       |
| `status`           | String  | "not_started", "in_progress", "completed" |
| `playlistsFetched` | Boolean | Whether courses have been loaded          |
| `completedAt`      | String  | Completion timestamp                      |

#### `saved_videos`

| Attribute      | Type    | Description               |
| -------------- | ------- | ------------------------- |
| `userId`       | String  | Reference to user         |
| `stepId`       | String  | Reference to roadmap step |
| `stepNumber`   | Integer | Step order                |
| `playlistId`   | String  | YouTube playlist ID       |
| `title`        | String  | Video/playlist title      |
| `description`  | String  | Content description       |
| `thumbnailUrl` | String  | Thumbnail image URL       |
| `channelTitle` | String  | YouTube channel name      |
| `videoCount`   | Integer | Number of videos          |
| `platform`     | String  | "YouTube"                 |
| `url`          | String  | Full playlist URL         |
| `level`        | String  | Difficulty level          |
| `type`         | String  | "playlist" or "video"     |

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)
- Appwrite Cloud account or self-hosted instance

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/project-3200-final.git
cd project-3200-final
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Appwrite Configuration
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID=your_users_collection_id
EXPO_PUBLIC_APPWRITE_PLATFORM=com.learntube.project3200

# Google Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# YouTube Data API v3 (Multiple keys for quota rotation)
EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_1
EXPO_PUBLIC_YOUTUBE_API_KEY_2=your_youtube_api_key_2
EXPO_PUBLIC_YOUTUBE_API_KEY_3=your_youtube_api_key_3

# Perplexity AI
EXPO_PUBLIC_PERPLEXITY_API_KEY2=your_perplexity_api_key
```

### Step 4: Set Up Appwrite

1. Create a new project in Appwrite Console
2. Create a database and the required collections
3. Set up collection schemas as per the Database Schema section
4. Configure authentication (Email/Password)
5. Update platform configuration for your app bundle ID

### Step 5: Seed Categories

Run the category seeding script (automatically runs on first onboarding):

```bash
npx ts-node lib/seed.ts
```

---

## ⚙️ Environment Variables

| Variable                                  | Required | Description               |
| ----------------------------------------- | -------- | ------------------------- |
| `EXPO_PUBLIC_APPWRITE_ENDPOINT`           | ✅       | Appwrite API endpoint     |
| `EXPO_PUBLIC_APPWRITE_PROJECT_ID`         | ✅       | Appwrite project ID       |
| `EXPO_PUBLIC_APPWRITE_DATABASE_ID`        | ✅       | Appwrite database ID      |
| `EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID` | ✅       | Users collection ID       |
| `EXPO_PUBLIC_APPWRITE_PLATFORM`           | ✅       | App bundle identifier     |
| `EXPO_PUBLIC_GEMINI_API_KEY`              | ✅       | Google Gemini API key     |
| `EXPO_PUBLIC_YOUTUBE_API_KEY`             | ✅       | Primary YouTube API key   |
| `EXPO_PUBLIC_YOUTUBE_API_KEY_2`           | ⚠️       | Secondary YouTube API key |
| `EXPO_PUBLIC_YOUTUBE_API_KEY_3`           | ⚠️       | Tertiary YouTube API key  |
| `EXPO_PUBLIC_PERPLEXITY_API_KEY2`         | ✅       | Perplexity AI API key     |

---

## ▶️ Running the Application

### Development

```bash
# Start Expo development server
npm start

# Start with cache clear
npx expo start --clear

# Platform-specific
npm run android
npm run ios
npm run web
```

### Building for Production

```bash
# Build Android APK/AAB
eas build --platform android

# Build iOS IPA
eas build --platform ios
```

---

## 🔑 Key Functionalities

### 1. Personalized Keyword Generation

The system generates search keywords using:

- Selected learning categories
- User's learning context input
- Gemini AI with fallback mechanisms

### 2. AI-Powered Roadmap Generation

Perplexity AI creates structured learning paths with:

- 8 progressive steps
- Beginner to advanced progression
- Category-specific content

### 3. YouTube API Key Rotation

Handles quota limits gracefully:

- Supports up to 3 API keys
- Auto-rotation on quota exhaustion
- 24-hour caching to minimize API calls

### 4. Session-Based Caching

Optimizes performance with:

- Course caching per roadmap step
- Video feed caching
- Cache invalidation on step changes

### 5. Context-Aware AI Chat

The AI tutor provides:

- Responses based on current learning topic
- User preference awareness
- Conversation history for continuity

---

## 👥 Contributors

| Name        | Role      | Contributions          |
| ----------- | --------- | ---------------------- |
| _Your Name_ | Developer | Full-stack development |

---

## 📄 License

This project is developed for CSE 3200 - System Analysis and Design course.

---

<div align="center">

**Built with ❤️ using React Native & Expo**

</div>
