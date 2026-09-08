const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  expectedOutput: { type: String, default: '' },
  isHidden: { type: Boolean, default: false },
}, { _id: true });

const exampleSchema = new mongoose.Schema({
  input: { type: String, default: '' },
  output: { type: String, default: '' },
  explanation: { type: String, default: '' },
}, { _id: true });

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    tags: [{ type: String }],
    examples: [exampleSchema],
    constraints: { type: String, default: '' },
    testCases: [testCaseSchema],
    timeLimit: { type: Number, default: 2000 },   // ms
    memoryLimit: { type: Number, default: 256 },  // MB
    starterCode: {
      java: { type: String, default: '' },
      c: { type: String, default: '' },
      cpp: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' },
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

problemSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Problem', problemSchema);
