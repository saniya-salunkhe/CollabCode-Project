import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { roomService, submissionService, reviewService } from '../services';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { LANGUAGES, DEFAULT_SNIPPETS, DIFFICULTY_COLORS, getInitials, formatTime } from '../utils/constants';
import { toast } from '../components/ToastContainer';
import ChatPanel from '../components/ChatPanel';
import VersionHistory from '../components/VersionHistory';
import ReviewPanel from '../components/ReviewPanel';
import ContributionPanel from '../components/ContributionPanel';

export default function Room() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [versions, setVersions] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);

  const codeRef = useRef('');
  const lastSentCode = useRef('');
  const contributionBuffer = useRef({ added: 0, deleted: 0 });
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);

  // ── Load room ──────────────────────────────────────────
  useEffect(() => {
    loadRoom();
    return () => {
      disconnectSocket();
    };
  }, [roomCode]);

  const loadRoom = async () => {
    try {
      const { data } = await roomService.get(roomCode);
      setRoom(data);
      setCode(data.currentCode);
      setLanguage(data.currentLanguage);
      setChatMessages(data.chat || []);
      setVersions(data.versions || []);

      // Connect socket
      const token = localStorage.getItem('collabcode_token');
      const socket = connectSocket(token);
      socketRef.current = socket;

      socket.emit('room:join', { roomCode });

      socket.on('code:sync', ({ code: syncedCode, language: lang }) => {
        if (syncedCode) {
          setCode(syncedCode);
          codeRef.current = syncedCode;
          lastSentCode.current = syncedCode;
        }
        if (lang) setLanguage(lang);
      });

      socket.on('code:update', ({ code: newCode, language: lang }) => {
        setCode(newCode);
        codeRef.current = newCode;
        lastSentCode.current = newCode;
        if (lang) setLanguage(lang);
      });

      socket.on('code:language', ({ language: lang }) => {
        setLanguage(lang);
      });

      socket.on('user:joined', ({ name }) => {
        toast.info(`${name} joined the room`);
      });

      socket.on('user:left', ({ name }) => {
        toast.info(`${name} left the room`);
      });

      socket.on('room:users', (users) => {
        setOnlineUsers(users);
      });

      socket.on('chat:message', (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socket.on('typing:start', ({ name }) => {
        setTypingUsers((prev) => prev.includes(name) ? prev : [...prev, name]);
      });

      socket.on('typing:stop', ({ name }) => {
        setTypingUsers((prev) => prev.filter((n) => n !== name));
      });

      socket.on('version:saved', (version) => {
        setVersions((prev) => [version, ...prev]);
        toast.success(`Version saved by ${version.savedByName}`);
      });

      socket.on('cursor:update', (data) => {
        // Could render remote cursor decorations here
      });
    } catch (err) {
      toast.error('Failed to load room');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Code change handler (debounced broadcast) ──────────
  const handleCodeChange = useCallback((value) => {
    const newCode = value || '';
    const oldCode = codeRef.current;

    // Track contribution delta
    const added = Math.max(0, newCode.length - oldCode.length);
    const deleted = Math.max(0, oldCode.length - newCode.length);
    contributionBuffer.current.added += added;
    contributionBuffer.current.deleted += deleted;

    setCode(newCode);
    codeRef.current = newCode;

    // Broadcast to other users (debounced)
    const socket = socketRef.current;
    if (socket) {
      socket.emit('code:edit', { roomCode, code: newCode, language });
      lastSentCode.current = newCode;

      // Send typing indicator
      socket.emit('typing:start', { roomCode });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('typing:stop', { roomCode });
      }, 1500);
    }
  }, [roomCode, language]);

  // ── Flush contribution buffer periodically ──────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const buf = contributionBuffer.current;
      if (buf.added > 0 || buf.deleted > 0) {
        const socket = socketRef.current;
        if (socket) {
          socket.emit('contribution:update', {
            roomCode,
            added: buf.added,
            deleted: buf.deleted,
            linesEdited: 0,
          });
        }
        contributionBuffer.current = { added: 0, deleted: 0 };
      }
    }, 5000); // every 5 seconds
    return () => clearInterval(interval);
  }, [roomCode]);

  // ── Language change ─────────────────────────────────────
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const socket = socketRef.current;
    if (socket) {
      socket.emit('code:language', { roomCode, language: lang });
    }
  };

  // ── Run code ────────────────────────────────────────────
  const handleRun = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const { data } = await submissionService.run({ code, language, stdin });
      setOutput(data);
    } catch (err) {
      toast.error('Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  // ── Test code ───────────────────────────────────────────
  const handleTest = async () => {
    setRunning(true);
    try {
      const { data } = await submissionService.test({ code, language, problemId: room.problem?._id || room.problem });
      setOutput({ testResults: data });
      toast.info(`${data.passed}/${data.total} test cases passed`);
    } catch (err) {
      toast.error('Failed to test code');
    } finally {
      setRunning(false);
    }
  };

  // ── Submit code ─────────────────────────────────────────
  const handleSubmit = async () => {
    setRunning(true);
    try {
      const { data } = await submissionService.submit({
        code,
        language,
        problemId: room.problem?._id || room.problem,
        roomCode,
      });
      setOutput({ submitResult: data });
      if (data.allPassed) {
        toast.success(`🎉 Accepted! ${data.testCasesPassed}/${data.totalTestCases} passed`);
      } else {
        toast.error(`${data.status}: ${data.testCasesPassed}/${data.totalTestCases} passed`);
      }
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setRunning(false);
    }
  };

  // ── Save version ───────────────────────────────────────
  const handleSaveVersion = () => {
    const label = window.prompt('Label for this version (optional):', '');
    if (label === null) return;
    const socket = socketRef.current;
    if (socket) {
      socket.emit('code:saveVersion', { roomCode, code, language, label });
    }
  };

  // ── Send chat message via socket ────────────────────────
  const handleSendMessage = (text) => {
    const socket = socketRef.current;
    if (socket && text.trim()) {
      socket.emit('chat:message', { roomCode, text });
    }
  };

  // ── Copy room code ──────────────────────────────────────
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!room) return <div className="empty-state"><p>Room not found.</p></div>;

  const problem = room.problem || {};

  return (
    <div className="room-layout">
      {/* Room Header */}
      <div className="room-header">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Exit
          </button>
          <div>
            <div className="flex items-center gap-2">
              <strong>{problem.title || 'Problem'}</strong>
              {problem.difficulty && (
                <span className={`badge ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="room-code-display">
          <span className="text-secondary text-sm">Room Code:</span>
          <span className="code">{roomCode}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleCopyCode}>📋 Copy</button>
        </div>

        <div className="online-users">
          {onlineUsers.map((u) => (
            <div key={u.userId} className="online-user" title={u.name}>
              <div className="avatar" style={{ background: u.color, width: 28, height: 28, fontSize: 11 }}>
                {getInitials(u.name)}
              </div>
            </div>
          ))}
          <span className="text-muted text-sm">{onlineUsers.length} online</span>
        </div>
      </div>

      {/* Main editor area */}
      <div className="room-main">
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
            <button className="btn btn-ghost btn-sm" onClick={handleSaveVersion}>
              💾 Save Version
            </button>
          </div>
          <div className="editor-toolbar-right">
            <button className="btn btn-secondary btn-sm" onClick={handleRun} disabled={running}>▶ Run</button>
            <button className="btn btn-secondary btn-sm" onClick={handleTest} disabled={running}>🧪 Test</button>
            <button className="btn btn-success btn-sm" onClick={handleSubmit} disabled={running}>✓ Submit</button>
          </div>
        </div>

        <div className="editor-container">
          <Editor
            height="100%"
            language={LANGUAGES.find((l) => l.key === language)?.monaco || 'python'}
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
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
            placeholder="Enter stdin..."
            style={{ width: '100%', minHeight: '40px', marginBottom: '8px' }}
          />

          {running && (
            <div className="flex items-center gap-2 text-secondary">
              <div className="spinner" /> Running...
            </div>
          )}

          {output?.stdout !== undefined && (
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
            </div>
          )}

          {output?.testResults && (
            <div className="mt-2">
              <div className="output-header">
                <span>Test Results ({output.testResults.passed}/{output.testResults.total})</span>
              </div>
              {output.testResults.results?.map((r, i) => (
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

          {output?.submitResult && (
            <div className="mt-2">
              <div className={`test-result ${output.submitResult.allPassed ? 'pass' : 'fail'}`}>
                {output.submitResult.allPassed ? '🎉' : '❌'} {output.submitResult.status}
                <div className="text-sm" style={{ marginLeft: 16 }}>
                  {output.submitResult.testCasesPassed} / {output.submitResult.totalTestCases} passed
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar with tabs */}
      <div className="room-sidebar">
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            History
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review
          </button>
          <button
            className={`sidebar-tab ${activeTab === 'contributions' ? 'active' : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            Stats
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === 'chat' && (
            <ChatPanel
              messages={chatMessages}
              onSend={handleSendMessage}
              typingUsers={typingUsers}
            />
          )}
          {activeTab === 'versions' && (
            <VersionHistory
              versions={versions}
              roomCode={roomCode}
              onRestore={(v) => {
                setCode(v.code);
                setLanguage(v.language);
                codeRef.current = v.code;
                toast.success('Version restored');
              }}
            />
          )}
          {activeTab === 'review' && (
            <ReviewPanel
              roomCode={roomCode}
              code={code}
              language={language}
            />
          )}
          {activeTab === 'contributions' && (
            <ContributionPanel roomCode={roomCode} />
          )}
        </div>
      </div>
    </div>
  );
}
