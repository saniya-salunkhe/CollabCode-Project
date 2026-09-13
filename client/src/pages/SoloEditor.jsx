import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

import {
  problemService,
  submissionService,
  roomService,
  helpRequestService,
} from '../services';

import {
  LANGUAGES,
  DEFAULT_SNIPPETS,
  DIFFICULTY_COLORS,
} from '../utils/constants';

import { toast } from '../components/ToastContainer';
import InviteCollaboratorModal
  from '../components/InviteCollaboratorModal';

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

  // Invite Collaborator modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Request Help
  const [requestingHelp, setRequestingHelp] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');

  // ============================================================
  // LOAD PROBLEM
  // ============================================================

  const loadProblem = async () => {
    try {
      const { data } = await problemService.getById(problemId);

      setProblem(data);

      const lang = searchParams.get('lang') || 'python';

      setLanguage(lang);

      setCode(
        data.starterCode?.[lang] ||
          DEFAULT_SNIPPETS[lang] ||
          ''
      );
    } catch (err) {
      console.error('Failed to load problem:', err);

      toast.error(
        err.response?.data?.message ||
          'Failed to load problem'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  // ============================================================
  // LANGUAGE CHANGE
  // ============================================================

  const handleLanguageChange = (lang) => {
    setLanguage(lang);

    if (problem?.starterCode?.[lang]) {
      setCode(problem.starterCode[lang]);
    } else {
      setCode(DEFAULT_SNIPPETS[lang] || '');
    }

    setOutput(null);
    setTestResults(null);
    setSubmitResult(null);
  };

  // ============================================================
  // RUN CODE
  // ============================================================

  const handleRun = async () => {
    try {
      setRunning(true);

      setOutput(null);
      setTestResults(null);
      setSubmitResult(null);

      const { data } = await submissionService.run({
        code,
        language,
        stdin,
      });

      setOutput(data);

      if (data._simulated) {
        toast.info(
          'Running in simulation mode (no Judge0 backend connected)'
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to run code'
      );
    } finally {
      setRunning(false);
    }
  };

  // ============================================================
  // TEST CODE
  // ============================================================

  const handleTest = async () => {
    try {
      setRunning(true);

      setOutput(null);
      setTestResults(null);
      setSubmitResult(null);

      const { data } = await submissionService.test({
        code,
        language,
        problemId,
      });

      setTestResults(data);

      toast.info(
        `${data.passed}/${data.total} test cases passed`
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to test code'
      );
    } finally {
      setRunning(false);
    }
  };

  // ============================================================
  // SUBMIT CODE
  // ============================================================

  const handleSubmit = async () => {
    try {
      setRunning(true);

      setSubmitResult(null);

      const { data } = await submissionService.submit({
        code,
        language,
        problemId,
      });

      setSubmitResult(data);

      if (data.allPassed) {
        toast.success(
          `🎉 Accepted! ${data.testCasesPassed}/${data.totalTestCases} test cases passed`
        );
      } else {
        toast.error(
          `${data.status}: ${data.testCasesPassed}/${data.totalTestCases} passed`
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to submit'
      );
    } finally {
      setRunning(false);
    }
  };

  // ============================================================
  // REQUEST HELP
  // ============================================================

  const handleRequestHelp = async () => {
    try {
      if (!problem?._id) {
        toast.error('Problem information is missing');
        return;
      }

      if (!code.trim()) {
        toast.error(
          'Write some code before requesting help'
        );
        return;
      }

      if (!helpMessage.trim()) {
        toast.error(
          'Please explain what you need help with'
        );
        return;
      }

      setRequestingHelp(true);

      await helpRequestService.create({
        problemId: problem._id,
        language,
        currentCode: code,

        // User's custom help message
        message: helpMessage.trim(),
      });

      toast.success(
        '🆘 Help request sent! Other students can now see your request.'
      );

      // Close modal after successful request
      setShowHelpModal(false);

      // Clear old message
      setHelpMessage('');
    } catch (err) {
      console.error(
        'Request help error:',
        err
      );

      toast.error(
        err.response?.data?.message ||
          'Failed to request help'
      );
    } finally {
      setRequestingHelp(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="empty-state">
        <p>Problem not found.</p>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="ide-layout">

      {/* ===================================================== */}
      {/* LEFT SIDE - PROBLEM DESCRIPTION */}
      {/* ===================================================== */}

      <div className="ide-left">
        <div className="problem-panel">

          <button
            className="btn btn-ghost btn-sm mb-3"
            onClick={() => navigate('/dashboard')}
          >
            ← Back
          </button>

          <h2>{problem.title}</h2>

          <span
            className={`badge ${
              DIFFICULTY_COLORS[
                problem.difficulty
              ] || ''
            } mb-3`}
          >
            {problem.difficulty}
          </span>

          <div className="description">
            {problem.description}
          </div>

          {/* Examples */}

          {problem.examples?.map(
            (example, index) => (
              <div
                key={index}
                className="example"
              >
                <strong>
                  Example {index + 1}:
                </strong>

                <br />

                <strong>Input:</strong>{' '}
                {example.input}

                <br />

                <strong>Output:</strong>{' '}
                {example.output}

                {example.explanation && (
                  <>
                    <br />

                    <strong>
                      Explanation:
                    </strong>{' '}
                    {example.explanation}
                  </>
                )}
              </div>
            )
          )}

          {/* Constraints */}

          {problem.constraints && (
            <div className="example">

              <strong>
                Constraints:
              </strong>

              <br />

              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                }}
              >
                {problem.constraints}
              </pre>

            </div>
          )}

        </div>
      </div>

      {/* ===================================================== */}
      {/* RIGHT SIDE - EDITOR */}
      {/* ===================================================== */}

      <div className="ide-right">

        {/* =================================================== */}
        {/* EDITOR TOOLBAR */}
        {/* =================================================== */}

        <div className="editor-toolbar">

          <div className="editor-toolbar-left">

            <select
              value={language}
              onChange={(e) =>
                handleLanguageChange(
                  e.target.value
                )
              }
              style={{
                width: 'auto',
                minWidth: '120px',
              }}
            >
              {LANGUAGES.map(
                (lang) => (
                  <option
                    key={lang.key}
                    value={lang.key}
                  >
                    {lang.label}
                  </option>
                )
              )}
            </select>

          </div>

          <div className="editor-toolbar-right">

            {/* Invite Collaborator */}

            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setShowInviteModal(true)
              }
              title="Invite a friend to solve together"
            >
              👥 Invite Collaborator
            </button>

            {/* Request Help */}

            <button
              className="btn btn-warning btn-sm"
              onClick={() =>
                setShowHelpModal(true)
              }
              disabled={
                requestingHelp ||
                running
              }
              title="Ask another student for help"
            >
              🆘 Request Help
            </button>

            {/* Run */}

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRun}
              disabled={running}
            >
              ▶ Run
            </button>

            {/* Test */}

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleTest}
              disabled={running}
            >
              🧪 Test
            </button>

            {/* Submit */}

            <button
              className="btn btn-success btn-sm"
              onClick={handleSubmit}
              disabled={running}
            >
              ✓ Submit
            </button>

          </div>
        </div>

        {/* =================================================== */}
        {/* MONACO EDITOR */}
        {/* =================================================== */}

        <div className="editor-container">

          <Editor
            height="100%"
            language={
              LANGUAGES.find(
                (lang) =>
                  lang.key === language
              )?.monaco || 'python'
            }
            theme="vs-dark"
            value={code}
            onChange={(value) =>
              setCode(value || '')
            }
            options={{
              fontSize: 14,

              minimap: {
                enabled: false,
              },

              scrollBeyondLastLine:
                false,

              automaticLayout: true,

              tabSize: 4,

              wordWrap: 'on',
            }}
          />

        </div>

        {/* =================================================== */}
        {/* OUTPUT PANEL */}
        {/* =================================================== */}

        <div className="output-panel">

          <div className="output-header">
            <span>Custom Input</span>
          </div>

          <textarea
            value={stdin}
            onChange={(e) =>
              setStdin(e.target.value)
            }
            placeholder="Enter stdin input here..."
            style={{
              width: '100%',
              minHeight: '60px',
              marginBottom: '12px',
            }}
          />

          {/* Running */}

          {running && (
            <div className="flex items-center gap-2 text-secondary">

              <div className="spinner" />

              Running...

            </div>
          )}

          {/* Output */}

          {output && (
            <div className="mt-2">

              <div className="output-header">

                <span>Output</span>

                {output.status && (
                  <span
                    className={`badge ${
                      output.status.id === 3
                        ? 'badge-easy'
                        : output.status.id === 6
                        ? 'badge-hard'
                        : 'badge-medium'
                    }`}
                  >
                    {
                      output.status
                        .description
                    }
                  </span>
                )}

              </div>

              {output.stdout && (
                <pre>
                  {output.stdout}
                </pre>
              )}

              {output.stderr && (
                <pre className="text-danger">
                  {output.stderr}
                </pre>
              )}

              {output.compileOutput && (
                <pre className="text-warning">
                  {
                    output.compileOutput
                  }
                </pre>
              )}

              {output.message && (
                <pre className="text-warning">
                  {output.message}
                </pre>
              )}

              {output.time && (
                <div className="text-muted text-sm mt-1">

                  Time: {output.time}s

                  {output.memory && (
                    <>
                      {' '}
                      | Memory:{' '}
                      {output.memory} KB
                    </>
                  )}

                </div>
              )}

            </div>
          )}

          {/* ================================================= */}
          {/* TEST RESULTS */}
          {/* ================================================= */}

          {testResults && (
            <div className="mt-2">

              <div className="output-header">

                <span>
                  Test Results (
                  {testResults.passed}/
                  {testResults.total}{' '}
                  passed)
                </span>

              </div>

              {testResults.results?.map(
                (result, index) => (
                  <div
                    key={index}
                    className={`test-result ${
                      result.passed
                        ? 'pass'
                        : 'fail'
                    }`}
                  >

                    {result.passed
                      ? '✓'
                      : '✗'}{' '}

                    Test Case{' '}
                    {index + 1}

                    {!result.passed && (
                      <div
                        className="text-sm mt-1"
                        style={{
                          marginLeft: 16,
                        }}
                      >

                        <div>
                          Expected:{' '}
                          {
                            result.expectedOutput
                          }
                        </div>

                        <div>
                          Got:{' '}
                          {
                            result.actualOutput
                          }
                        </div>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

          {/* ================================================= */}
          {/* SUBMISSION RESULT */}
          {/* ================================================= */}

          {submitResult && (
            <div className="mt-2">

              <div
                className={`test-result ${
                  submitResult.allPassed
                    ? 'pass'
                    : 'fail'
                }`}
              >

                {submitResult.allPassed
                  ? '🎉'
                  : '❌'}{' '}

                {submitResult.status}

                <div
                  className="text-sm"
                  style={{
                    marginLeft: 16,
                  }}
                >
                  {
                    submitResult.testCasesPassed
                  }{' '}
                  /{' '}
                  {
                    submitResult.totalTestCases
                  }{' '}
                  test cases passed
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ===================================================== */}
      {/* INVITE COLLABORATOR MODAL */}
      {/* ===================================================== */}

      <InviteCollaboratorModal
        open={
          showInviteModal
        }

        onClose={() =>
          setShowInviteModal(
            false
          )
        }

        problem={
          problem
        }

        problemId={
          problemId
        }

        language={
          language
        }

        code={
          code
        }
      />

      {/* ===================================================== */}
      {/* REQUEST HELP MODAL */}
      {/* ===================================================== */}

      {showHelpModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!requestingHelp) {
              setShowHelpModal(false);
            }
          }}
        >
          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3>
              🆘 Request Help
            </h3>

            <p className="text-secondary text-sm mb-3">
              Explain exactly what you are stuck on so another
              student knows how to help you.
            </p>

            {/* Problem information */}

            <div className="example">

              <strong>
                Problem:
              </strong>{' '}
              {problem.title}

              <br />

              <strong>
                Difficulty:
              </strong>{' '}
              {problem.difficulty}

              <br />

              <strong>
                Language:
              </strong>{' '}

              {
                LANGUAGES.find(
                  (lang) =>
                    lang.key === language
                )?.label || language
              }

            </div>

            {/* Help message */}

            <div className="mt-3">

              <label className="text-sm">
                <strong>
                  What do you need help with?
                </strong>
              </label>

              <textarea
                value={helpMessage}
                onChange={(e) =>
                  setHelpMessage(
                    e.target.value
                  )
                }
                placeholder="Example: My code is running, but I don't understand how to reverse the string using O(1) extra space..."
                maxLength={250}
                disabled={requestingHelp}
                style={{
                  width: '100%',
                  minHeight: '110px',
                  marginTop: '8px',
                  resize: 'vertical',
                }}
              />

              <div
                className="text-muted text-sm"
                style={{
                  textAlign: 'right',
                  marginTop: '4px',
                }}
              >
                {helpMessage.length}/250
              </div>

            </div>

            {/* Helpful examples */}

            <div
              className="example"
              style={{
                marginTop: '12px',
              }}
            >
              <strong>
                Examples of useful requests:
              </strong>

              <br />

              • I don't understand the required algorithm.

              <br />

              • My code gives the wrong output for one test case.

              <br />

              • I don't understand how to reduce the time complexity.

              <br />

              • I am getting a runtime error.

            </div>

            {/* Buttons */}

            <div className="modal-actions">

              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowHelpModal(false);
                  setHelpMessage('');
                }}
                disabled={requestingHelp}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={
                  handleRequestHelp
                }
                disabled={
                  requestingHelp ||
                  !helpMessage.trim()
                }
              >
                {requestingHelp
                  ? 'Sending...'
                  : '🆘 Send Help Request'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}