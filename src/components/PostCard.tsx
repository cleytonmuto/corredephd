import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { truncateHTML } from '../utils/htmlTruncate';
import ConfirmDialog from './ConfirmDialog';
import ShareButtons from './ShareButtons';

interface PostCardProps {
  post: Post;
  isEditor: boolean;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, isEditor, onDelete }: PostCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Truncate content with fallback
  const truncationResult = truncateHTML(post.content || '', 300);
  const truncatedContent = truncationResult.content || post.content || '';
  const isTruncated = truncationResult.isTruncated;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(post.id);
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  return (
    <>
      <article className="post-card">
        {post.featuredImage && (
          <div className="post-featured-image">
            <Link to={`/post/${post.id}`}>
              <img src={post.featuredImage} alt={post.title} />
            </Link>
          </div>
        )}
        <div className="post-header">
          <div className="post-title-row">
            <Link to={`/post/${post.id}`} className="post-title-link">
              <h2 className="post-title">{post.title}</h2>
            </Link>
            {isEditor && (
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
            <div className="post-dates">
              <span className="post-date">
                <span className="date-label">Created:</span> {formatDate(post.createdAt)}
              </span>
              {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
                <span className="post-updated">
                  <span className="date-label">Updated:</span> {formatDate(post.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div 
          className="post-content" 
          dangerouslySetInnerHTML={{ __html: truncatedContent }}
        />
        {(post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0) ? (
          <div className="post-taxonomy">
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
        {isTruncated && (
          <div className="post-read-more">
            <Link to={`/post/${post.id}`} className="read-more-link">
              Read more →
            </Link>
          </div>
        )}
        <ShareButtons postId={post.id} postTitle={post.title} />
      </article>

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

