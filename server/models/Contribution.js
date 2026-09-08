// Tracks per-room, per-user contribution metrics for the
// Contribution Analytics module.
const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    roomCode: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
    // raw counts tracked live over the life of the room
    charactersAdded: { type: Number, default: 0 },
    charactersDeleted: { type: Number, default: 0 },
    linesEdited: { type: Number, default: 0 },
    codeSaves: { type: Number, default: 0 },       // version snapshots saved
    chatMessages: { type: Number, default: 0 },
    reviewsGiven: { type: Number, default: 0 },
    reviewsResolved: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    // session duration tracking
    activeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

contributionSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Contribution', contributionSchema);
