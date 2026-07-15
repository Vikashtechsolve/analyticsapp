const mongoose = require('mongoose');

const recentSolveSchema = new mongoose.Schema(
  {
    title: String,
    slug: String,
    difficulty: String,
    timestamp: Number,
  },
  { _id: false }
);

const topicBreakdownSchema = new mongoose.Schema(
  {
    tag: String,
    count: Number,
  },
  { _id: false }
);

const tagStatSchema = new mongoose.Schema(
  {
    tag: String,
    solved: Number,
    level: String,
    mastery: Number,
  },
  { _id: false }
);

const studentSnapshotSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    syncedAt: { type: Date, default: Date.now },
    totalSolved: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    ranking: { type: Number },
    reputation: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 },
    contestRating: { type: Number },
    contestAttended: { type: Number, default: 0 },
    calendar: { type: Map, of: Number, default: {} },
    // Last ~30 days only — used for classroom activity charts (keeps list queries small)
    calendar30: { type: Map, of: Number, default: {} },
    dailySolved: { type: Number, default: 0 },
    weeklyActivity: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    // Unique problems solved on problemsSolvedTodayDate (app timezone)
    problemsSolvedToday: { type: Number, default: 0 },
    problemsSolvedTodayDate: { type: String, default: '' },
    recentSolves: [recentSolveSchema],
    topicBreakdown: [topicBreakdownSchema],
    tagStats: [tagStatSchema],
    syncError: { type: String },
  },
  { timestamps: true }
);

studentSnapshotSchema.index({ studentId: 1, syncedAt: -1 });

module.exports = mongoose.model('StudentSnapshot', studentSnapshotSchema);
