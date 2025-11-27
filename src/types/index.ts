export interface Post {
  id: string;
  title: string;
  content: string; // HTML content
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorEmail: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  profile: 'reader' | 'editor';
  createdAt: Date;
  updatedAt: Date;
}
