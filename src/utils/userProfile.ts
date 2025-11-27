import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserProfile } from '../types';
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
  profile: 'reader' | 'editor' = 'reader'
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
  return profile?.profile === 'editor';
}

