const express = require('express');
const { runCode, testCode, submitCode, getMySubmissions, getSubmission } = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/run', runCode);
router.post('/test', testCode);
router.post('/submit', submitCode);
router.get('/', getMySubmissions);
router.get('/:id', getSubmission);

module.exports = router;
