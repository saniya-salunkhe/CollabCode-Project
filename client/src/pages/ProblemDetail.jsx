import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemService, submissionService } from '../services';
import { DIFFICULTY_COLORS } from '../utils/constants';

export default function ProblemDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSubmissions, setRecentSubmissions] = useState([]);

  useEffect(() => {
    loadProblem();
    loadSubmissions();
  }, [slug]);

  const loadProblem = async () => {
    try {
      const { data } = await problemService.getBySlug(slug);
      setProblem(data);
    } catch (err) {
      console.error('Failed to load problem:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data } = await submissionService.getMy({ problemId: undefined });
      // filter to this problem after load — slug is not in submission list
      setRecentSubmissions(data.slice(0, 5));
    } catch (err) {
      // non-fatal
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!problem) return <div className="empty-state"><p>Problem not found.</p></div>;

  return (
    <div className="dashboard">
      <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate('/dashboard')}>
        ← Back to Problems
      </button>

      <div className="dashboard-header">
        <div>
          <h1>{problem.title}</h1>
          <div className="flex gap-2 items-center mt-2">
            <span className={`badge ${DIFFICULTY_COLORS[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            {problem.tags?.map((tag) => (
              <span key={tag} className="badge badge-info">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="problem-panel" style={{ maxHeight: 'none' }}>
        <h2>Description</h2>
        <div className="description">{problem.description}</div>

        {problem.examples?.map((ex, i) => (
          <div key={i} className="example">
            <strong>Example {i + 1}:</strong>
            <br />
            <strong>Input:</strong> {ex.input}
            <br />
            <strong>Output:</strong> {ex.output}
            {ex.explanation && (
              <>
                <br />
                <strong>Explanation:</strong> {ex.explanation}
              </>
            )}
          </div>
        ))}

        {problem.constraints && (
          <div className="example">
            <strong>Constraints:</strong>
            <br />
            {problem.constraints}
          </div>
        )}
      </div>

      <h3 className="mt-4 mb-3">Choose Your Mode</h3>
      <div className="mode-selection">
        <div
          className="mode-card"
          onClick={() => navigate(`/solo/${problem._id}`)}
        >
          <div className="icon">👤</div>
          <h3>Solo Mode</h3>
          <p>Solve this problem on your own. Run, test, and submit your solution.</p>
        </div>

        <div
          className="mode-card"
          onClick={() => navigate(`/solo/${problem._id}?mode=collab`)}
        >
          <div className="icon">👥</div>
          <h3>Collaborative Mode</h3>
          <p>Create a room and invite friends to solve together in real time.</p>
        </div>
      </div>

      {recentSubmissions.length > 0 && (
        <>
          <h3 className="mt-4 mb-3">Recent Submissions</h3>
          {recentSubmissions.map((s) => (
            <div key={s._id} className="submission-item">
              <div className="submission-info">
                <span className="submission-title">{s.problemTitle}</span>
                <span className="submission-meta">
                  {s.language} • {new Date(s.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <span className={`badge ${
                s.status === 'Accepted' ? 'badge-easy' :
                s.status === 'Compilation Error' ? 'badge-hard' : 'badge-medium'
              }`}>
                {s.status}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
