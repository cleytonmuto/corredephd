import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import type { Comment } from '../types';
import { canModerateComments } from '../utils/userProfile';
import './Comments.css';

interface CommentsProps {
  postId: string;
}

export default function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const moderateStatus = await canModerateComments(currentUser.uid);
        setCanModerate(moderateStatus);
      } else {
        setCanModerate(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const commentsRef = collection(db, 'comments');
      // First get all comments for this post, then filter by status in memory
      // This avoids needing a composite index
      const q = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const commentsData: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || 'approved';
        // Only include approved comments
        if (status === 'approved') {
          commentsData.push({
            id: doc.id,
            postId: data.postId,
            content: data.content,
            authorId: data.authorId,
            authorName: data.authorName,
            authorEmail: data.authorEmail,
            authorPhotoURL: data.authorPhotoURL,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            parentId: data.parentId,
            status: status,
          });
        }
      });
      
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to post a comment');
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const commentData = {
        postId,
        content: commentText.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorEmail: user.email || '',
        authorPhotoURL: user.photoURL || null,
        createdAt: Timestamp.now(),
        status: 'approved' as const, // Auto-approve for now, can be changed to 'pending' for moderation
      };

      await addDoc(collection(db, 'comments'), commentData);
      setCommentText('');
      await fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!canModerate) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
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
    return <div className="comments-container">Loading comments...</div>;
  }

  return (
    <div className="comments-container">
      <h3 className="comments-title">Comments ({comments.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="comment-form-group">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment here..."
              rows={4}
              className="comment-textarea"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="comment-submit-btn"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p>Please <a href="/login">log in</a> to post a comment.</p>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author-info">
                  {comment.authorPhotoURL && (
                    <img
                      src={comment.authorPhotoURL}
                      alt={comment.authorName}
                      className="comment-avatar"
                    />
                  )}
                  <div>
                    <div className="comment-author-name">{comment.authorName}</div>
                    <div className="comment-date">{formatDate(comment.createdAt)}</div>
                  </div>
                </div>
                {canModerate && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="comment-delete-btn"
                    title="Delete comment"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

