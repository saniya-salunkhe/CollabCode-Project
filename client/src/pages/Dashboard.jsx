import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { DIFFICULTY_COLORS } from '../utils/constants';

export default function Dashboard() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ difficulty: '', search: '', tag: '' });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadProblems();
  }, [filters]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.search) params.search = filters.search;
      if (filters.tag) params.tag = filters.tag;
      const { data } = await problemService.getAll(params);
      setProblems(data);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-secondary text-sm">
            Choose a problem to solve solo or with friends
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="label">Problems Solved</div>
          <div className="value text-success">{user?.problemsSolved || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Submissions</div>
          <div className="value">{user?.totalSubmissions || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Collaborations</div>
          <div className="value text-warning">{user?.collaborations || 0}</div>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search problems..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ minWidth: 250 }}
        />
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : problems.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📝</div>
          <p>No problems found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="problem-list">
          {problems.map((p) => (
            <div
              key={p._id}
              className="problem-card"
              onClick={() => navigate(`/problem/${p.slug}`)}
            >
              <div>
                <div className="title">{p.title}</div>
                <div className="meta">
                  {p.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="badge badge-info">{tag}</span>
                  ))}
                </div>
              </div>
              <span className={`badge ${DIFFICULTY_COLORS[p.difficulty] || 'badge-easy'}`}>
                {p.difficulty}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
