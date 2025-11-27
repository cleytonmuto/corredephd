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
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div 
          className="post-content" 
          dangerouslySetInnerHTML={{ __html: truncatedContent }}
        />
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

