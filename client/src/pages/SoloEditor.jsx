import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { problemService, submissionService, roomService } from '../services';
import { LANGUAGES, DEFAULT_SNIPPETS, DIFFICULTY_COLORS } from '../utils/constants';
import { toast } from '../components/ToastContainer';

export default function SoloEditor() {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const loadProblem = async () => {
    try {
      const { data } = await problemService.getById(problemId);
      setProblem(data);
      const lang = searchParams.get('lang') || 'python';
      setLanguage(lang);
      setCode(data.starterCode?.[lang] || DEFAULT_SNIPPETS[lang] || '');
    } catch (err) {
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (problem?.starterCode?.[lang]) {
      setCode(problem.starterCode[lang]);
    } else {
      setCode(DEFAULT_SNIPPETS[lang] || '');
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput(null);
    setTestResults(null);
    try {
      const { data } = await submissionService.run({ code, language, stdin });
      setOutput(data);
      if (data._simulated) {
        toast.info('Running in simulation mode (no Judge0 backend connected)');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleTest = async () => {
    setRunning(true);
    setOutput(null);
    setTestResults(null);
    try {
      const { data } = await submissionService.test({ code, language, problemId });
      setTestResults(data);
      toast.info(`${data.passed}/${data.total} test cases passed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to test code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setRunning(true);
    setSubmitResult(null);
    try {
      const { data } = await submissionService.submit({ code, language, problemId });
      setSubmitResult(data);
      if (data.allPassed) {
        toast.success(`🎉 Accepted! ${data.testCasesPassed}/${data.totalTestCases} test cases passed`);
      } else {
        toast.error(`${data.status}: ${data.testCasesPassed}/${data.totalTestCases} passed`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setRunning(false);
    }
  };

  // ── Dynamic Collaboration: invite a collaborator from solo mode ──
  const handleInviteCollaborator = async () => {
    try {
      const { data } = await roomService.create({ problemId, language });
      toast.success(`Room created! Share code: ${data.roomCode}`);
      navigate(`/room/${data.roomCode}`);
    } catch (err) {
      toast.error('Failed to create room');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!problem) return <div className="empty-state"><p>Problem not found.</p></div>;

  return (
    <div className="ide-layout">
      {/* Left: Problem description */}
      <div className="ide-left">
        <div className="problem-panel">
          <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h2>{problem.title}</h2>
          <span className={`badge ${DIFFICULTY_COLORS[problem.difficulty]} mb-3`}>
            {problem.difficulty}
          </span>
          <div className="description">{problem.description}</div>

          {problem.examples?.map((ex, i) => (
            <div key={i} className="example">
              <strong>Example {i + 1}:</strong>
              <br />
              <strong>Input:</strong> {ex.input}
              <br />
              <strong>Output:</strong> {ex.output}
              {ex.explanation && (<><br /><strong>Explanation:</strong> {ex.explanation}</>)}
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
      </div>

      {/* Right: Editor + Output */}
      <div className="ide-right">
        <div className="editor-toolbar">
          <div className="editor-toolbar-left">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{ width: 'auto', minWidth: '120px' }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="editor-toolbar-right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowInviteModal(true)}
              title="Invite a friend to solve together"
            >
              👥 Invite Collaborator
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleRun} disabled={running}>
              ▶ Run
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={running}>
              🧪 Test
            </button>
            <button className="btn btn-success btn-sm" onClick={handleSubmit} disabled={running}>
              ✓ Submit
            </button>
          </div>
        </div>

        <div className="editor-container">
          <Editor
            height="100%"
            language={LANGUAGES.find((l) => l.key === language)?.monaco || 'python'}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
            }}
          />
        </div>

        <div className="output-panel">
          <div className="output-header">
            <span>Custom Input</span>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter stdin input here..."
            style={{ width: '100%', minHeight: '60px', marginBottom: '12px' }}
          />

          {running && (
            <div className="flex items-center gap-2 text-secondary">
              <div className="spinner" /> Running...
            </div>
          )}

          {output && (
            <div className="mt-2">
              <div className="output-header">
                <span>Output</span>
                {output.status && (
                  <span className={`badge ${
                    output.status.id === 3 ? 'badge-easy' :
                    output.status.id === 6 ? 'badge-hard' : 'badge-medium'
                  }`}>
                    {output.status.description}
                  </span>
                )}
              </div>
              {output.stdout && <pre>{output.stdout}</pre>}
              {output.stderr && <pre className="text-danger">{output.stderr}</pre>}
              {output.compileOutput && <pre className="text-warning">{output.compileOutput}</pre>}
              {output.time && <div className="text-muted text-sm mt-1">Time: {output.time}s | Memory: {output.memory} KB</div>}
            </div>
          )}

          {testResults && (
            <div className="mt-2">
              <div className="output-header">
                <span>Test Results ({testResults.passed}/{testResults.total} passed)</span>
              </div>
              {testResults.results?.map((r, i) => (
                <div key={i} className={`test-result ${r.passed ? 'pass' : 'fail'}`}>
                  {r.passed ? '✓' : '✗'} Test Case {i + 1}
                  {!r.passed && (
                    <div className="text-sm mt-1" style={{ marginLeft: 16 }}>
                      <div>Expected: {r.expectedOutput}</div>
                      <div>Got: {r.actualOutput}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {submitResult && (
            <div className="mt-2">
              <div className={`test-result ${submitResult.allPassed ? 'pass' : 'fail'}`}>
                {submitResult.allPassed ? '🎉' : '❌'} {submitResult.status}
                <div className="text-sm" style={{ marginLeft: 16 }}>
                  {submitResult.testCasesPassed} / {submitResult.totalTestCases} test cases passed
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Collaborator Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Invite a Collaborator</h3>
            <p className="text-secondary text-sm mb-3">
              Start a collaborative room from your current solution. A room code will be generated
              that you can share with your friends to solve this problem together in real time.
            </p>
            <div className="example">
              <strong>Your current code will be carried over to the room.</strong>
              <br />
              You and your collaborator will be able to edit code together, chat,
              review each other's changes, and track contributions.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleInviteCollaborator}>
                Create Room & Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
