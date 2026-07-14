const { Student, StudentSnapshot } = require('../models');

const retentionDays = () =>
  Math.max(7, parseInt(process.env.SNAPSHOT_RETENTION_DAYS, 10) || 45);

const maxPerStudent = () =>
  Math.max(7, parseInt(process.env.SNAPSHOT_MAX_PER_STUDENT, 10) || 45);

const utcDayBounds = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

const isErrorSnap = (doc) => Boolean(doc?.syncError);

/**
 * Save at most one successful snapshot per UTC day (update in place).
 * Also removes any other same-day successful duplicates (leftover from old behavior).
 */
const upsertSuccessfulSnapshot = async (studentId, payload) => {
  const { start, end } = utcDayBounds();

  const existing = await StudentSnapshot.findOne({
    studentId,
    syncedAt: { $gte: start, $lte: end },
    $or: [{ syncError: { $exists: false } }, { syncError: null }, { syncError: '' }],
  }).sort({ syncedAt: -1 });

  let snapshot;
  if (existing) {
    snapshot = await StudentSnapshot.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          ...payload,
          syncedAt: new Date(),
        },
        $unset: { syncError: 1 },
      },
      { new: true }
    );
  } else {
    snapshot = await StudentSnapshot.create({
      studentId,
      ...payload,
      syncedAt: new Date(),
    });
  }

  // Remove leftover same-day successful copies (pre-fix bloat / race)
  await StudentSnapshot.deleteMany({
    studentId,
    _id: { $ne: snapshot._id },
    syncedAt: { $gte: start, $lte: end },
    $or: [{ syncError: { $exists: false } }, { syncError: null }, { syncError: '' }],
  });

  return snapshot;
};

/**
 * Record a sync failure without destroying a good latest snapshot when possible.
 * - Reuses today's error doc if present
 * - Otherwise creates one, but does not replace a healthy latest pointer (caller decides)
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
 * Delete old / excess snapshots for one student. Always keeps latestSnapshotId.
 * Prefers dropping error snapshots and same-day duplicates first.
 */
const pruneStudentSnapshots = async (studentId, latestSnapshotId = null) => {
  const days = retentionDays();
  const maxKeep = maxPerStudent();
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  let deleted = 0;
  const keepLatest = latestSnapshotId ? String(latestSnapshotId) : null;

  // 1) Age prune (never delete the pointer snapshot)
  const ageFilter = {
    studentId,
    syncedAt: { $lt: cutoff },
  };
  if (keepLatest) ageFilter._id = { $ne: latestSnapshotId };
  const ageResult = await StudentSnapshot.deleteMany(ageFilter);
  deleted += ageResult.deletedCount || 0;

  // 2) Drop all error snapshots except if it is the latest pointer
  const errorFilter = {
    studentId,
    syncError: { $exists: true, $nin: [null, ''] },
  };
  if (keepLatest) errorFilter._id = { $ne: latestSnapshotId };
  const errorResult = await StudentSnapshot.deleteMany(errorFilter);
  deleted += errorResult.deletedCount || 0;

  // 3) Collapse same-calendar-day successful duplicates (keep newest per day)
  const remaining = await StudentSnapshot.find({ studentId })
    .sort({ syncedAt: -1 })
    .select('_id syncedAt syncError')
    .lean();

  const seenDays = new Set();
  const duplicateIds = [];
  for (const doc of remaining) {
    if (keepLatest && String(doc._id) === keepLatest) {
      const dayKey = new Date(doc.syncedAt).toISOString().slice(0, 10);
      seenDays.add(dayKey);
      continue;
    }
    if (isErrorSnap(doc)) continue;
    const dayKey = new Date(doc.syncedAt).toISOString().slice(0, 10);
    if (seenDays.has(dayKey)) {
      duplicateIds.push(doc._id);
    } else {
      seenDays.add(dayKey);
    }
  }
  if (duplicateIds.length) {
    const dupResult = await StudentSnapshot.deleteMany({ _id: { $in: duplicateIds } });
    deleted += dupResult.deletedCount || 0;
  }

  // 4) Cap total count (keep newest + always latest pointer)
  const afterDedup = await StudentSnapshot.find({ studentId })
    .sort({ syncedAt: -1 })
    .select('_id')
    .lean();

  const keepIds = new Set();
  if (keepLatest) keepIds.add(keepLatest);
  for (const doc of afterDedup.slice(0, maxKeep)) {
    keepIds.add(String(doc._id));
  }

  const overflowIds = afterDedup
    .filter((doc) => !keepIds.has(String(doc._id)))
    .map((doc) => doc._id);

  if (overflowIds.length) {
    const overflowResult = await StudentSnapshot.deleteMany({ _id: { $in: overflowIds } });
    deleted += overflowResult.deletedCount || 0;
  }

  return {
    deleted,
    kept: Math.min(afterDedup.length, maxKeep),
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

  // Delete orphan snapshots whose student no longer exists
  const studentIds = students.map((s) => s._id);
  const orphanResult = await StudentSnapshot.deleteMany({
    studentId: { $nin: studentIds },
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
