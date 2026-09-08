import { useState, useEffect } from 'react';
import { roomService } from '../services';
import { getInitials } from '../utils/constants';

export default function ContributionPanel({ roomCode }) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributions();
    // refresh every 10 seconds for live updates
    const interval = setInterval(loadContributions, 10000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const loadContributions = async () => {
    try {
      const { data } = await roomService.getContributions(roomCode);
      setContributions(data);
    } catch (err) {
      console.error('Failed to load contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  // Calculate total for percentage bars
  const totalChars = contributions.reduce((sum, c) => sum + c.charactersAdded, 0) || 1;

  // Compute a weighted contribution score
  const scored = contributions.map((c) => {
    const score =
      c.charactersAdded * 1 +
      c.codeSaves * 50 +
      c.chatMessages * 5 +
      c.reviewsGiven * 30 +
      c.reviewsResolved * 40 +
      c.acceptedSubmissions * 100 +
      c.submissions * 20;
    return { ...c, score };
  });

  const maxScore = Math.max(...scored.map((c) => c.score), 1);

  const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#3b82f6'];

  if (contributions.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📊</div>
        <p className="text-sm">No contribution data yet.</p>
        <p className="text-muted text-sm mt-1">
          Start coding, chatting, and reviewing to see your contributions here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>Contribution Analytics</h3>

      {scored.map((c, i) => {
        const percentage = Math.round((c.score / maxScore) * 100);
        return (
          <div key={c._id} className="contribution-card">
            <div className="user-header">
              <div
                className="avatar"
                style={{ background: colors[i % colors.length], width: 36, height: 36 }}
              >
                {getInitials(c.userName)}
              </div>
              <div>
                <div className="user-name">{c.userName}</div>
                <div className="text-muted text-sm">
                  Score: <strong style={{ color: colors[i % colors.length] }}>{c.score}</strong>
                </div>
              </div>
            </div>

            <div className="contribution-stats">
              <div className="contribution-stat">
                <div className="stat-label">Chars Added</div>
                <div className="stat-value">{c.charactersAdded}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Chars Deleted</div>
                <div className="stat-value">{c.charactersDeleted}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Code Saves</div>
                <div className="stat-value">{c.codeSaves}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Chat Messages</div>
                <div className="stat-value">{c.chatMessages}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Reviews Given</div>
                <div className="stat-value">{c.reviewsGiven}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Reviews Resolved</div>
                <div className="stat-value">{c.reviewsResolved}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Submissions</div>
                <div className="stat-value">{c.submissions}</div>
              </div>
              <div className="contribution-stat">
                <div className="stat-label">Accepted</div>
                <div className="stat-value text-success">{c.acceptedSubmissions}</div>
              </div>
            </div>

            <div className="contribution-bar">
              <div
                className="contribution-bar-fill"
                style={{ width: `${percentage}%`, background: colors[i % colors.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
