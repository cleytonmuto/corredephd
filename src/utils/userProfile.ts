import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserProfile, UserRole } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        profile: data.profile,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Create or update user profile
 */
export async function createUserProfile(
  user: FirebaseUser,
  profile: UserRole = 'subscriber'
): Promise<UserProfile> {
  try {
    const now = Timestamp.now();
    const profileData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Anonymous',
      profile,
      createdAt: now,
      updatedAt: now,
    };

    const profileRef = doc(db, 'users', user.uid);
    await setDoc(profileRef, profileData, { merge: true });

    return {
      uid: profileData.uid,
      email: profileData.email,
      displayName: profileData.displayName,
      profile,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Check if user is an editor
 */
export async function isEditor(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.profile === 'editor' || profile?.profile === 'admin';
}

/**
 * Check if user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.profile === 'admin';
}

/**
 * Check if user can create posts (admin, editor, author)
 */
export async function canCreatePosts(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  const role = profile?.profile;
  return role === 'admin' || role === 'editor' || role === 'author';
}

/**
 * Check if user can edit any post (admin, editor)
 */
export async function canEditAnyPost(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  const role = profile?.profile;
  return role === 'admin' || role === 'editor';
}

/**
 * Check if user can edit their own posts (admin, editor, author, contributor)
 */
export async function canEditOwnPosts(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  const role = profile?.profile;
  return role === 'admin' || role === 'editor' || role === 'author' || role === 'contributor';
}

/**
 * Check if user can moderate comments (admin, editor)
 */
export async function canModerateComments(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  const role = profile?.profile;
  return role === 'admin' || role === 'editor';
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const profile = await getUserProfile(userId);
  return profile?.profile || null;
}

