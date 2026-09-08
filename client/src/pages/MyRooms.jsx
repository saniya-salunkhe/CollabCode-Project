import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services';
import { formatTime } from '../utils/constants';
import { toast } from '../components/ToastContainer';

export default function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const { data } = await roomService.getMyRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    try {
      await roomService.join(joinCode.trim());
      navigate(`/room/${joinCode.trim().toUpperCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join room');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Rooms</h1>
      </div>

      {/* Join Room */}
      <div className="stat-card mb-4">
        <div className="label mb-2">Join a Room</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code (e.g. CC7421)"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            style={{ flex: 1, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}
          />
          <button className="btn btn-primary" onClick={handleJoin}>Join Room</button>
        </div>
      </div>

      {/* Room List */}
      <h3 className="mb-3">Your Active Rooms</h3>
      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🚪</div>
          <p>No rooms yet.</p>
          <p className="text-muted text-sm mt-1">
            Choose a problem and select Collaborative Mode to create a room.
          </p>
        </div>
      ) : (
        <div className="problem-list">
          {rooms.map((r) => (
            <div
              key={r._id}
              className="problem-card"
              onClick={() => navigate(`/room/${r.roomCode}`)}
            >
              <div>
                <div className="title">{r.problem?.title || 'Unknown Problem'}</div>
                <div className="meta">
                  <span className="badge badge-info">{r.currentLanguage}</span>
                  <span>• {formatTime(r.updatedAt || r.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm" style={{ color: 'var(--accent-light)' }}>
                  {r.roomCode}
                </span>
                <span className={`badge ${r.status === 'active' ? 'badge-easy' : 'badge-medium'}`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
