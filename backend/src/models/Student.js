const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    divisionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
    displayName: { type: String, required: true, trim: true },
    leetcodeUsername: { type: String, required: true, lowercase: true, trim: true },
    institute: { type: String, trim: true, default: '' },
    academicDepartment: { type: String, trim: true, default: '' },
    graduationYear: { type: Number },
    enrollmentNumber: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' },
    source: { type: String, enum: ['instructor', 'self'], default: 'instructor' },
    solvedSlugs: [{ type: String }],
    problemProgress: [
      {
        slug: { type: String },
        title: { type: String },
        difficulty: { type: String },
        tags: [{ type: String }],
        firstSolvedAt: { type: Date },
        lastSolvedAt: { type: Date },
        solveCount: { type: Number, default: 1 },
      },
    ],
    dailySolveLog: [
      {
        date: { type: String },
        slug: { type: String },
        title: { type: String },
        difficulty: { type: String },
        tags: [{ type: String }],
        solvedAt: { type: Date },
      },
    ],
    latestSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentSnapshot' },
  },
  { timestamps: true }
);

studentSchema.index({ classroomId: 1, leetcodeUsername: 1 }, { unique: true });
studentSchema.index({ classroomId: 1, status: 1 });
studentSchema.index({ classroomId: 1, enrollmentNumber: 1 });
studentSchema.index({ classroomId: 1, divisionId: 1 });

module.exports = mongoose.model('Student', studentSchema);
