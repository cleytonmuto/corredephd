import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { isEditor } from '../utils/userProfile';
import './CreatePost.css';

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [isUserEditor, setIsUserEditor] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        const editorStatus = await isEditor(currentUser.uid);
        setIsUserEditor(editorStatus);
        setCheckingPermission(false);
        
        if (!editorStatus) {
          alert('You do not have permission to edit posts. Only editors can edit posts.');
          navigate('/');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

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
          setTitle(data.title);
          setContent(data.content);
        } else {
          alert('Post not found.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        alert('Failed to load post. Please try again.');
        navigate('/');
      } finally {
        setLoadingPost(false);
      }
    };

    if (isUserEditor && !checkingPermission) {
      fetchPost();
    }
  }, [id, isUserEditor, checkingPermission, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to edit a post');
      return;
    }

    if (!isUserEditor) {
      alert('You do not have permission to edit posts. Only editors can edit posts.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    if (!id) {
      alert('Post ID is missing.');
      return;
    }

    setLoading(true);
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        title: title.trim(),
        content: content.trim(),
        updatedAt: Timestamp.now(),
      });
      
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || checkingPermission || loadingPost) {
    return <div className="create-post-container">Loading...</div>;
  }

  if (!isUserEditor) {
    return (
      <div className="create-post-container">
        <div className="create-post-card">
          <h2>Access Denied</h2>
          <p>You do not have permission to edit posts. Only users with editor profile can edit posts.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h2>Edit Post</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content (HTML)</label>
            <div className="content-editor-container">
              <div className="editor-section">
                <label htmlFor="content" className="section-label">Editor</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter post content in HTML format"
                  rows={15}
                  required
                />
                <small className="form-hint">
                  You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, etc.
                </small>
              </div>
              <div className="preview-section">
                <label className="section-label">Preview</label>
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: content || '<em class="preview-placeholder">Your HTML content will appear here...</em>' }} />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

