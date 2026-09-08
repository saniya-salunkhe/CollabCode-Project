const Submission = require('../models/Submission');
const Room = require('../models/Room');
const Contribution = require('../models/Contribution');
const Problem = require('../models/Problem');
const { judge0Service } = require('../services/judge0Service');
const { LANG_IDS } = require('../config/constants');

// ── Run code (single test case, no persistence) ───────────
exports.runCode = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    const langId = LANG_IDS[language];
    if (!langId) {
      return res.status(400).json({ message: `Unsupported language: ${language}` });
    }

    const result = await judge0Service.run({
      sourceCode: code,
      languageId: langId,
      stdin: stdin || '',
    });

    res.json(result);
  } catch (err) {
    console.error('Run code error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Test code against visible test cases (no persistence) ─
exports.testCode = async (req, res) => {
  try {
    const { code, language, problemId } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const langId = LANG_IDS[language];
    if (!langId) {
      return res.status(400).json({ message: `Unsupported language: ${language}` });
    }

    // Run against visible (non-hidden) test cases
    const visibleCases = problem.testCases.filter((tc) => !tc.isHidden);

    const results = [];
    for (const tc of visibleCases) {
      const result = await judge0Service.run({
        sourceCode: code,
        languageId: langId,
        stdin: tc.input,
      });

      const actual = (result.stdout || '').trim();
      const expected = (tc.expectedOutput || '').trim();
      const passed = actual === expected;

      results.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout || '',
        passed,
        status: result.status,
        time: result.time,
        memory: result.memory,
        stderr: result.stderr,
        compileOutput: result.compileOutput,
      });
    }

    res.json({
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      results,
    });
  } catch (err) {
    console.error('Test code error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Submit code — runs against ALL test cases and persists ─
exports.submitCode = async (req, res) => {
  try {
    const { code, language, problemId, roomCode } = req.body;

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const langId = LANG_IDS[language];
    if (!langId) {
      return res.status(400).json({ message: `Unsupported language: ${language}` });
    }

    // Run against ALL test cases (visible + hidden)
    const allCases = problem.testCases;
    const results = [];
    for (const tc of allCases) {
      const result = await judge0Service.run({
        sourceCode: code,
        languageId: langId,
        stdin: tc.input,
      });

      const actual = (result.stdout || '').trim();
      const expected = (tc.expectedOutput || '').trim();
      const passed = actual === expected;

      results.push({ passed, status: result.status });

      // If there's a compile error, stop early
      if (result.status && result.status.id === 6) {
        break;
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const allPassed = passedCount === allCases.length;

    // Determine final status
    let finalStatus;
    if (allPassed) {
      finalStatus = 'Accepted';
    } else {
      const firstFail = results.find((r) => !r.passed);
      if (firstFail && firstFail.status) {
        const statusId = firstFail.status.id;
        if (statusId === 6) finalStatus = 'Compilation Error';
        else if (statusId === 5) finalStatus = 'Time Limit Exceeded';
        else if (statusId === 4) finalStatus = 'Wrong Answer';
        else if ([7, 8, 9, 10, 11, 12].includes(statusId)) finalStatus = 'Runtime Error';
        else finalStatus = 'Wrong Answer';
      } else {
        finalStatus = 'Wrong Answer';
      }
    }

    // Save submission
    let room = null;
    let isCollaborative = false;
    if (roomCode) {
      room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
      isCollaborative = !!room;
    }

    const submission = await Submission.create({
      user: req.user._id,
      userName: req.user.name,
      problem: problem._id,
      problemTitle: problem.title,
      room: room ? room._id : null,
      isCollaborative,
      code,
      language,
      status: finalStatus,
      testCasesPassed: passedCount,
      totalTestCases: allCases.length,
    });

    // Update contribution if in a room
    if (room) {
      await Contribution.updateOne(
        { room: room._id, user: req.user._id },
        {
          $inc: {
            submissions: 1,
            acceptedSubmissions: allPassed ? 1 : 0,
          },
        }
      );
    }

    // Update user stats
    const User = require('../models/User');
    const userUpdate = { $inc: { totalSubmissions: 1 } };
    if (allPassed) userUpdate.$inc.problemsSolved = 1;
    if (isCollaborative) userUpdate.$inc.collaborations = 1;
    await User.updateOne({ _id: req.user._id }, userUpdate);

    res.json({
      submissionId: submission._id,
      status: finalStatus,
      testCasesPassed: passedCount,
      totalTestCases: allCases.length,
      allPassed,
    });
  } catch (err) {
    console.error('Submit code error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Get submission history for a user ──────────────────────
exports.getMySubmissions = async (req, res) => {
  try {
    const { problemId } = req.query;

    const query = { user: req.user._id };
    if (problemId) query.problem = problemId;

    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .select('problemTitle language status testCasesPassed totalTestCases isCollaborative createdAt');

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get a single submission ────────────────────────────────
exports.getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Only the owner can see their full code
    if (submission.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
