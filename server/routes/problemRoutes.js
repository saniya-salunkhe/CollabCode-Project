const express = require('express');
const { getProblems, getProblemBySlug, getProblemById, createProblem } = require('../controllers/problemController');

const router = express.Router();

router.get('/', getProblems);
router.get('/slug/:slug', getProblemBySlug);
router.get('/:id', getProblemById);
router.post('/', createProblem); // for seeding / admin

module.exports = router;
