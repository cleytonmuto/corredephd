export interface Post {
  id: string;
  title: string;
  content: string; // HTML content
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorEmail: string;
  categories?: string[]; // Array of category names
  tags?: string[]; // Array of tag names
  featuredImage?: string; // URL to featured image
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
