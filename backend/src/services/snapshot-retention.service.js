const { Student, StudentSnapshot } = require('../models');

const retentionDays = () =>
  Math.max(7, parseInt(process.env.SNAPSHOT_RETENTION_DAYS, 10) || 45);

const maxPerStudent = () =>
  Math.max(7, parseInt(process.env.SNAPSHOT_MAX_PER_STUDENT, 10) || 45);

const utcDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Save at most one successful snapshot per UTC day (update in place).
 * Prevents 4–6 full copies/day when the sync cron runs repeatedly.
 */
const upsertSuccessfulSnapshot = async (studentId, payload) => {
  const { start, end } = utcDayBounds();
  const existing = await StudentSnapshot.findOne({
    studentId,
    syncedAt: { $gte: start, $lte: end },
    $or: [{ syncError: { $exists: false } }, { syncError: null }, { syncError: '' }],
  }).sort({ syncedAt: -1 });

  if (existing) {
    existing.set({
      ...payload,
      syncedAt: new Date(),
    });
    existing.markModified('calendar');
    existing.markModified('recentSolves');
    existing.markModified('topicBreakdown');
    existing.markModified('tagStats');
    await existing.save();
    await StudentSnapshot.updateOne({ _id: existing._id }, { $unset: { syncError: 1 } });
    existing.syncError = undefined;
    return existing;
  }

  return StudentSnapshot.create({
    studentId,
    ...payload,
    syncedAt: new Date(),
  });
};

/**
 * Keep only the latest error snapshot for a student (or update today's).
 */
const upsertErrorSnapshot = async (studentId, message) => {
  const { start, end } = utcDayBounds();
  const existingToday = await StudentSnapshot.findOne({
    studentId,
    syncedAt: { $gte: start, $lte: end },
    syncError: { $exists: true, $nin: [null, ''] },
  }).sort({ syncedAt: -1 });

  if (existingToday) {
    existingToday.syncError = message;
    existingToday.syncedAt = new Date();
    await existingToday.save();
    return existingToday;
  }

  return StudentSnapshot.create({
    studentId,
    syncError: message,
    syncedAt: new Date(),
  });
};

/**
 * Delete old snapshots for one student. Always keeps latestSnapshotId.
 * Retention = last N days, capped at max docs per student.
 */
const pruneStudentSnapshots = async (studentId, latestSnapshotId = null) => {
  const days = retentionDays();
  const maxKeep = maxPerStudent();
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const keepIds = new Set();
  if (latestSnapshotId) keepIds.add(String(latestSnapshotId));

  // Age-based prune (never delete the pointer snapshot)
  const ageFilter = {
    studentId,
    syncedAt: { $lt: cutoff },
  };
  if (latestSnapshotId) ageFilter._id = { $ne: latestSnapshotId };
  const ageResult = await StudentSnapshot.deleteMany(ageFilter);

  // Cap remaining count
  const remaining = await StudentSnapshot.find({ studentId })
    .sort({ syncedAt: -1 })
    .select('_id')
    .lean();

  for (const doc of remaining.slice(0, maxKeep)) {
    keepIds.add(String(doc._id));
  }

  const overflowIds = remaining
    .filter((doc) => !keepIds.has(String(doc._id)))
    .map((doc) => doc._id);

  let overflowDeleted = 0;
  if (overflowIds.length) {
    const overflowResult = await StudentSnapshot.deleteMany({ _id: { $in: overflowIds } });
    overflowDeleted = overflowResult.deletedCount || 0;
  }

  return {
    deleted: (ageResult.deletedCount || 0) + overflowDeleted,
    kept: Math.min(remaining.length, maxKeep),
  };
};

/**
 * One-shot / cron cleanup across all students — reclaim existing bloat.
 */
const pruneAllSnapshots = async () => {
  const students = await Student.find({}).select('_id latestSnapshotId').lean();
  let deleted = 0;
  let processed = 0;

  for (const student of students) {
    const result = await pruneStudentSnapshots(student._id, student.latestSnapshotId);
    deleted += result.deleted;
    processed += 1;
  }

  // Orphan snapshots (student deleted / no owner pointer needed cleanup)
  const orphanCutoff = new Date();
  orphanCutoff.setUTCDate(orphanCutoff.getUTCDate() - retentionDays());
  const studentIds = students.map((s) => s._id);
  const orphanResult = await StudentSnapshot.deleteMany({
    studentId: { $nin: studentIds },
    syncedAt: { $lt: orphanCutoff },
  });

  deleted += orphanResult.deletedCount || 0;

  return {
    processedStudents: processed,
    deleted,
    retentionDays: retentionDays(),
    maxPerStudent: maxPerStudent(),
  };
};

module.exports = {
  upsertSuccessfulSnapshot,
  upsertErrorSnapshot,
  pruneStudentSnapshots,
  pruneAllSnapshots,
  retentionDays,
  maxPerStudent,
};
