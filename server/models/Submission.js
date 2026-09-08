const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    problemTitle: { type: String, required: true },
    // If submitted from a room, link it
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    isCollaborative: { type: Boolean, default: false },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded',
             'Runtime Error', 'Compilation Error', 'Internal Error'],
      default: 'Pending',
    },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    executionTime: { type: Number, default: 0 },  // ms
    executionMemory: { type: Number, default: 0 }, // KB
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    compileOutput: { type: String, default: '' },
  },
  { timestamps: true }
);

submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
