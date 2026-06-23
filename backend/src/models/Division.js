const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

divisionSchema.index({ classroomId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Division', divisionSchema);
