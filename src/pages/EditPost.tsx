import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { isEditor } from '../utils/userProfile';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MediaUpload from '../components/MediaUpload';
import './CreatePost.css';

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
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
          setContent(data.content || '');
          setCategories(data.categories || []);
          setTags(data.tags || []);
          setFeaturedImage(data.featuredImage || '');
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

  const handleMediaUpload = (url: string) => {
    // Insert image into Quill editor at cursor position
    const quill = (document.querySelector('.ql-editor') as any)?.__quill;
    if (quill) {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url, 'user');
      quill.setSelection(range.index + 1);
    }
  };

  const handleFeaturedImageUpload = (url: string) => {
    setFeaturedImage(url);
  };

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
      const updateData: any = {
        title: title.trim(),
        content: content.trim(),
        updatedAt: Timestamp.now(),
      };

      if (categories.length > 0) {
        updateData.categories = categories;
      } else {
        updateData.categories = [];
      }

      if (tags.length > 0) {
        updateData.tags = tags;
      } else {
        updateData.tags = [];
      }

      if (featuredImage) {
        updateData.featuredImage = featuredImage;
      } else {
        updateData.featuredImage = null;
      }

      await updateDoc(postRef, updateData);
      
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
            <label>Featured Image (Optional)</label>
            {featuredImage && (
              <div className="featured-image-preview">
                <img src={featuredImage} alt="Featured" />
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="remove-image-btn"
                >
                  Remove
                </button>
              </div>
            )}
            <MediaUpload
              onUploadComplete={handleFeaturedImageUpload}
              accept="image/*"
              label=""
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
              <MediaUpload
                onUploadComplete={handleMediaUpload}
                accept="image/*,video/*"
                label="Upload Media to Insert"
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

