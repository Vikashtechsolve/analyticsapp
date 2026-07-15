const { ProblemCache, Student, StudentSnapshot } = require('../models');
const { sumCalendarRange, mapToObj, countUniqueSolvesOnDate, toLocalDateString, todayLocal, snapWeeklyActivity } = require('./analytics.utils');

const DIFF_WEIGHT = { Easy: 1, Medium: 2, Hard: 3 };
const REVISION_DAYS = [7, 15, 30];
const TAG_BENCHMARKS = { fundamental: 50, intermediate: 30, advanced: 12 };

const studentAdminFields = (student = {}) => ({
  institute: student.institute || '',
  academicDepartment: student.academicDepartment || '',
  mobile: student.mobile || '',
  enrollmentNumber: student.enrollmentNumber || '',
  email: student.email || '',
});

const daysBetween = (from, to = new Date()) =>
  Math.floor((to - new Date(from)) / 86400000);

const getProblemsByTag = (problemProgress) => {
  const byTag = {};
  for (const p of problemProgress || []) {
    for (const tag of p.tags || []) {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(p);
    }
  }
  return byTag;
};

const calculateMasteryFromTagStats = (tagStats, snapshot, dailySolveLog = []) => {
  if (!tagStats?.length) return null;

  const accuracy = snapshot?.acceptanceRate || 50;
  const recentTags = new Set();
  const cutoff = Date.now() - 30 * 86400000;
  for (const entry of dailySolveLog) {
    if (new Date(entry.solvedAt).getTime() >= cutoff) {
      for (const tag of entry.tags || []) recentTags.add(tag);
    }
  }

  return tagStats.map((t) => {
    const benchmark = TAG_BENCHMARKS[t.level] || 30;
    const volumeScore = Math.min(70, (t.solved / benchmark) * 70);
    const levelBonus = t.level === 'advanced' ? 10 : t.level === 'intermediate' ? 5 : 0;
    const recencyBonus = recentTags.has(t.tag) ? 15 : 0;
    const accuracyBonus = (accuracy / 100) * 15;
    const mastery = Math.min(
      100,
      Math.round(volumeScore + levelBonus + recencyBonus + accuracyBonus)
    );

    return {
      tag: t.tag,
      mastery,
      solved: t.solved,
      level: t.level,
      strength: mastery >= 75 ? 'strong' : mastery >= 50 ? 'moderate' : 'weak',
    };
  }).sort((a, b) => b.mastery - a.mastery);
};

const calculateTopicMastery = (problemProgress, snapshot, tagStats, dailySolveLog) => {
  const fromOfficial = calculateMasteryFromTagStats(tagStats, snapshot, dailySolveLog);
  if (fromOfficial?.length) return fromOfficial;

  const byTag = getProblemsByTag(problemProgress);
  const accuracy = snapshot?.acceptanceRate || 50;

  return Object.entries(byTag)
    .map(([tag, problems]) => {
      const count = problems.length;
      const volumeScore = Math.min(70, (count / 12) * 70);
      const avgDiff =
        problems.reduce((s, p) => s + (DIFF_WEIGHT[p.difficulty] || 1.5), 0) / count;
      const difficultyScore = (avgDiff / 3) * 15;
      const mastery = Math.min(100, Math.round(volumeScore + difficultyScore + accuracy * 0.15));

      return {
        tag,
        mastery,
        solved: count,
        level: 'tracked',
        strength: mastery >= 75 ? 'strong' : mastery >= 50 ? 'moderate' : 'weak',
      };
    })
    .sort((a, b) => b.mastery - a.mastery);
};

const calculateLearningDepth = (problemProgress, snapshot) => {
  const totalSolved = snapshot?.totalSolved || 0;
  const totalSubmissions = snapshot?.totalSubmissions || 0;
  const reSolved = (problemProgress || []).filter((p) => (p.solveCount || 1) > 1);
  const estimatedWrong = Math.max(0, totalSubmissions - totalSolved);

  return {
    firstAttemptSuccessRate: snapshot?.acceptanceRate || 0,
    estimatedWrongSubmissions: estimatedWrong,
    avgAttemptsPerSolve:
      totalSolved > 0 ? Math.round((totalSubmissions / totalSolved) * 10) / 10 : 0,
    difficultySplit: {
      easy: snapshot?.easy || 0,
      medium: snapshot?.medium || 0,
      hard: snapshot?.hard || 0,
    },
    reSolvedCount: reSolved.length,
    reSolvedProblems: reSolved.slice(0, 10).map((p) => ({
      title: p.title,
      slug: p.slug,
      solveCount: p.solveCount,
    })),
    timePerProblem: null,
    helpTaken: null,
    dataNote:
      'Time-per-problem and help-taken require LeetCode session data. Other metrics are estimated from public profile stats.',
  };
};

const getRevisionMilestone = (daysSinceFirst, revisited) => {
  if (revisited) {
    if (daysSinceFirst >= 30) return { days: 30, label: '30-day maintenance review' };
    return null;
  }
  if (daysSinceFirst >= 30) return { days: 30, label: '30-day revision (overdue)' };
  if (daysSinceFirst >= 15) return { days: 15, label: '15-day revision due' };
  if (daysSinceFirst >= 7) return { days: 7, label: '7-day revision due' };
  return null;
};

const calculateRevisionTracker = (problemProgress) => {
  const now = new Date();
  const due = [];
  const upcoming = [];
  const forgotten = [];

  for (const p of problemProgress || []) {
    if (!p.firstSolvedAt || !p.lastSolvedAt) continue;

    const daysSinceLast = daysBetween(p.lastSolvedAt, now);
    const daysSinceFirst = daysBetween(p.firstSolvedAt, now);
    const revisited = (p.solveCount || 1) > 1;
    const milestone = getRevisionMilestone(
      revisited ? daysSinceLast : daysSinceFirst,
      revisited
    );

    if (milestone) {
      const entry = {
        slug: p.slug,
        title: p.title,
        tags: p.tags || [],
        firstSolvedAt: p.firstSolvedAt,
        lastSolvedAt: p.lastSolvedAt,
        daysSince: revisited ? daysSinceLast : daysSinceFirst,
        revisionDue: milestone.label,
        revisited,
        priority:
          milestone.days >= 30 ? 'high' : milestone.days >= 15 ? 'medium' : 'low',
      };
      due.push(entry);
      if (!revisited && daysSinceFirst >= 30) forgotten.push(entry);
    } else if (!revisited) {
      const nextDay = REVISION_DAYS.find((d) => daysSinceFirst < d);
      if (nextDay) {
        upcoming.push({
          slug: p.slug,
          title: p.title,
          daysUntilDue: nextDay - daysSinceFirst,
          revisionDue: `${nextDay}-day review`,
        });
      }
    }
  }

  due.sort((a, b) => b.daysSince - a.daysSince);
  upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const forgottenTags = [...new Set(forgotten.flatMap((p) => p.tags || []))];

  return {
    due,
    upcoming: upcoming.slice(0, 10),
    forgottenTopics: forgottenTags,
    revisionAccuracy: null,
    dataNote:
      'Revisions are based on first-solve dates from your solve history. Re-solving updates solve count on next sync.',
  };
};

const buildDailySolveHistory = (dailySolveLog, calendar) => {
  const byDate = {};

  for (const entry of dailySolveLog || []) {
    const date = entry.date;
    if (!byDate[date]) byDate[date] = { date, problems: [], count: 0 };
    const exists = byDate[date].problems.some((p) => p.slug === entry.slug);
    if (!exists) {
      byDate[date].problems.push({
        slug: entry.slug,
        title: entry.title,
        difficulty: entry.difficulty,
        tags: entry.tags || [],
        solvedAt: entry.solvedAt,
      });
      byDate[date].count++;
    }
  }

  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const last90 = dates.slice(0, 90);

  return {
    byDate: last90.map((d) => byDate[d]),
    summary: last90.map((d) => ({
      date: d,
      problemsSolved: byDate[d].count,
      submissions: calendar?.[d] || 0,
    })),
    totalLogged: dailySolveLog?.length || 0,
  };
};

const generateNextSteps = (mastery, revision, snapshot) => {
  const steps = [];
  const weak = mastery.filter((t) => t.mastery < 50).slice(0, 3);
  const moderate = mastery.filter((t) => t.mastery >= 50 && t.mastery < 75).slice(0, 2);

  for (const t of weak) {
    steps.push({
      type: 'practice',
      priority: 'high',
      text: `Solve 3 ${t.tag} problems (mastery: ${t.mastery}%)`,
      topic: t.tag,
    });
  }
  for (const t of moderate) {
    steps.push({
      type: 'improve',
      priority: 'medium',
      text: `Attempt 2 medium ${t.tag} problems to strengthen skills`,
      topic: t.tag,
    });
  }

  for (const r of revision.due.slice(0, 5)) {
    steps.push({
      type: 'revision',
      priority: r.priority,
      text: `Re-solve "${r.title}" (${r.revisionDue})`,
      slug: r.slug,
    });
  }

  if ((snapshot?.medium || 0) < 20) {
    steps.push({
      type: 'challenge',
      priority: 'medium',
      text: 'Attempt 2 medium difficulty problems this week',
    });
  }

  if (revision.forgottenTopics.length) {
    steps.push({
      type: 'revise-topic',
      priority: 'high',
      text: `Revise basics: ${revision.forgottenTopics.slice(0, 3).join(', ')}`,
    });
  }

  if (!steps.length) {
    steps.push({
      type: 'maintain',
      priority: 'low',
      text: 'Keep daily practice — maintain your streak and explore new topics',
    });
  }

  return steps.slice(0, 8);
};

const avgMastery = (masteryList) => {
  if (!masteryList?.length) return 0;
  return Math.round(masteryList.reduce((s, t) => s + t.mastery, 0) / masteryList.length);
};

const quickAnalyticsFromSnapshot = (snapshot) => {
  const topicMastery = calculateMasteryFromTagStats(snapshot?.tagStats, snapshot, []) || [];
  return {
    topicMastery,
    avgMastery: avgMastery(topicMastery),
  };
};

const loadClassroomSnapshots = async (classroomId) => {
  const students = await Student.find({ classroomId, status: 'active' })
    .select(
      'displayName leetcodeUsername divisionId latestSnapshotId institute email mobile enrollmentNumber academicDepartment dailySolveLog problemProgress'
    )
    .populate('divisionId', 'name slug')
    .lean();

  const snapshotIds = students.map((s) => s.latestSnapshotId).filter(Boolean);
  const snapshots = snapshotIds.length
    ? await StudentSnapshot.find({ _id: { $in: snapshotIds } })
        .select(
          'totalSolved easy medium hard streak calendar acceptanceRate tagStats syncError totalSubmissions recentSolves problemsSolvedToday problemsSolvedTodayDate'
        )
        .lean()
    : [];
  const snapById = new Map(snapshots.map((s) => [String(s._id), s]));

  return students.map((student) => ({
    student,
    snapshot: student.latestSnapshotId
      ? snapById.get(String(student.latestSnapshotId)) || null
      : null,
  }));
};

const buildProblemProgressFromLog = (dailySolveLog, existingProgress = []) => {
  const bySlug = Object.fromEntries((existingProgress || []).map((p) => [p.slug, { ...p }]));

  const sorted = [...(dailySolveLog || [])].sort(
    (a, b) => new Date(a.solvedAt) - new Date(b.solvedAt)
  );

  for (const entry of sorted) {
    if (!entry.slug) continue;
    const solvedAt = new Date(entry.solvedAt);
    if (bySlug[entry.slug]) {
      if (solvedAt < new Date(bySlug[entry.slug].firstSolvedAt)) {
        bySlug[entry.slug].firstSolvedAt = solvedAt;
      }
      if (solvedAt > new Date(bySlug[entry.slug].lastSolvedAt)) {
        bySlug[entry.slug].lastSolvedAt = solvedAt;
      }
      bySlug[entry.slug].solveCount = (bySlug[entry.slug].solveCount || 1) + 1;
      if (entry.tags?.length) bySlug[entry.slug].tags = entry.tags;
    } else {
      bySlug[entry.slug] = {
        slug: entry.slug,
        title: entry.title,
        difficulty: entry.difficulty || 'Medium',
        tags: entry.tags || [],
        firstSolvedAt: solvedAt,
        lastSolvedAt: solvedAt,
        solveCount: 1,
      };
    }
  }

  return Object.values(bySlug);
};

const backfillProblemProgress = async (student) => {
  if (student.dailySolveLog?.length) {
    return buildProblemProgressFromLog(student.dailySolveLog, student.problemProgress);
  }
  if (student.problemProgress?.length) return student.problemProgress;
  return [];
};

const buildStudentAnalytics = async (student, snapshot) => {
  const dailySolveLog = student.dailySolveLog || [];
  const problemProgress = await backfillProblemProgress(student);
  const tagStats = snapshot?.tagStats || [];
  const calendar = snapshot?.calendar ? mapToObj(snapshot.calendar) : {};

  const topicMastery = calculateTopicMastery(
    problemProgress,
    snapshot,
    tagStats,
    dailySolveLog
  );
  const learningDepth = calculateLearningDepth(problemProgress, snapshot);
  const revision = calculateRevisionTracker(problemProgress);
  const nextSteps = generateNextSteps(topicMastery, revision, snapshot);
  const dailySolves = buildDailySolveHistory(dailySolveLog, calendar);

  return {
    topicMastery,
    avgMastery: avgMastery(topicMastery),
    learningDepth,
    revision,
    nextSteps,
    dailySolves,
  };
};

const getStudentComparison = async (studentId, classroomId) => {
  const classData = await loadClassroomSnapshots(classroomId);
  const valid = classData.filter((d) => d.snapshot && !d.snapshot.syncError);
  const mine = classData.find((d) => String(d.student._id) === String(studentId));
  if (!mine?.snapshot) return null;

  const myAnalytics = await buildStudentAnalytics(mine.student, mine.snapshot);

  const masteryFor = (entry) => {
    if (String(entry.student._id) === String(studentId)) return myAnalytics.avgMastery;
    return quickAnalyticsFromSnapshot(entry.snapshot).avgMastery;
  };

  const topicMasteryFor = (entry) => {
    if (String(entry.student._id) === String(studentId)) return myAnalytics.topicMastery;
    return quickAnalyticsFromSnapshot(entry.snapshot).topicMastery;
  };

  const classAvgSolved =
    valid.length > 0
      ? Math.round(valid.reduce((s, d) => s + d.snapshot.totalSolved, 0) / valid.length)
      : 0;
  const classAvgMastery =
    valid.length > 0
      ? Math.round(valid.reduce((s, d) => s + masteryFor(d), 0) / valid.length)
      : 0;
  const classAvgStreak =
    valid.length > 0
      ? Math.round(valid.reduce((s, d) => s + (d.snapshot.streak || 0), 0) / valid.length)
      : 0;

  const top = [...valid].sort(
    (a, b) => b.snapshot.totalSolved - a.snapshot.totalSolved
  )[0];

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const oldSnap = await StudentSnapshot.findOne({
    studentId,
    syncedAt: { $lte: monthAgo },
    syncError: { $exists: false },
  })
    .sort({ syncedAt: -1 })
    .select('syncedAt totalSolved easy medium hard')
    .lean();

  const topicBenchmarks = myAnalytics.topicMastery.map((t) => {
    const classTopicScores = valid.map((d) => {
      const found = topicMasteryFor(d).find((m) => m.tag === t.tag);
      return found?.mastery || 0;
    });
    const classTopicAvg =
      classTopicScores.length > 0
        ? Math.round(classTopicScores.reduce((a, b) => a + b, 0) / classTopicScores.length)
        : 0;
    const topTopic = Math.max(...classTopicScores, t.mastery);
    return {
      tag: t.tag,
      student: t.mastery,
      classAvg: classTopicAvg,
      top: topTopic,
    };
  });

  return {
    vsClassAvg: {
      solved: mine.snapshot.totalSolved - classAvgSolved,
      mastery: myAnalytics.avgMastery - classAvgMastery,
      streak: (mine.snapshot.streak || 0) - classAvgStreak,
      classAvgSolved,
      classAvgMastery,
      classAvgStreak,
    },
    vsTopPerformer: top
      ? {
          name: top.student.displayName,
          solvedGap: top.snapshot.totalSolved - mine.snapshot.totalSolved,
          masteryGap: masteryFor(top) - myAnalytics.avgMastery,
          topSolved: top.snapshot.totalSolved,
          topMastery: masteryFor(top),
        }
      : null,
    vsPreviousMonth: oldSnap
      ? {
          solvedDelta: mine.snapshot.totalSolved - oldSnap.totalSolved,
          easyDelta: mine.snapshot.easy - oldSnap.easy,
          mediumDelta: mine.snapshot.medium - oldSnap.medium,
          hardDelta: mine.snapshot.hard - oldSnap.hard,
          date: oldSnap.syncedAt,
        }
      : null,
    topicBenchmarks,
  };
};

const getTeacherInsights = async (studentsWithSnaps) => {
  const valid = studentsWithSnaps.filter((s) => s.snapshot && !s.snapshot.syncError);

  // Fast path: use tagStats already on the snapshot (no per-student heavy progress rebuild)
  const enriched = valid.map((s) => ({
    ...s,
    analytics: quickAnalyticsFromSnapshot(s.snapshot),
  }));

  const leaderboard = [...enriched]
    .sort((a, b) => b.analytics.avgMastery - a.analytics.avgMastery)
    .map((s, i) => ({
      rank: i + 1,
      studentId: s._id,
      displayName: s.displayName,
      leetcodeUsername: s.leetcodeUsername,
      ...studentAdminFields(s),
      totalSolved: s.snapshot.totalSolved,
      avgMastery: s.analytics.avgMastery,
      streak: s.snapshot.streak,
      weeklyActivity: snapWeeklyActivity(s.snapshot),
    }));

  const avgMasteryClass =
    enriched.length > 0
      ? Math.round(enriched.reduce((s, e) => s + e.analytics.avgMastery, 0) / enriched.length)
      : 0;

  const struggling = enriched
    .filter(
      (s) =>
        s.analytics.avgMastery < 40 ||
        s.analytics.avgMastery < avgMasteryClass * 0.6
    )
    .map((s) => ({
      studentId: s._id,
      displayName: s.displayName,
      ...studentAdminFields(s),
      avgMastery: s.analytics.avgMastery,
      weakTopics: s.analytics.topicMastery
        .filter((t) => t.mastery < 40)
        .slice(0, 3)
        .map((t) => t.tag),
    }))
    .sort((a, b) => a.avgMastery - b.avgMastery);

  const atRisk = enriched
    .filter((s) => {
      const inactive = snapWeeklyActivity(s.snapshot) === 0;
      const lowMastery = s.analytics.avgMastery < 35;
      const lowStreak = (s.snapshot.streak || 0) < 2;
      return (inactive && lowMastery) || (inactive && lowStreak) || (lowMastery && lowStreak);
    })
    .map((s) => ({
      studentId: s._id,
      displayName: s.displayName,
      ...studentAdminFields(s),
      reason:
        snapWeeklyActivity(s.snapshot) === 0
          ? 'Inactive + low progress'
          : 'Low mastery and streak',
      avgMastery: s.analytics.avgMastery,
    }))
    .sort((a, b) => a.avgMastery - b.avgMastery);

  const consistent = enriched
    .filter(
      (s) =>
        (s.snapshot.streak || 0) >= 5 && snapWeeklyActivity(s.snapshot) >= 5
    )
    .map((s) => ({
      studentId: s._id,
      displayName: s.displayName,
      ...studentAdminFields(s),
      streak: s.snapshot.streak,
      weeklyActivity: snapWeeklyActivity(s.snapshot),
    }));

  const topicAgg = {};
  for (const s of enriched) {
    for (const t of s.analytics.topicMastery) {
      if (!topicAgg[t.tag]) topicAgg[t.tag] = { total: 0, count: 0 };
      topicAgg[t.tag].total += t.mastery;
      topicAgg[t.tag].count++;
    }
  }
  const topicClassMastery = Object.entries(topicAgg)
    .map(([tag, v]) => ({
      tag,
      classMastery: Math.round(v.total / v.count),
      students: v.count,
    }))
    .sort((a, b) => a.classMastery - b.classMastery);

  const today = todayLocal();
  const dailyReport = enriched.map((s) => {
    const problemsSolvedToday = countUniqueSolvesOnDate(s, today);
    return {
      studentId: s._id,
      displayName: s.displayName,
      ...studentAdminFields(s),
      // Unique problems solved today (not calendar submission count)
      submissionsToday: problemsSolvedToday,
      problemsSolvedToday,
      streak: s.snapshot.streak,
    };
  });

  const batchProgress = {
    avgSolved:
      valid.length > 0
        ? Math.round(valid.reduce((s, e) => s + e.snapshot.totalSolved, 0) / valid.length)
        : 0,
    avgMastery: avgMasteryClass,
    activeToday: dailyReport.filter((d) => d.problemsSolvedToday > 0).length,
    totalStudents: studentsWithSnaps.length,
  };

  return {
    topPerformers: leaderboard.slice(0, 5),
    strugglingStudents: struggling,
    atRiskStudents: atRisk,
    consistentStudents: consistent.slice(0, 10),
    topicClassMastery,
    batchProgress,
    dailyReport,
  };
};

const mergeDailySolveLog = async (existingLog, recentSolves, cacheBySlug) => {
  const seen = new Set(
    (existingLog || []).map((e) => `${e.date}:${String(e.slug || '').toLowerCase()}`)
  );
  const log = [...(existingLog || [])];

  for (const solve of recentSolves) {
    if (!solve.slug || !solve.timestamp) continue;
    const solvedAt = new Date(Number(solve.timestamp) * 1000);
    const date = toLocalDateString(solvedAt);
    const slug = String(solve.slug).toLowerCase();
    const key = `${date}:${slug}`;
    if (seen.has(key)) continue;

    const cached = cacheBySlug[solve.slug] || cacheBySlug[slug];
    log.push({
      date,
      slug,
      title: solve.title,
      difficulty: cached?.difficulty || solve.difficulty || 'Medium',
      tags: cached?.tags || [],
      solvedAt,
    });
    seen.add(key);
  }

  return log.sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt));
};

const mergeProblemProgress = async (existing, recentSolves, cacheBySlug = {}) => {
  const slugs = recentSolves.map((s) => s.slug).filter(Boolean);
  if (!Object.keys(cacheBySlug).length && slugs.length) {
    const cached = await ProblemCache.find({ slug: { $in: slugs } });
    cacheBySlug = Object.fromEntries(cached.map((p) => [p.slug, p]));
  }

  const enriched = recentSolves.map((s) => ({
    ...s,
    difficulty: cacheBySlug[s.slug]?.difficulty || s.difficulty,
    tags: cacheBySlug[s.slug]?.tags,
  }));

  const tempLog = await mergeDailySolveLog([], enriched, cacheBySlug);
  return buildProblemProgressFromLog(tempLog, existing);
};

const computeSnapshotScore = (snap) => {
  if (!snap || snap.syncError) return 0;
  const weekly = sumCalendarRange(snap.calendar, 7);
  return (
    Math.round(
      ((snap.totalSolved || 0) * 1 + (snap.streak || 0) * 0.5 + weekly * 0.3) * 10
    ) / 10
  );
};

const buildStudentSummary = (entry) => {
  const { student, snapshot, analytics } = entry;
  return {
    studentId: student._id,
    displayName: student.displayName,
    leetcodeUsername: student.leetcodeUsername,
    ...studentAdminFields(student),
    divisionName: student.divisionId?.name || null,
    totalSolved: snapshot?.totalSolved ?? 0,
    avgMastery: analytics?.avgMastery ?? 0,
    streak: snapshot?.streak ?? 0,
    weeklyActivity: snapshot ? sumCalendarRange(snapshot.calendar, 7) : 0,
    score: computeSnapshotScore(snapshot),
    acceptanceRate: snapshot?.acceptanceRate ?? 0,
    easy: snapshot?.easy ?? 0,
    medium: snapshot?.medium ?? 0,
    hard: snapshot?.hard ?? 0,
  };
};

const getClassroomStudentData = async (classroomId) => {
  const classData = await loadClassroomSnapshots(classroomId);
  return classData.map(({ student, snapshot }) => ({
    student,
    snapshot,
    analytics: snapshot ? quickAnalyticsFromSnapshot(snapshot) : { topicMastery: [], avgMastery: 0 },
  }));
};

const getStudentPeers = async (classroomId, studentId) => {
  const classData = await getClassroomStudentData(classroomId);
  const valid = classData.filter((d) => d.snapshot && !d.snapshot.syncError);

  const ranked = [...valid]
    .map((d) => buildStudentSummary(d))
    .sort((a, b) => b.score - a.score)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  const peers = ranked.filter((p) => String(p.studentId) !== String(studentId));
  return { peers, total: ranked.length };
};

const getStudentPeerComparison = async (studentId, peerId, classroomId) => {
  if (String(studentId) === String(peerId)) {
    return null;
  }

  const classData = await getClassroomStudentData(classroomId);
  const valid = classData.filter((d) => d.snapshot && !d.snapshot.syncError);

  const mine = valid.find((d) => String(d.student._id) === String(studentId));
  const peer = valid.find((d) => String(d.student._id) === String(peerId));

  if (!mine?.snapshot || !peer?.snapshot) return null;

  const you = buildStudentSummary(mine);
  const them = buildStudentSummary(peer);

  const ranked = valid
    .map((d) => buildStudentSummary(d))
    .sort((a, b) => b.score - a.score);
  const youRank = ranked.findIndex((r) => String(r.studentId) === String(studentId)) + 1;
  const peerRank = ranked.findIndex((r) => String(r.studentId) === String(peerId)) + 1;

  const topicMap = new Map();
  for (const t of mine.analytics.topicMastery || []) {
    topicMap.set(t.tag, { tag: t.tag, you: t.mastery, peer: 0, youSolved: t.solved, peerSolved: 0 });
  }
  for (const t of peer.analytics.topicMastery || []) {
    const existing = topicMap.get(t.tag) || {
      tag: t.tag,
      you: 0,
      peer: 0,
      youSolved: 0,
      peerSolved: 0,
    };
    existing.peer = t.mastery;
    existing.peerSolved = t.solved;
    topicMap.set(t.tag, existing);
  }

  const topicComparison = [...topicMap.values()]
    .map((t) => ({
      ...t,
      delta: t.you - t.peer,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);

  const delta = (a, b) => a - b;

  return {
    you: { ...you, rank: youRank, rankTotal: ranked.length },
    peer: { ...them, rank: peerRank, rankTotal: ranked.length },
    deltas: {
      totalSolved: delta(you.totalSolved, them.totalSolved),
      avgMastery: delta(you.avgMastery, them.avgMastery),
      streak: delta(you.streak, them.streak),
      weeklyActivity: delta(you.weeklyActivity, them.weeklyActivity),
      score: delta(you.score, them.score),
      acceptanceRate: delta(you.acceptanceRate, them.acceptanceRate),
      easy: delta(you.easy, them.easy),
      medium: delta(you.medium, them.medium),
      hard: delta(you.hard, them.hard),
      rank: delta(peerRank, youRank),
    },
    topicComparison,
    ahead: {
      totalSolved: you.totalSolved >= them.totalSolved,
      avgMastery: you.avgMastery >= them.avgMastery,
      streak: you.streak >= them.streak,
      score: you.score >= them.score,
    },
  };
};

module.exports = {
  buildStudentAnalytics,
  getStudentComparison,
  getStudentPeers,
  getStudentPeerComparison,
  getTeacherInsights,
  mergeProblemProgress,
  mergeDailySolveLog,
  buildProblemProgressFromLog,
  calculateTopicMastery,
};
