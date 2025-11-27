import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { Post } from '../types';
import { isEditor } from '../utils/userProfile';
import ConfirmDialog from '../components/ConfirmDialog';
import ShareButtons from '../components/ShareButtons';
import './PostDetail.css';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isUserEditor, setIsUserEditor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

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
              <h1 className="blog-title">Daily Blog</h1>
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
                {isUserEditor && (
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
            <div className="post-detail-header">
              <div className="post-detail-title-row">
                <h1 className="post-detail-title">{post.title}</h1>
                {isUserEditor && (
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
            <div 
              className="post-detail-content" 
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <ShareButtons postId={post.id} postTitle={post.title} />
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

