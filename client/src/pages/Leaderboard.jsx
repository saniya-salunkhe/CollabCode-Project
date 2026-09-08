import { useState, useEffect } from 'react';
import { authService } from '../services';
import { getInitials } from '../utils/constants';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data } = await authService.getLeaderboard();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Leaderboard</h1>
        <p className="text-secondary text-sm">Top contributors on CollabCode</p>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏆</div>
          <p>No data yet. Be the first to solve a problem!</p>
        </div>
      ) : (
        <div className="problem-list">
          {users.map((u, i) => (
            <div key={u._id} className="problem-card" style={{ cursor: 'default' }}>
              <div className="flex items-center gap-3">
                <span style={{
                  fontSize: 20,
                  fontWeight: 700,
                  width: 32,
                  textAlign: 'center',
                  color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-muted)',
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div className="avatar" style={{ background: u.avatarColor, width: 36, height: 36 }}>
                  {getInitials(u.name)}
                </div>
                <div>
                  <div className="title">{u.name}</div>
                  <div className="text-muted text-sm">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-success" style={{ fontSize: 18, fontWeight: 700 }}>
                    {u.problemsSolved}
                  </div>
                  <div className="text-muted text-sm">Solved</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{u.totalSubmissions}</div>
                  <div className="text-muted text-sm">Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-warning" style={{ fontSize: 18, fontWeight: 700 }}>
                    {u.collaborations}
                  </div>
                  <div className="text-muted text-sm">Collabs</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
