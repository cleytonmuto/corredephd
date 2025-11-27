# Daily Blog Platform

A modern blog platform built with React, TypeScript, and Firebase. The owner can post daily messages in HTML format, and visitors can view all recent posts.

## Features

- 📝 View all blog posts in reverse chronological order (newest first)
- 🔐 OAuth2 authentication with Google (Firebase Auth)
- ✍️ Create and publish posts with HTML content
- 🎨 Modern, responsive UI with gradient design
- 💾 Persistent storage using Firebase Firestore

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

### 4. Firestore Security Rules (Optional but Recommended)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts are readable by everyone
    match /posts/{postId} {
      allow read: if true;
      // Only authenticated users can write
      allow write: if request.auth != null;
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

1. **View Posts**: Visit the home page to see all recent posts in reverse chronological order
2. **Login**: Click "Login" to sign in with Google OAuth2
3. **Create Post**: After logging in, click "Create Post" to add a new blog post
   - Enter a title
   - Enter HTML content (you can use tags like `<p>`, `<strong>`, `<em>`, `<br>`, etc.)
   - Click "Publish Post"

## Project Structure

```
src/
├── components/       # Reusable components
│   └── PostCard.tsx  # Component for displaying a single post
├── firebase/         # Firebase configuration
│   └── config.ts     # Firebase initialization
├── pages/            # Page components
│   ├── Home.tsx      # Main page showing all posts
│   ├── Login.tsx     # Authentication page
│   └── CreatePost.tsx # Post creation page
├── types/            # TypeScript type definitions
│   └── index.ts      # Post and User interfaces
├── App.tsx           # Main app component with routing
└── main.tsx          # Entry point
```

## Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase Auth** - OAuth2 authentication
- **Firebase Firestore** - Database for posts
- **React Router** - Client-side routing

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
