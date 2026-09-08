const Problem = require('../models/Problem');

// ── Get all problems ──────────────────────────────────────
exports.getProblems = async (req, res) => {
  try {
    const { difficulty, tag, search } = req.query;
    const query = { isPublished: true };

    if (difficulty) query.difficulty = difficulty;
    if (tag) query.tags = { $in: [tag] };
    if (search) query.title = { $regex: search, $options: 'i' };

    const problems = await Problem.find(query)
      .select('-testCases')            // do not leak hidden test cases
      .sort({ createdAt: 1 });

    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single problem by slug ───────────────────────────
exports.getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).select('-testCases.isHidden');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single problem by id ──────────────────────────────
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Create problem (admin / seeding) ──────────────────────
exports.createProblem = async (req, res) => {
  try {
    const problem = await Problem.create(req.body);
    res.status(201).json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get test cases for a problem (visible + hidden) ──────
// Used internally by the submission flow — not exposed to the
// client list endpoint to prevent leaking hidden cases.
exports.getTestCases = async (problemId) => {
  const problem = await Problem.findById(problemId).select('testCases');
  return problem ? problem.testCases : [];
};
