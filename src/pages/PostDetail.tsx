import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { Post } from '../types';
import { canEditAnyPost, canEditOwnPosts } from '../utils/userProfile';
import { useSiteSettings } from '../hooks/useSiteSettings';
import ConfirmDialog from '../components/ConfirmDialog';
import ShareButtons from '../components/ShareButtons';
import Comments from '../components/Comments';
import './PostDetail.css';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [canEdit, setCanEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && post) {
        const canEditAny = await canEditAnyPost(currentUser.uid);
        const canEditOwn = await canEditOwnPosts(currentUser.uid);
        const isOwnPost = currentUser.uid === post.authorId;
        setCanEdit(canEditAny || (canEditOwn && isOwnPost));
      } else {
        setCanEdit(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        const postRef = doc(db, 'posts', id);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const data = postSnap.data();
          setPost({
            id: postSnap.id,
            title: data.title,
            content: data.content,
            createdAt: data.createdAt?.toDate() || new Date(),
            authorId: data.authorId,
            authorName: data.authorName,
            authorEmail: data.authorEmail,
            categories: data.categories || [],
            tags: data.tags || [],
            featuredImage: data.featuredImage || undefined,
          });
        } else {
          alert('Post not found.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        alert('Failed to load post. Please try again.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  useEffect(() => {
    if (user && post) {
      const checkPermissions = async () => {
        const canEditAny = await canEditAnyPost(user.uid);
        const canEditOwn = await canEditOwnPosts(user.uid);
        const isOwnPost = user.uid === post.authorId;
        setCanEdit(canEditAny || (canEditOwn && isOwnPost));
      };
      checkPermissions();
    }
  }, [user, post]);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(db, 'posts', id));
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="post-detail-container">Loading...</div>;
  }

  if (!post) {
    return <div className="post-detail-container">Post not found.</div>;
  }

  return (
    <>
      <div className="post-detail-container">
        <header className="blog-header">
          <div className="header-left">
            <Link to="/" className="blog-title-link">
              <div className="site-branding">
                {settings?.siteLogo && (
                  <img src={settings.siteLogo} alt={settings.siteTitle} className="site-logo" />
                )}
                <h1 className="blog-title">{settings?.siteTitle || 'Corre de PhD'}</h1>
              </div>
            </Link>
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
                {canEdit && post && (
                  <Link to="/create-post" className="nav-link">Create Post</Link>
                )}
                <button onClick={() => signOut(auth)} className="nav-link nav-link-logout">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link">Login</Link>
            )}
          </nav>
        </header>

        <main className="post-detail-main">
          <article className="post-detail-card">
            {post.featuredImage && (
              <div className="post-detail-featured-image">
                <img src={post.featuredImage} alt={post.title} />
              </div>
            )}
            <div className="post-detail-header">
              <div className="post-detail-title-row">
                <h1 className="post-detail-title">{post.title}</h1>
                {canEdit && (
                  <div className="post-actions">
                    <Link to={`/edit-post/${post.id}`} className="post-action-btn post-edit-btn">
                      Edit
                    </Link>
                    <button 
                      onClick={handleDeleteClick} 
                      className="post-action-btn post-delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="post-meta">
                <span className="post-author">By {post.authorName}</span>
                <span className="post-date">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            {(post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0) ? (
              <div className="post-detail-taxonomy">
                {post.categories && post.categories.length > 0 && (
                  <div className="post-categories">
                    <span className="taxonomy-label">Categories:</span>
                    {post.categories.map((category) => (
                      <span key={category} className="category-badge">
                        {category}
                      </span>
                    ))}
                  </div>
                )}
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    <span className="taxonomy-label">Tags:</span>
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag-badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <div 
              className="post-detail-content" 
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <ShareButtons postId={post.id} postTitle={post.title} />
            <Comments postId={post.id} />
            <div className="post-detail-footer">
              <Link to="/" className="back-to-home-link">← Back to Home</Link>
            </div>
          </article>
        </main>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}

