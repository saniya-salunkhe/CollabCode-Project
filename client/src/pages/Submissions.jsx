import { useState, useEffect } from 'react';
import { submissionService } from '../services';
import { formatTime } from '../utils/constants';

export default function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data } = await submissionService.getMy();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const { data } = await submissionService.getById(id);
      setSelected(data);
    } catch (err) {
      console.error('Failed to load submission:', err);
    }
  };

  const filtered = filter
    ? submissions.filter((s) => s.status === filter)
    : submissions;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Submissions</h1>
      </div>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Accepted">Accepted</option>
          <option value="Wrong Answer">Wrong Answer</option>
          <option value="Compilation Error">Compilation Error</option>
          <option value="Runtime Error">Runtime Error</option>
          <option value="Time Limit Exceeded">Time Limit Exceeded</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No submissions yet. Start solving problems!</p>
        </div>
      ) : (
        <div className="problem-list">
          {filtered.map((s) => (
            <div
              key={s._id}
              className="submission-item"
              onClick={() => handleView(s._id)}
            >
              <div className="submission-info">
                <span className="submission-title">{s.problemTitle}</span>
                <span className="submission-meta">
                  {s.language} • {formatTime(s.createdAt)} {s.isCollaborative && '• 👥 Collaborative'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">
                  {s.testCasesPassed}/{s.totalTestCases}
                </span>
                <span className={`badge ${
                  s.status === 'Accepted' ? 'badge-easy' :
                  s.status === 'Compilation Error' || s.status === 'Runtime Error' ? 'badge-hard' : 'badge-medium'
                }`}>
                  {s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="flex justify-between items-center mb-3">
              <h3>{selected.problemTitle}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="badge badge-info">{selected.language}</span>
              <span className={`badge ${
                selected.status === 'Accepted' ? 'badge-easy' :
                selected.status === 'Compilation Error' ? 'badge-hard' : 'badge-medium'
              }`}>
                {selected.status}
              </span>
              <span className="text-muted text-sm">
                {selected.testCasesPassed}/{selected.totalTestCases} tests • {formatTime(selected.createdAt)}
              </span>
            </div>
            {selected.stderr && (
              <div className="example text-danger mb-2">
                <strong>Stderr:</strong>
                <pre>{selected.stderr}</pre>
              </div>
            )}
            {selected.compileOutput && (
              <div className="example text-warning mb-2">
                <strong>Compiler Output:</strong>
                <pre>{selected.compileOutput}</pre>
              </div>
            )}
            <div className="example">
              <strong>Submitted Code:</strong>
              <pre style={{ maxHeight: 400, overflowY: 'auto', fontSize: 12 }}>{selected.code}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
