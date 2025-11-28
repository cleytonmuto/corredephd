import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { Post } from '../types';
import { canCreatePosts } from '../utils/userProfile';
import PostCard from '../components/PostCard';
import './Home.css';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [canCreate, setCanCreate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const { settings } = useSiteSettings();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const canCreateStatus = await canCreatePosts(currentUser.uid);
        const adminStatus = await isAdmin(currentUser.uid);
        setCanCreate(canCreateStatus);
        setIsAdminUser(adminStatus);
      } else {
        setCanCreate(false);
        setIsAdminUser(false);
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
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(post => {
        const titleMatch = post.title.toLowerCase().includes(query);
        // Strip HTML tags for content search
        const contentText = post.content.replace(/<[^>]*>/g, '').toLowerCase();
        const contentMatch = contentText.includes(query);
        const authorMatch = post.authorName.toLowerCase().includes(query);
        const categoryMatch = post.categories?.some(cat => cat.toLowerCase().includes(query));
        const tagMatch = post.tags?.some(tag => tag.toLowerCase().includes(query));
        
        return titleMatch || contentMatch || authorMatch || categoryMatch || tagMatch;
      });
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.categories && post.categories.includes(selectedCategory)
      );
    }
    
    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(post => 
        post.tags && post.tags.includes(selectedTag)
      );
    }
    
    setFilteredPosts(filtered);
  }, [selectedCategory, selectedTag, searchQuery, posts]);

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
          <div className="site-branding">
            {settings?.siteLogo && (
              <img src={settings.siteLogo} alt={settings.siteTitle} className="site-logo" />
            )}
            <h1 className="blog-title">{settings?.siteTitle || 'Corre de PhD'}</h1>
          </div>
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
              {canCreate && (
                <Link to="/create-post" className="nav-link">Create Post</Link>
              )}
              {isAdminUser && (
                <Link to="/site-settings" className="nav-link">Settings</Link>
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
        {!loading && (
          <div className="search-filters-section">
            <div className="search-section">
              <label htmlFor="search-input">Search Posts:</label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, content, author, category, or tag..."
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="clear-search-btn"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {(allCategories.length > 0 || allTags.length > 0) && (
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
                {(selectedCategory || selectedTag || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedTag('');
                      setSearchQuery('');
                    }}
                    className="clear-filters-btn"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {loading ? (
          <div className="loading">Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts">
            {posts.length === 0 
              ? 'No posts yet. Check back soon!' 
              : searchQuery || selectedCategory || selectedTag
                ? 'No posts match your search or filters.'
                : 'No posts yet. Check back soon!'}
          </div>
        ) : (
          <div className="posts-list">
            {filteredPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                isEditor={canCreate}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

