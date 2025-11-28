import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { canCreatePosts } from '../utils/userProfile';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import MediaUrlInput from '../components/MediaUrlInput';
import './CreatePost.css';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [canCreate, setCanCreate] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      } else {
        setUser(currentUser);
        const canCreateStatus = await canCreatePosts(currentUser.uid);
        setCanCreate(canCreateStatus);
        setCheckingPermission(false);
        
        if (!canCreateStatus) {
          alert('You do not have permission to create posts. Only admins, editors, and authors can create posts.');
          navigate('/');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
    },
  }), []);

  const handleAddCategory = () => {
    const trimmed = categoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleMediaUrlChange = (url: string) => {
    // Insert image into Quill editor at cursor position
    if (url) {
      const quill = (document.querySelector('.ql-editor') as any)?.__quill;
      if (quill) {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', url, 'user');
        quill.setSelection(range.index + 1);
      }
    }
  };

  const handleFeaturedImageUrlChange = (url: string) => {
    setFeaturedImage(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to create a post');
      return;
    }

    if (!canCreate) {
      alert('You do not have permission to create posts. Only admins, editors, and authors can create posts.');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    setLoading(true);
    try {
      const postData: any = {
        title: title.trim(),
        content: content.trim(),
        createdAt: Timestamp.now(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorEmail: user.email || '',
      };

      if (categories.length > 0) {
        postData.categories = categories;
      }

      if (tags.length > 0) {
        postData.tags = tags;
      }

      if (featuredImage) {
        postData.featuredImage = featuredImage;
      }

      await addDoc(collection(db, 'posts'), postData);

      // Reset form
      setTitle('');
      setContent('');
      setCategories([]);
      setTags([]);
      setFeaturedImage('');
      
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

  if (!canCreate) {
    return (
      <div className="create-post-container">
        <div className="create-post-card">
          <h2>Access Denied</h2>
          <p>You do not have permission to create posts. Only admins, editors, and authors can create posts.</p>
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
            <label>Featured Image URL (Optional)</label>
            {featuredImage && (
              <div className="featured-image-preview">
                <img src={featuredImage} alt="Featured" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="remove-image-btn"
                >
                  Remove
                </button>
              </div>
            )}
            <MediaUrlInput
              onUrlChange={handleFeaturedImageUrlChange}
              placeholder="https://example.com/image.jpg"
              value={featuredImage}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              placeholder="Write your post content here..."
              className="rich-text-editor"
            />
            <div className="editor-actions">
              <MediaUrlInput
                onUrlChange={handleMediaUrlChange}
                label="Insert Media URL"
                placeholder="https://example.com/image.jpg or https://example.com/video.mp4"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="categories">Categories</label>
            <div className="tag-input-group">
              <input
                type="text"
                id="categories"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Enter category and press Enter"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="add-tag-btn"
              >
                Add
              </button>
            </div>
            {categories.length > 0 && (
              <div className="tag-list">
                {categories.map((category) => (
                  <span key={category} className="tag-item">
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tag-input-group">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Enter tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="add-tag-btn"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tag-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag-item">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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

