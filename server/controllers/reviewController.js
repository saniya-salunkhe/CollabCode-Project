const Review = require('../models/Review');
const Room = require('../models/Room');
const Contribution = require('../models/Contribution');

// ── Create a peer review for a room ───────────────────────
exports.createReview = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { codeSnapshot, language, comments } = req.body;

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() }).populate('problem', 'title');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ message: 'At least one review comment is required' });
    }

    const review = await Review.create({
      room: room._id,
      roomCode: room.roomCode,
      problem: room.problem._id,
      problemTitle: room.problem.title,
      codeSnapshot,
      language,
      comments: comments.map((c) => ({
        lineNumber: c.lineNumber,
        codeSnippet: c.codeSnippet || '',
        comment: c.comment,
        type: c.type || 'suggestion',
        status: 'open',
        author: req.user._id,
        authorName: req.user.name,
      })),
    });

    // Update contribution: reviews given
    await Contribution.updateOne(
      { room: room._id, user: req.user._id },
      { $inc: { reviewsGiven: comments.length } }
    );

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all reviews for a room ────────────────────────────
exports.getRoomReviews = async (req, res) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toUpperCase() }).select('_id');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const reviews = await Review.find({ room: room._id })
      .sort({ createdAt: -1 })
      .populate('comments.author', 'name avatarColor')
      .populate('comments.resolvedBy', 'name');

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Resolve / reopen a review comment ────────────────────
exports.toggleCommentStatus = async (req, res) => {
  try {
    const { reviewId, commentId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const comment = review.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.status === 'open') {
      comment.status = 'resolved';
      comment.resolvedAt = new Date();
      comment.resolvedBy = req.user._id;

      // contribution tracking
      await Contribution.updateOne(
        { room: review.room, user: req.user._id },
        { $inc: { reviewsResolved: 1 } }
      );
    } else {
      comment.status = 'open';
      comment.resolvedAt = null;
      comment.resolvedBy = null;
    }

    await review.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Add a comment to an existing review ───────────────────
exports.addComment = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { lineNumber, codeSnippet, comment, type } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.comments.push({
      lineNumber,
      codeSnippet: codeSnippet || '',
      comment,
      type: type || 'suggestion',
      status: 'open',
      author: req.user._id,
      authorName: req.user.name,
    });

    await review.save();

    await Contribution.updateOne(
      { room: review.room, user: req.user._id },
      { $inc: { reviewsGiven: 1 } }
    );

    res.status(201).json(review.comments[review.comments.length - 1]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
