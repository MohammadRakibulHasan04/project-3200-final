# Production Build Guide

## Overview

This document provides instructions for creating production-ready Android builds of the LearnTube application.

## Prerequisites

### Required Software

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Required Files

- `.env` file with all API keys
- App icons and splash screens in `assets/images/`
- Valid `app.json` configuration

## Build Options

### Option 1: Local APK Build (Fastest)

Build directly on your machine without EAS.

```bash
# Run pre-build validation
node scripts/pre-build-check.js

# Create local release build
npx expo run:android --variant release
```

**Output**: APK file in `android/app/build/outputs/apk/release/`

### Option 2: EAS Build (Recommended for Production)

Build using Expo Application Services for optimized production builds.

```bash
# Login to Expo (first time only)
eas login

# Configure EAS (first time only)
eas build:configure

# Build production APK
npm run build:android

# Or build preview APK for testing
npm run build:android:preview
```

**Output**: Download link provided after build completes

### Option 3: AAB for Play Store

For Google Play Store submission, build an Android App Bundle.

```bash
# Modify eas.json to use AAB instead of APK
# Change "buildType": "apk" to "buildType": "aab"

# Then run
eas build --platform android --profile production
```

## Pre-Build Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] `.env` file configured with valid API keys
- [ ] App version incremented in `app.json`
- [ ] Android version code incremented in `app.json`
- [ ] All images/assets present
- [ ] Code linted and error-free (`npm run lint`)
- [ ] App tested on Android device/emulator
- [ ] Pre-build validation passed (`node scripts/pre-build-check.js`)

## Environment Variables

Ensure your `.env` file contains:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID=your_collection_id
EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID=your_collection_id
EXPO_PUBLIC_APPWRITE_USER_PREFS_COLLECTION_ID=your_collection_id
EXPO_PUBLIC_APPWRITE_SAVED_VIDEOS_COLLECTION_ID=your_collection_id
EXPO_PUBLIC_APPWRITE_ROADMAPS_COLLECTION_ID=your_collection_id

EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
EXPO_PUBLIC_YOUTUBE_API_KEY_2=your_youtube_api_key_2
EXPO_PUBLIC_YOUTUBE_API_KEY_3=your_youtube_api_key_3

EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Build Configuration

### app.json Settings

```json
{
  "expo": {
    "name": "LearnTube",
    "version": "1.0.0",
    "android": {
      "package": "com.learntube.project3200",
      "versionCode": 1
    }
  }
}
```

### Version Management

- Increment `version` for user-facing updates (e.g., 1.0.0 → 1.0.1)
- Increment `versionCode` for each build (must be unique for Play Store)

## Testing the Build

### Install APK on Device

```bash
# Using ADB
adb install path/to/app.apk

# Or transfer APK to device and install manually
```

### Test Checklist

- [ ] App launches without crashes
- [ ] Authentication works (sign up/sign in)
- [ ] Video playback functional
- [ ] Roadmap generation works
- [ ] AI chat responds correctly
- [ ] All navigation works
- [ ] Error handling displays properly
- [ ] No console errors in production

## Troubleshooting

### Build Fails

1. Clear cache: `npx expo start --clear`
2. Clean node_modules: `rm -rf node_modules && npm install`
3. Check logs for specific errors

### APK Installation Fails

1. Enable "Install from Unknown Sources" on Android device
2. Ensure minimum Android version (API 21+)
3. Check device storage space

### Runtime Errors

1. Verify all environment variables are set
2. Check network connectivity
3. Review error boundary logs
4. Test API endpoints separately

## Distribution

### Internal Testing

- Share APK file directly
- Use Firebase App Distribution
- Use TestFlight (for iOS)

### Play Store Release

1. Build AAB: `buildType: "aab"` in eas.json
2. Create Play Store listing
3. Upload AAB to Play Console
4. Complete store listing details
5. Submit for review

## Error Handling Features

The app includes comprehensive error handling:

- **Error Boundaries**: Catch React component errors
- **Global Error Handler**: Centralized error logging and user messages
- **Network Error Handling**: Graceful handling of connection issues
- **API Error Handling**: Specific messages for API failures
- **Retry Logic**: Automatic retries with exponential backoff

## Performance Optimization

Production builds include:

- Code minification
- Asset optimization
- Bundle size reduction
- Hermes JavaScript engine
- React Compiler optimizations

## Support

For issues or questions:

1. Check error logs in Error Boundary
2. Review console logs
3. Check network tab for API issues
4. Verify environment configuration

---

**Last Updated**: January 9, 2026
**Build Version**: 1.0.0
