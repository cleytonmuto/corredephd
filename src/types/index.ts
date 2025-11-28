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

export type UserRole = 'admin' | 'editor' | 'author' | 'contributor' | 'subscriber';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  profile: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // For nested/reply comments
  status?: 'approved' | 'pending' | 'spam' | 'trash';
}
