const mongoose = require('mongoose');

const orgUnitSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit', default: null },
    type: { type: String, enum: ['root', 'faculty', 'department'], required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    settings: {
      instructorVisibility: {
        type: String,
        enum: ['own', 'unit_shared'],
        default: 'own',
      },
    },
  },
  { timestamps: true }
);

orgUnitSchema.index({ orgId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('OrgUnit', orgUnitSchema);
