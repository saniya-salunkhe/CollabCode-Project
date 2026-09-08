const express = require('express');
const { createReview, getRoomReviews, toggleCommentStatus, addComment } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/:roomCode', createReview);
router.get('/:roomCode', getRoomReviews);
router.post('/:reviewId/comments', addComment);
router.patch('/:reviewId/comments/:commentId', toggleCommentStatus);

module.exports = router;
