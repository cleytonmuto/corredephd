# User Profiles and Access Control

## Overview

The blog platform now uses a role-based access control system with two profile types:
- **Reader**: Can view posts but cannot create them
- **Editor**: Can view and create posts

## How It Works

### Sign Up Process

1. User clicks "Sign up with Google"
2. Google OAuth2 authentication is performed
3. A user profile is created in Firestore with `profile: "reader"`
4. User is redirected to the home page

### Sign In Process

1. User clicks "Sign in with Google"
2. Google OAuth2 authentication is performed
3. System checks if a profile exists:
   - If profile exists: User is signed in with their existing profile
   - If no profile exists: A profile is automatically created as `profile: "reader"` (for backward compatibility)
4. User is redirected to the home page

### Profile Structure

User profiles are stored in Firestore under the `users` collection with the following structure:

```typescript
{
  uid: string;              // Firebase Auth user ID
  email: string;            // User's email
  displayName: string;      // User's display name
  profile: "reader" | "editor";  // User's role
  createdAt: Timestamp;     // When profile was created
  updatedAt: Timestamp;     // When profile was last updated
}
```

## Access Control

### Creating Posts

- Only users with `profile: "editor"` can create posts
- The "Create Post" link only appears in the header for editors
- If a non-editor tries to access `/create-post`, they are redirected with an error message

### Viewing Posts

- All users (including unauthenticated visitors) can view posts
- No profile check is required for reading posts

## Promoting Users to Editor

To grant a user editor access:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the user's document in the `users` collection (document ID is the user's UID)
4. Edit the document and change the `profile` field from `"reader"` to `"editor"`
5. Save the changes

The user will immediately have editor access on their next page load.

## Security Rules

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts are readable by everyone
    match /posts/{postId} {
      allow read: if true;
      // Only editors can write
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.profile == 'editor';
    }
    
    // User profiles
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      // Only allow creating/updating profile during sign-up (server-side or with proper validation)
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Files Modified

- `src/utils/userProfile.ts` - Utility functions for managing user profiles
- `src/pages/Login.tsx` - Added sign-up functionality and profile creation
- `src/pages/Home.tsx` - Added editor check to show/hide "Create Post" link
- `src/pages/CreatePost.tsx` - Added editor permission check
- `src/types/index.ts` - Added UserProfile interface

