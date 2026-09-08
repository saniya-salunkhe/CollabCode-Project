import { useState, useEffect } from 'react';
import { reviewService } from '../services';
import { formatTime } from '../utils/constants';
import { toast } from './ToastContainer';

export default function ReviewPanel({ roomCode, code, language }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newComment, setNewComment] = useState({
    lineNumber: '',
    codeSnippet: '',
    comment: '',
    type: 'suggestion',
  });

  useEffect(() => {
    loadReviews();
  }, [roomCode]);

  const loadReviews = async () => {
    try {
      const { data } = await reviewService.getRoomReviews(roomCode);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!newComment.comment || !newComment.lineNumber) {
      toast.error('Line number and comment are required');
      return;
    }
    try {
      await reviewService.create(roomCode, {
        codeSnapshot: code,
        language,
        comments: [newComment],
      });
      toast.success('Review comment added');
      setNewComment({ lineNumber: '', codeSnippet: '', comment: '', type: 'suggestion' });
      setShowAddForm(false);
      loadReviews();
    } catch (err) {
      toast.error('Failed to add review');
    }
  };

  const handleToggleResolve = async (reviewId, commentId) => {
    try {
      await reviewService.toggleComment(reviewId, commentId);
      loadReviews();
    } catch (err) {
      toast.error('Failed to update comment');
    }
  };

  const allComments = reviews.flatMap((r) =>
    r.comments.map((c) => ({ ...c, reviewId: r._id, problemTitle: r.problemTitle }))
  );

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Peer Code Review</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Comment'}
        </button>
      </div>

      {showAddForm && (
        <div className="version-item mb-3">
          <div className="mb-2">
            <label className="text-sm text-secondary">Line Number</label>
            <input
              type="number"
              value={newComment.lineNumber}
              onChange={(e) => setNewComment({ ...newComment, lineNumber: e.target.value })}
              placeholder="e.g. 5"
              style={{ width: '100%' }}
            />
          </div>
          <div className="mb-2">
            <label className="text-sm text-secondary">Code Snippet (optional)</label>
            <textarea
              value={newComment.codeSnippet}
              onChange={(e) => setNewComment({ ...newComment, codeSnippet: e.target.value })}
              placeholder="The code you're commenting on..."
              style={{ width: '100%', minHeight: 40, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>
          <div className="mb-2">
            <label className="text-sm text-secondary">Comment</label>
            <textarea
              value={newComment.comment}
              onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
              placeholder="Your review comment..."
              style={{ width: '100%', minHeight: 50 }}
            />
          </div>
          <div className="mb-2">
            <label className="text-sm text-secondary">Type</label>
            <select
              value={newComment.type}
              onChange={(e) => setNewComment({ ...newComment, type: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug</option>
              <option value="question">Question</option>
              <option value="praise">Praise</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCreateReview}>
            Post Comment
          </button>
        </div>
      )}

      {allComments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p className="text-sm">No review comments yet.</p>
          <p className="text-muted text-sm mt-1">
            Review your teammates' code and suggest improvements.
          </p>
        </div>
      ) : (
        allComments.map((c) => (
          <div key={c._id} className={`review-comment ${c.status === 'resolved' ? 'resolved' : ''}`}>
            <div className="comment-header">
              <span className="badge badge-info">Line {c.lineNumber}</span>
              <span className={`comment-type comment-type-${c.type}`}>{c.type}</span>
            </div>
            {c.codeSnippet && (
              <div className="comment-code">{c.codeSnippet}</div>
            )}
            <div className="comment-body">{c.comment}</div>
            <div className="comment-footer">
              <span>By {c.authorName} • {formatTime(c.createdAt)}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleToggleResolve(c.reviewId, c._id)}
              >
                {c.status === 'resolved' ? '↺ Reopen' : '✓ Resolve'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
