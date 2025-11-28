# Corre de PhD Platform

A modern, WordPress.com-inspired blog platform built with React, TypeScript, and Firebase. A full-featured content management system with rich text editing, user roles, comments, search, themes, and customization options.

## Features

### Content Management
- 📝 **Rich Text Editor** - WYSIWYG editor with formatting toolbar (React Quill)
- 🖼️ **Media Support** - Insert images and videos via external URLs
- 🏷️ **Categories & Tags** - Organize posts with categories and tags
- 🖼️ **Featured Images** - Set featured images for posts
- 🔍 **Search** - Full-text search across posts (title, content, author, categories, tags)
- 📊 **Filtering** - Filter posts by categories and tags

### User Management
- 👥 **Role-Based Access Control** - 5 user roles: Admin, Editor, Author, Contributor, Subscriber
- 🔐 **OAuth2 Authentication** - Google sign-in/sign-up
- 💬 **Comments System** - Users can comment on posts (with moderation support)
- 👤 **User Profiles** - User avatars and profile information

### Customization
- 🎨 **Multiple Themes** - 5 built-in themes (Default, Dark, Minimal, Modern, Classic)
- 🎨 **Custom CSS** - Add custom CSS to style your site
- 🎨 **Color Customization** - Customize primary and secondary colors
- 🏠 **Site Settings** - Customize site title, description, and logo
- 📱 **Responsive Design** - Mobile-friendly interface

### Content Features
- 📝 View all blog posts in reverse chronological order (newest first)
- ✏️ **Edit Posts** - Edit existing posts (with permission-based access)
- 🗑️ **Delete Posts** - Delete posts (with permission-based access)
- 📄 **Post Details** - Full post view with comments
- 🔗 **Share Buttons** - Share posts on social media

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project with Firestore and Authentication enabled

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

**📖 For detailed setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

1. Create a `.env` file in the root directory with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. Get your Firebase credentials from Firebase Console:
   - Go to Project Settings > Your apps > Web app
   - Copy the configuration values

3. Enable **Firestore Database** and **Google Authentication** (see FIREBASE_SETUP.md for detailed steps)

**Important:** The app now reads configuration from environment variables. Make sure your `.env` file is properly configured!

### 4. Firestore Security Rules (REQUIRED)

**📖 For detailed security rules setup, see [FIRESTORE_RULES.md](./FIRESTORE_RULES.md)**

**⚠️ IMPORTANT:** You must update your Firestore security rules for the application to work properly. The default rules will block access to site settings, comments, and other features.

Quick setup:
1. Go to Firebase Console > Firestore Database > Rules
2. Copy the rules from [FIRESTORE_RULES.md](./FIRESTORE_RULES.md)
3. Click "Publish"

For development/testing, you can temporarily use test mode rules (see FIRESTORE_RULES.md), but **never use test mode in production**.

For production, update your Firestore security rules to enforce role-based access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.profile;
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
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Site settings (admin only)
    match /site/settings {
      allow read: if true; // Public read for displaying site info
      allow write: if request.auth != null && 
                    getUserRole() == 'admin';
    }
  }
}
```

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

## Usage

### For Visitors
1. **View Posts**: Visit the home page to see all recent posts
2. **Search**: Use the search bar to find posts by keywords
3. **Filter**: Filter posts by categories or tags using the dropdown menus
4. **Read Posts**: Click on any post to read the full content
5. **Comment**: Log in to comment on posts

### For Authors/Editors/Admins
1. **Login**: Click "Login" to sign in with Google OAuth2
2. **Create Post**: Click "Create Post" to add a new blog post
   - Enter a title
   - Use the rich text editor to format your content
   - Add a featured image URL (optional)
   - Add categories and tags
   - Insert media (images/videos) via URLs
   - Click "Publish Post"
3. **Edit Post**: Click "Edit" on any post you have permission to edit
4. **Delete Post**: Click "Delete" on any post you have permission to delete

### For Admins
1. **Site Settings**: Click "Settings" in the navigation (admin only)
   - Customize site title, description, and logo
   - Select a theme
   - Customize colors
   - Add custom CSS
2. **Moderate Comments**: Delete inappropriate comments
3. **Manage Users**: Update user roles in Firebase Console

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── PostCard.tsx     # Component for displaying a single post
│   ├── Comments.tsx     # Comments component
│   ├── MediaUrlInput.tsx # Media URL input component
│   ├── ConfirmDialog.tsx # Confirmation dialog
│   └── ShareButtons.tsx  # Social sharing buttons
├── firebase/            # Firebase configuration
│   └── config.ts        # Firebase initialization
├── hooks/               # Custom React hooks
│   └── useSiteSettings.ts # Hook for site settings
├── pages/               # Page components
│   ├── Home.tsx         # Main page showing all posts
│   ├── Login.tsx        # Authentication page
│   ├── CreatePost.tsx   # Post creation page
│   ├── EditPost.tsx     # Post editing page
│   ├── PostDetail.tsx   # Post detail page with comments
│   └── SiteSettings.tsx # Site settings page (admin only)
├── styles/              # Global styles
│   └── themes.css       # Theme definitions
├── types/               # TypeScript type definitions
│   └── index.ts         # Type interfaces
├── utils/               # Utility functions
│   ├── userProfile.ts   # User profile management
│   ├── siteSettings.ts  # Site settings management
│   └── htmlTruncate.ts  # HTML truncation utility
├── App.tsx              # Main app component with routing
└── main.tsx             # Entry point
```

## Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase Auth** - OAuth2 authentication
- **Firebase Firestore** - Database for posts, comments, users, and settings
- **React Router** - Client-side routing
- **React Quill New** - Rich text editor (React 19 compatible)
- **CSS Variables** - Dynamic theming and color customization

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
