# Firebase Setup Guide

## 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note:** In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser.

## 2. Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click the web icon `</>` to add one
7. Copy the configuration values from the `firebaseConfig` object

## 3. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development) or configure security rules
4. Select a location for your database
5. Click "Enable"

## 4. Enable Google Authentication (CRITICAL FOR SIGN-IN)

### Step 1: Enable Google Provider in Firebase

1. In Firebase Console, go to **Authentication**
2. Click "Get started" if you haven't enabled it yet
3. Go to the **Sign-in method** tab
4. Click on **Google** provider
5. Toggle "Enable" to ON
6. Enter a **Project support email** (required)
7. Click "Save"

### Step 2: Configure Authorized Domains

1. Still in Authentication > Sign-in method
2. Scroll down to **Authorized domains**
3. Make sure these domains are listed:
   - `localhost` (for development)
   - Your production domain (if applicable)
   - `your-project-id.firebaseapp.com` (usually added automatically)

### Step 3: Configure OAuth Consent Screen (Google Cloud Console)

If you're getting OAuth errors, you may need to configure the OAuth consent screen:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** > **OAuth consent screen**
4. Choose "External" (unless you have a Google Workspace)
5. Fill in the required information:
   - App name
   - User support email
   - Developer contact email
6. Click "Save and Continue"
7. Add scopes (if needed):
   - `email`
   - `profile`
   - `openid`
8. Add test users (if in testing mode) or publish the app
9. Click "Save and Continue" through the remaining steps

### Step 4: Enable Google+ API (if needed)

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Make sure the necessary APIs are enabled:
   - Google Identity Toolkit API
   - Google+ API (if still available)

## 5. Common Issues and Solutions

### Issue: "Sign in with Google" button doesn't work

**Possible causes:**
1. Google provider not enabled in Firebase Authentication
2. OAuth consent screen not configured
3. Authorized domains not set correctly
4. Browser blocking popups (check browser console for errors)

**Solutions:**
- Check browser console (F12) for specific error messages
- Verify Google provider is enabled in Firebase Console
- Make sure `localhost` is in authorized domains
- Try a different browser or incognito mode
- Check if popup blockers are interfering

### Issue: "Error 400: redirect_uri_mismatch"

This means the redirect URI is not authorized. Firebase should handle this automatically, but if you see this:
- Check authorized domains in Firebase Authentication
- Make sure you're using the correct Firebase project

### Issue: "Error 403: access_denied"

- OAuth consent screen might not be configured
- The app might be in testing mode and your email is not in test users
- Check Google Cloud Console > OAuth consent screen

## 6. Testing

After setup:
1. Restart your dev server (`npm run dev`)
2. Navigate to `/login`
3. Click "Sign in with Google"
4. A popup should appear for Google sign-in
5. After signing in, you should be redirected to the home page

## 7. Security Rules (Production)

For production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

