const { Student, StudentSnapshot, Classroom, ProblemCache } = require('../models');
const { fetchUserData, fetchProblemsBatch } = require('./leetcode.service');
const {
  mergeDailySolveLog,
  buildProblemProgressFromLog,
  calculateTopicMastery,
} = require('./student-analytics.service');
const { ensureProblemsCached } = require('./problem-cache.service');
const {
  upsertSuccessfulSnapshot,
  upsertErrorSnapshot,
  pruneStudentSnapshots,
} = require('./snapshot-retention.service');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const buildTopicBreakdown = async (slugs) => {
  if (!slugs.length) return [];
  const problems = await ProblemCache.find({ slug: { $in: slugs } });
  const tagCounts = {};
  for (const p of problems) {
    for (const tag of p.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
};

const enrichRecentSolves = (recentSolves, cacheBySlug) =>
  recentSolves.map((s) => ({
    ...s,
    difficulty: cacheBySlug[s.slug]?.difficulty || s.difficulty,
    tags: cacheBySlug[s.slug]?.tags,
  }));

const syncStudent = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student || student.status !== 'active') return null;

  try {
    const data = await fetchUserData(student.leetcodeUsername);
    const cacheBySlug = await ensureProblemsCached(data.recentSlugs);
    const recentSolves = enrichRecentSolves(data.recentSolves, cacheBySlug);

    const dailySolveLog = await mergeDailySolveLog(
      student.dailySolveLog,
      recentSolves,
      cacheBySlug
    );
    const problemProgress = buildProblemProgressFromLog(
      dailySolveLog,
      student.problemProgress
    );

    const mergedSlugs = [...new Set([...(student.solvedSlugs || []), ...data.recentSlugs])];
    const prevSnapshot = student.latestSnapshotId
      ? await StudentSnapshot.findById(student.latestSnapshotId)
      : null;

    const dailySolved = prevSnapshot
      ? Math.max(0, data.totalSolved - (prevSnapshot.totalSolved || 0))
      : 0;

    const topicBreakdown = await buildTopicBreakdown(mergedSlugs);

    const tempSnapshot = {
      acceptanceRate: data.acceptanceRate,
      streak: data.streak,
    };
    const topicMastery = calculateTopicMastery(
      problemProgress,
      tempSnapshot,
      data.tagStats,
      dailySolveLog
    );
    const tagStats = (data.tagStats || []).map((t) => {
      const m = topicMastery.find((x) => x.tag === t.tag);
      return { ...t, mastery: m?.mastery || 0 };
    });

    // One full snapshot per UTC day (updates in place) — stops unbounded growth
    const snapshot = await upsertSuccessfulSnapshot(student._id, {
      totalSolved: data.totalSolved,
      easy: data.easy,
      medium: data.medium,
      hard: data.hard,
      totalSubmissions: data.totalSubmissions,
      acceptanceRate: data.acceptanceRate,
      ranking: data.ranking,
      reputation: data.reputation,
      streak: data.streak,
      totalActiveDays: data.totalActiveDays,
      contestRating: data.contestRating,
      contestAttended: data.contestAttended,
      calendar: data.calendar,
      dailySolved,
      recentSolves,
      topicBreakdown,
      tagStats,
    });

    student.solvedSlugs = mergedSlugs;
    student.problemProgress = problemProgress;
    student.dailySolveLog = dailySolveLog;
    student.latestSnapshotId = snapshot._id;
    await student.save();

    // Drop old historical snapshots beyond retention
    await pruneStudentSnapshots(student._id, snapshot._id);

    return snapshot;
  } catch (err) {
    const snapshot = await upsertErrorSnapshot(
      student._id,
      err.message || 'Sync failed'
    );

    // Don't replace a healthy latest snapshot with an error-only doc
    const currentLatest = student.latestSnapshotId
      ? await StudentSnapshot.findById(student.latestSnapshotId).select('syncError').lean()
      : null;
    const latestIsHealthy = currentLatest && !currentLatest.syncError;

    if (!latestIsHealthy) {
      student.latestSnapshotId = snapshot._id;
      await student.save();
    }

    await pruneStudentSnapshots(student._id, student.latestSnapshotId);
    return snapshot;
  }
};

let classroomSyncRunning = false;

const syncClassroom = async (classroomId) => {
  if (classroomSyncRunning) {
    return { queued: true, message: 'Another classroom sync is in progress' };
  }
  classroomSyncRunning = true;
  try {
    const students = await Student.find({ classroomId, status: 'active' });
    const results = [];
    for (const student of students) {
      const snapshot = await syncStudent(student._id);
      results.push({
        studentId: student._id,
        success: !snapshot?.syncError,
        error: snapshot?.syncError,
      });
      await delay(500);
    }
    await Classroom.findByIdAndUpdate(classroomId, { lastSyncedAt: new Date() });
    return { synced: results.length, results };
  } finally {
    classroomSyncRunning = false;
  }
};

const syncClassroomBatch = async (classroomId, { offset = 0, limit = 8 } = {}) => {
  const query = { classroomId, status: 'active' };
  const total = await Student.countDocuments(query);
  const students = await Student.find(query).sort({ _id: 1 }).skip(offset).limit(limit);

  const results = [];
  for (const student of students) {
    const snapshot = await syncStudent(student._id);
    results.push({
      studentId: student._id,
      displayName: student.displayName,
      leetcodeUsername: student.leetcodeUsername,
      success: Boolean(snapshot && !snapshot.syncError),
      error: snapshot?.syncError || null,
    });
    await delay(600);
  }

  const completed = offset + students.length;
  const ok = results.filter((r) => r.success).length;
  const failed = results.length - ok;

  if (!completed || completed >= total) {
    await Classroom.findByIdAndUpdate(classroomId, { lastSyncedAt: new Date() });
  }

  return {
    offset,
    limit,
    total,
    processed: students.length,
    completed,
    hasMore: completed < total,
    nextOffset: completed,
    ok,
    failed,
    results,
  };
};

const syncAllActiveStudents = async () => {
  const students = await Student.find({ status: 'active' });
  const classroomIds = new Set();
  for (const student of students) {
    await syncStudent(student._id);
    classroomIds.add(String(student.classroomId));
    await delay(500);
  }
  for (const id of classroomIds) {
    await Classroom.findByIdAndUpdate(id, { lastSyncedAt: new Date() });
  }
  return { synced: students.length };
};

const syncProblemCache = async (maxPages = 20) => {
  let skip = 0;
  const limit = 100;
  let total = 0;
  for (let page = 0; page < maxPages; page++) {
    const batch = await fetchProblemsBatch(limit, skip);
    const questions = batch.questions || [];
    if (!questions.length) break;
    for (const q of questions) {
      await ProblemCache.findOneAndUpdate(
        { slug: q.titleSlug },
        {
          slug: q.titleSlug,
          title: q.title,
          difficulty: q.difficulty,
          tags: (q.topicTags || []).map((t) => t.name),
        },
        { upsert: true }
      );
      total++;
    }
    skip += limit;
    if (skip >= (batch.total || 0)) break;
    await delay(1000);
  }
  return { cached: total };
};

module.exports = {
  syncStudent,
  syncClassroom,
  syncClassroomBatch,
  syncAllActiveStudents,
  syncProblemCache,
  buildTopicBreakdown,
};
