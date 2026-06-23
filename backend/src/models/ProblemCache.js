const mongoose = require('mongoose');

const problemCacheSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProblemCache', problemCacheSchema);
