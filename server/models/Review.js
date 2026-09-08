const mongoose = require('mongoose');

const reviewCommentSchema = new mongoose.Schema(
  {
    // line number in the code the comment refers to (1-based)
    lineNumber: { type: Number, required: true },
    codeSnippet: { type: String, default: '' },
    comment: { type: String, required: true },
    type: {
      type: String,
      enum: ['suggestion', 'bug', 'question', 'praise'],
      default: 'suggestion',
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    roomCode: { type: String, required: true },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    problemTitle: { type: String, required: true },
    // the code snapshot that was reviewed
    codeSnapshot: { type: String, required: true },
    language: { type: String, required: true },
    comments: [reviewCommentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
