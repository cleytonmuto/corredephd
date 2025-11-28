# User Profiles and Access Control

## Overview

The blog platform uses a comprehensive role-based access control (RBAC) system with five user roles, similar to WordPress:
- **Admin**: Full access to all features including site settings
- **Editor**: Can create, edit, and delete any post, moderate comments
- **Author**: Can create and edit their own posts
- **Contributor**: Can create posts but cannot publish (can edit own drafts)
- **Subscriber**: Can view posts and comment (default role for new users)

## How It Works

### Sign Up Process

1. User clicks "Sign up with Google"
2. Google OAuth2 authentication is performed
3. A user profile is created in Firestore with `profile: "subscriber"` (default role)
4. User is redirected to the home page

### Sign In Process

1. User clicks "Sign in with Google"
2. Google OAuth2 authentication is performed
3. System checks if a profile exists:
   - If profile exists: User is signed in with their existing profile
   - If no profile exists: A profile is automatically created as `profile: "subscriber"` (for backward compatibility)
4. User is redirected to the home page

### Profile Structure

User profiles are stored in Firestore under the `users` collection with the following structure:

```typescript
{
  uid: string;              // Firebase Auth user ID
  email: string;            // User's email
  displayName: string;      // User's display name
  profile: "admin" | "editor" | "author" | "contributor" | "subscriber";  // User's role
  createdAt: Timestamp;     // When profile was created
  updatedAt: Timestamp;     // When profile was last updated
}
```

## Access Control

### Role Permissions

| Permission | Admin | Editor | Author | Contributor | Subscriber |
|------------|-------|--------|--------|-------------|------------|
| View Posts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Posts | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Own Posts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Any Post | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Own Posts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Any Post | ✅ | ✅ | ❌ | ❌ | ❌ |
| Moderate Comments | ✅ | ✅ | ❌ | ❌ | ❌ |
| Comment on Posts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Access Site Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

### Creating Posts

- Users with roles `admin`, `editor`, or `author` can create posts
- The "Create Post" link only appears in the header for users with create permissions
- If a user without permission tries to access `/create-post`, they are redirected with an error message

### Editing Posts

- **Admins and Editors**: Can edit any post
- **Authors and Contributors**: Can only edit their own posts
- Edit buttons only appear for users with appropriate permissions

### Deleting Posts

- **Admins and Editors**: Can delete any post
- **Authors and Contributors**: Can only delete their own posts
- Delete buttons only appear for users with appropriate permissions

### Commenting

- All authenticated users (all roles) can comment on posts
- Comments are auto-approved by default (can be changed to require moderation)

### Comment Moderation

- **Admins and Editors**: Can delete comments (moderation)
- Delete button appears next to comments for moderators

### Site Settings

- **Admin only**: Can access `/site-settings` to customize:
  - Site title, description, and logo
  - Theme selection
  - Color customization
  - Custom CSS
- "Settings" link in navigation only appears for admins

### Viewing Posts

- All users (including unauthenticated visitors) can view posts
- No profile check is required for reading posts

## Managing User Roles

To change a user's role:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the user's document in the `users` collection (document ID is the user's UID)
4. Edit the document and change the `profile` field to one of:
   - `"admin"` - Full access
   - `"editor"` - Can create/edit/delete any post, moderate comments
   - `"author"` - Can create and edit own posts
   - `"contributor"` - Can create posts but only edit own posts
   - `"subscriber"` - Can view and comment (default)
5. Save the changes

The user will immediately have the new permissions on their next page load.

### Recommended Role Assignments

- **Admin**: Site owner, needs full control
- **Editor**: Content managers, trusted authors
- **Author**: Regular content creators
- **Contributor**: Guest writers, limited access
- **Subscriber**: Regular users, commenters

## Security Rules

For production, update your Firestore security rules to enforce role-based access. See the README.md for the complete security rules example that includes:
- Post creation/editing/deletion based on roles
- Comment creation and moderation
- User profile access
- Site settings (admin only)

## Utility Functions

The `src/utils/userProfile.ts` file provides several utility functions:

- `getUserProfile(userId)` - Get user profile from Firestore
- `createUserProfile(user, role)` - Create or update user profile
- `isEditor(userId)` - Check if user is editor or admin
- `isAdmin(userId)` - Check if user is admin
- `canCreatePosts(userId)` - Check if user can create posts (admin, editor, author)
- `canEditAnyPost(userId)` - Check if user can edit any post (admin, editor)
- `canEditOwnPosts(userId)` - Check if user can edit own posts (all roles except subscriber)
- `canModerateComments(userId)` - Check if user can moderate comments (admin, editor)
- `getUserRole(userId)` - Get user's role

## Files Related to User Management

- `src/utils/userProfile.ts` - Utility functions for managing user profiles
- `src/types/index.ts` - UserProfile interface and UserRole type
- `src/pages/Login.tsx` - Sign-up/sign-in functionality and profile creation
- `src/pages/Home.tsx` - Role-based UI (Create Post, Settings links)
- `src/pages/CreatePost.tsx` - Permission check for post creation
- `src/pages/EditPost.tsx` - Permission check for post editing
- `src/pages/PostDetail.tsx` - Permission check for post editing/deleting
- `src/pages/SiteSettings.tsx` - Admin-only site settings page
- `src/components/Comments.tsx` - Comment moderation permissions

