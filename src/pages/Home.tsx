import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { Post } from '../types';
import { isEditor } from '../utils/userProfile';
import PostCard from '../components/PostCard';
import './Home.css';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isUserEditor, setIsUserEditor] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const editorStatus = await isEditor(currentUser.uid);
        setIsUserEditor(editorStatus);
      } else {
        setIsUserEditor(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const postsData: Post[] = [];
      const categoriesSet = new Set<string>();
      const tagsSet = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const post: Post = {
          id: doc.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          categories: data.categories || [],
          tags: data.tags || [],
          featuredImage: data.featuredImage || undefined,
        };
        
        postsData.push(post);
        
        // Collect all categories and tags
        if (post.categories) {
          post.categories.forEach(cat => categoriesSet.add(cat));
        }
        if (post.tags) {
          post.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      
      setPosts(postsData);
      setFilteredPosts(postsData);
      setAllCategories(Array.from(categoriesSet).sort());
      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    let filtered = [...posts];
    
    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.categories && post.categories.includes(selectedCategory)
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(post => 
        post.tags && post.tags.includes(selectedTag)
      );
    }
    
    setFilteredPosts(filtered);
  }, [selectedCategory, selectedTag, posts]);

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      // Refresh posts list
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className="home-container">
      <header className="blog-header">
        <div className="header-left">
          <h1 className="blog-title">Corre de PhD</h1>
          {user && (
            <div className="user-info">
              <span className="user-greeting">Welcome,</span>
              <span className="user-name">{user.displayName || user.email || 'User'}</span>
            </div>
          )}
        </div>
        <nav className="blog-nav">
          {user ? (
            <>
              {isUserEditor && (
                <Link to="/create-post" className="nav-link">Create Post</Link>
              )}
              <button onClick={handleLogout} className="nav-link nav-link-logout">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
        </nav>
      </header>

      <main className="posts-container">
        {!loading && (allCategories.length > 0 || allTags.length > 0) && (
          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="category-filter">Filter by Category:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {allCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="tag-filter">Filter by Tag:</label>
              <select
                id="tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="filter-select"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            {(selectedCategory || selectedTag) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedTag('');
                }}
                className="clear-filters-btn"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts">
            {posts.length === 0 
              ? 'No posts yet. Check back soon!' 
              : 'No posts match your filters.'}
          </div>
        ) : (
          <div className="posts-list">
            {filteredPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                isEditor={isUserEditor}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

