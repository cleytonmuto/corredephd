# Firestore Security Rules

## Quick Setup for Development

If you're in development and want to test quickly, you can temporarily use test mode rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**⚠️ WARNING: These rules allow anyone to read/write. Only use for development!**

## Production Security Rules

For production, use these role-based security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.profile;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && getUserRole() == 'admin';
    }
    
    // Posts are readable by everyone
    match /posts/{postId} {
      allow read: if true;
      // Only admins, editors, and authors can create posts
      allow create: if request.auth != null && 
                     getUserRole() in ['admin', 'editor', 'author'];
      // Admins and editors can edit any post, authors/contributors can edit own posts
      allow update, delete: if request.auth != null && (
        getUserRole() in ['admin', 'editor'] ||
        (getUserRole() in ['author', 'contributor'] && 
         resource.data.authorId == request.auth.uid)
      );
    }
    
    // Comments are readable by everyone
    match /comments/{commentId} {
      allow read: if true;
      // Authenticated users can create comments
      allow create: if request.auth != null;
      // Admins and editors can moderate (delete) comments
      allow delete: if request.auth != null && 
                     getUserRole() in ['admin', 'editor'];
    }
    
    // User profiles
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      // Users can create/update their own profile
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Site settings
    match /site/settings {
      // Public read for displaying site info (theme, title, etc.)
      allow read: if true;
      // Only admins can write
      allow write: if isAdmin();
    }
  }
}
```

## How to Update Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** > **Rules** tab
4. Paste the production rules above
5. Click **Publish**

## Important Notes

- The `getUserRole()` function reads from the `users` collection, so make sure user profiles exist
- If a user doesn't have a profile yet, the rules will fail. Users should sign up first to create their profile
- The site settings document path is `site/settings` (collection: `site`, document ID: `settings`)
- For the rules to work, you must have a user document in the `users` collection with the `profile` field set to `'admin'`

## Troubleshooting

### Error: "Missing or insufficient permissions"

1. **Check if you're logged in**: Make sure you're authenticated
2. **Check your user profile**: Verify your user document exists in the `users` collection with `profile: 'admin'`
3. **Check the rules**: Make sure the rules are published in Firebase Console
4. **Check the document path**: Site settings should be at `site/settings` (not `sites/settings`)

### Error: "User profile doesn't exist"

If you get errors about missing user profiles:
1. Sign out and sign back in to create your profile
2. Or manually create a user document in Firestore:
   - Collection: `users`
   - Document ID: Your Firebase Auth UID
   - Fields:
     - `uid`: Your UID
     - `email`: Your email
     - `displayName`: Your name
     - `profile`: `'admin'` (or `'subscriber'`, `'editor'`, etc.)
     - `createdAt`: Current timestamp
     - `updatedAt`: Current timestamp

