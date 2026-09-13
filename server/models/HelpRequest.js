const mongoose = require('mongoose');


// ============================================================
// HELP RESOLUTION SCHEMA
// ============================================================

const resolutionSchema = new mongoose.Schema(
  {
    // Code before helper started
    oldCode: {
      type: String,
      required: true,
    },

    // Final corrected code
    newCode: {
      type: String,
      required: true,
    },

    // Example:
    // "Wrong Answer", "Runtime Error", "Logic Error"
    issueType: {
      type: String,
      default: 'Logic Error',
    },

    // What exactly was wrong?
    problemFound: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Example: "Line 28"
    incorrectLocation: {
      type: String,
      default: '',
      maxlength: 200,
    },

    // Why was the original logic wrong?
    whyWrong: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // What did helper change?
    changesMade: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Explain corrected logic
    solutionExplanation: {
      type: String,
      required: true,
      maxlength: 1500,
    },

    // Test information
    testResult: {
      passed: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        default: 0,
      },

      allPassed: {
        type: Boolean,
        default: false,
      },
    },

    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    solvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);


// ============================================================
// HELP REQUEST SCHEMA
// ============================================================

const helpRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },

    language: {
      type: String,
      required: true,
    },

    // Code when requester asks for help
    currentCode: {
      type: String,
      required: true,
    },

    // Requester's own explanation
    message: {
      type: String,
      default:
        'I am stuck and need some help.',
      maxlength: 250,
    },

    status: {
      type: String,

      enum: [
        'open',
        'accepted',
        'solution_sent',
        'resolved',
        'cancelled',
        'closed',
      ],

      default: 'open',
    },

    helper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },

    // Can keep multiple attempts if requester asks again
    resolutions: [
      resolutionSchema
    ],
  },
  {
    timestamps: true,
  }
);


module.exports =
  mongoose.model(
    'HelpRequest',
    helpRequestSchema
  );