const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    isSuperAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    legacyInstructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
