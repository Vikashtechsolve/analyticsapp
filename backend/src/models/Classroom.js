const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    orgUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgUnit' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: true },
    joinCode: { type: String, default: '' },
    settings: {
      syncIntervalHours: { type: Number, default: 6 },
      showContestTab: { type: Boolean, default: true },
    },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

classroomSchema.virtual('shareUrl').get(function () {
  return `/c/${this.slug}`;
});

classroomSchema.set('toJSON', { virtuals: true });
classroomSchema.set('toObject', { virtuals: true });

classroomSchema.index({ orgId: 1, slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Classroom', classroomSchema);
