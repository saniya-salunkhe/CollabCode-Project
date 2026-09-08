const mongoose = require('mongoose');

// A code snapshot — used for version history (both solo and collaborative)
const codeVersionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    language: { type: String, required: true },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    savedByName: { type: String, default: 'Unknown' },
    label: { type: String, default: '' },   // optional name e.g. "Fixed edge case"
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// A chat message inside a room
const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    // The student who created the room
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Members currently / historically in the room
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
      },
    ],
    // current shared code
    currentCode: { type: String, default: '' },
    currentLanguage: { type: String, default: 'python' },
    // saved versions / snapshots
    versions: [codeVersionSchema],
    // chat log
    chat: [chatMessageSchema],
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Generate a 6-character room code like CC7421
roomSchema.statics.generateRoomCode = function () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

module.exports = mongoose.model('Room', roomSchema);
