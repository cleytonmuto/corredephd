import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { isEditor } from '../utils/userProfile';
import './CreatePost.css';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
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
          alert('You do not have permission to create posts. Only editors can create posts.');
          navigate('/');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create a post');
      return;
    }

    if (!isUserEditor) {
      alert('You do not have permission to create posts. Only editors can create posts.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        createdAt: Timestamp.now(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorEmail: user.email || '',
      });

      // Reset form
      setTitle('');
      setContent('');
      
      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || checkingPermission) {
    return <div className="create-post-container">Loading...</div>;
  }

  if (!isUserEditor) {
    return (
      <div className="create-post-container">
        <div className="create-post-card">
          <h2>Access Denied</h2>
          <p>You do not have permission to create posts. Only users with editor profile can create posts.</p>
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
        <h2>Create New Post</h2>
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
              {loading ? 'Publishing...' : 'Publish Post'}
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

