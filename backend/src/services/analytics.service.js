const { Classroom, Division, Student, StudentSnapshot } = require('../models');
const {
  mapToObj,
  getDateRange,
  sumCalendarRange,
  todayLocal,
  snapWeeklyActivity,
  snapScore,
  todaySolvedOf,
} = require('./analytics.utils');
const {
  buildStudentAnalytics,
  getTeacherInsights,
} = require('./student-analytics.service');

const aggregateCalendar = (snapshots, days = 30) => {
  const dates = getDateRange(days);
  const result = dates.map((date) => ({ date, submissions: 0 }));
  const byDate = Object.fromEntries(result.map((r) => [r.date, r]));
  for (const snap of snapshots) {
    const cal = mapToObj(snap.calendar30 || snap.calendar);
    for (const date of dates) {
      if (cal[date]) byDate[date].submissions += cal[date];
    }
  }
  return result;
};

const aggregateTopics = (snapshots) => {
  const tagCounts = {};
  for (const snap of snapshots) {
    for (const t of snap.topicBreakdown || []) {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + t.count;
    }
  }
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};

const buildTodayTopPerformers = (studentsWithSnaps, today) =>
  studentsWithSnaps
    .filter((s) => s.snapshot && !s.snapshot.syncError)
    .map((s) => {
      const todaySolved = todaySolvedOf(s.snapshot, today);
      return {
        studentId: s._id,
        displayName: s.displayName,
        leetcodeUsername: s.leetcodeUsername,
        division: s.divisionId,
        todaySolved,
        totalSolved: s.snapshot.totalSolved || 0,
        streak: s.snapshot.streak || 0,
        weeklyActivity: snapWeeklyActivity(s.snapshot),
        contestRating:
          s.snapshot.contestRating != null ? Math.round(s.snapshot.contestRating) : null,
        score: snapScore(s.snapshot),
      };
    })
    .filter((s) => s.todaySolved > 0)
    .sort((a, b) => {
      if (b.todaySolved !== a.todaySolved) return b.todaySolved - a.todaySolved;
      if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
      return b.streak - a.streak;
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

/** Lean fields for public classroom / leaderboard pages (no full-year calendar / recentSolves). */
const SNAPSHOT_LIST_FIELDS =
  'totalSolved easy medium hard streak contestRating syncError syncedAt topicBreakdown weeklyActivity score problemsSolvedToday problemsSolvedTodayDate calendar30';

/** Minimal fields for ranking classmates (profile page). */
const SNAPSHOT_RANK_FIELDS =
  'totalSolved streak weeklyActivity score problemsSolvedToday problemsSolvedTodayDate contestRating syncError easy medium hard';

/** Teacher insights — tagStats for mastery, no full calendar / solve logs. */
const SNAPSHOT_TEACHER_FIELDS =
  `${SNAPSHOT_LIST_FIELDS} tagStats acceptanceRate totalSubmissions`;

/** Teacher filters that need calendar/solve history (loaded only when required). */
const SNAPSHOT_TEACHER_FILTER_FIELDS =
  `${SNAPSHOT_TEACHER_FIELDS} calendar`;

const STUDENT_LIST_FIELDS =
  'displayName leetcodeUsername divisionId latestSnapshotId status';

const STUDENT_TEACHER_FIELDS =
  'displayName leetcodeUsername divisionId latestSnapshotId status enrollmentNumber institute email mobile academicDepartment graduationYear';

const STUDENT_TEACHER_FILTER_FIELDS = `${STUDENT_TEACHER_FIELDS} dailySolveLog`;

const attachSnapshots = async (students, select = SNAPSHOT_LIST_FIELDS) => {
  const snapshotIds = students.map((s) => s.latestSnapshotId).filter(Boolean);
  const snapshots = snapshotIds.length
    ? await StudentSnapshot.find({ _id: { $in: snapshotIds } }).select(select).lean()
    : [];
  const snapById = new Map(snapshots.map((s) => [String(s._id), s]));
  return students.map((s) => ({
    ...s,
    snapshot: s.latestSnapshotId ? snapById.get(String(s.latestSnapshotId)) || null : null,
  }));
};

const getStudentsWithSnapshots = async (classroomId, divisionId = null, options = {}) => {
  const {
    snapshotSelect = SNAPSHOT_LIST_FIELDS,
    studentSelect = STUDENT_LIST_FIELDS,
  } = options;
  const filter = { classroomId, status: 'active' };
  if (divisionId) filter.divisionId = divisionId;
  const students = await Student.find(filter)
    .select(studentSelect)
    .populate('divisionId', 'name slug')
    .lean();
  return attachSnapshots(students, snapshotSelect);
};

const RANK_METRICS = ['score', 'totalSolved', 'streak', 'weeklyActivity'];

const toRankEntry = (rank, total) => ({
  rank,
  total,
  percentile: total > 1 ? Math.round((1 - (rank - 1) / total) * 100) : 100,
});

const metricValue = (student, metric) => {
  const snap = student.snapshot;
  if (!snap || snap.syncError) return 0;
  switch (metric) {
    case 'totalSolved':
      return snap.totalSolved || 0;
    case 'streak':
      return snap.streak || 0;
    case 'weeklyActivity':
      return snapWeeklyActivity(snap);
    case 'contestRating':
      return snap.contestRating || 0;
    case 'todaySolved':
      return todaySolvedOf(snap);
    case 'score':
    default:
      return snapScore(snap);
  }
};

/** Slim rank map — no todaySolved / display-row work for every metric. */
const buildRankMap = (students, sortBy) => {
  const list = students
    .filter((s) => s.snapshot && !s.snapshot.syncError)
    .map((s) => ({ id: String(s._id), value: metricValue(s, sortBy) }))
    .sort((a, b) => b.value - a.value);
  const total = list.length;
  return new Map(list.map((r, i) => [r.id, toRankEntry(i + 1, total)]));
};

const buildLeaderboard = (studentsWithSnaps, sortBy = 'score', today = todayLocal()) => {
  const ranked = studentsWithSnaps
    .filter((s) => s.snapshot && !s.snapshot.syncError)
    .map((s) => ({
      studentId: s._id,
      displayName: s.displayName,
      leetcodeUsername: s.leetcodeUsername,
      division: s.divisionId,
      totalSolved: s.snapshot.totalSolved,
      streak: s.snapshot.streak,
      weeklyActivity: snapWeeklyActivity(s.snapshot),
      contestRating:
        s.snapshot.contestRating != null ? Math.round(s.snapshot.contestRating) : null,
      score: snapScore(s.snapshot),
      todaySolved: todaySolvedOf(s.snapshot, today),
    }));

  const sorters = {
    score: (a, b) => b.score - a.score,
    totalSolved: (a, b) => b.totalSolved - a.totalSolved,
    streak: (a, b) => b.streak - a.streak,
    weeklyActivity: (a, b) => b.weeklyActivity - a.weeklyActivity,
    contestRating: (a, b) => (b.contestRating || 0) - (a.contestRating || 0),
    todaySolved: (a, b) => (b.todaySolved || 0) - (a.todaySolved || 0),
  };
  ranked.sort(sorters[sortBy] || sorters.score);
  return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
};

const buildStudentRankings = (allStudents) => {
  const overallByMetric = {};
  for (const metric of RANK_METRICS) {
    overallByMetric[metric] = buildRankMap(allStudents, metric);
  }

  const divisionByMetric = {};
  const byDivision = {};
  for (const s of allStudents) {
    const divId = String(s.divisionId?._id || s.divisionId || 'unknown');
    if (!byDivision[divId]) {
      byDivision[divId] = { name: s.divisionId?.name || 'Division', students: [] };
    }
    byDivision[divId].students.push(s);
  }

  for (const [divId, { name, students }] of Object.entries(byDivision)) {
    const byMetric = {};
    for (const metric of RANK_METRICS) {
      byMetric[metric] = buildRankMap(students, metric);
    }
    divisionByMetric[divId] = { name, byMetric };
  }

  return { overallByMetric, divisionByMetric };
};

const getStudentRank = (rankings, studentId, divisionId, sortBy = 'score') => {
  const sid = String(studentId);
  const did = String(divisionId?._id || divisionId || 'unknown');
  const overall = rankings.overallByMetric[sortBy]?.get(sid) || null;
  const divBlock = rankings.divisionByMetric[did];
  const division = divBlock?.byMetric[sortBy]?.get(sid) || null;

  return {
    overall: overall ? { ...overall } : null,
    division: division ? { ...division, divisionName: divBlock.name } : null,
  };
};

const buildRankingPayload = (rankings, studentId, divisionId, viewRank = null) => {
  const byMetric = {};
  for (const metric of RANK_METRICS) {
    byMetric[metric] = getStudentRank(rankings, studentId, divisionId, metric);
  }
  const primary = byMetric.score;
  return {
    overallRank: primary.overall?.rank ?? null,
    overallTotal: primary.overall?.total ?? 0,
    overallPercentile: primary.overall?.percentile ?? null,
    divisionRank: primary.division?.rank ?? null,
    divisionTotal: primary.division?.total ?? 0,
    divisionPercentile: primary.division?.percentile ?? null,
    divisionName: primary.division?.divisionName ?? null,
    viewRank: viewRank ?? null,
    byMetric,
  };
};

const getClassroomAnalytics = async (classroomId, divisionId = null, options = {}) => {
  const { includeStudents = false, allStudents: preloadedStudents = null } = options;
  const allStudents = preloadedStudents || (await getStudentsWithSnapshots(classroomId, null));
  const rankings = buildStudentRankings(allStudents);

  const students = divisionId
    ? allStudents.filter(
        (s) => String(s.divisionId?._id || s.divisionId) === String(divisionId)
      )
    : allStudents;

  const activeDivision = divisionId
    ? students[0]?.divisionId || allStudents.find(
        (s) => String(s.divisionId?._id || s.divisionId) === String(divisionId)
      )?.divisionId
    : null;

  const snapshots = students.map((s) => s.snapshot).filter(Boolean);
  const validSnaps = snapshots.filter((s) => !s?.syncError);

  const today = todayLocal();
  const todayTopPerformers = buildTodayTopPerformers(students, today);
  const activeToday = students.filter(
    (s) => s.snapshot && !s.snapshot.syncError && todaySolvedOf(s.snapshot, today) > 0
  ).length;

  const avgSolved =
    validSnaps.length > 0
      ? Math.round(validSnaps.reduce((sum, s) => sum + s.totalSolved, 0) / validSnaps.length)
      : 0;

  const avgStreak =
    validSnaps.length > 0
      ? Math.round(validSnaps.reduce((sum, s) => sum + s.streak, 0) / validSnaps.length)
      : 0;

  const inactiveStudents = students
    .filter((s) => {
      if (!s.snapshot || s.snapshot.syncError) return false;
      return snapWeeklyActivity(s.snapshot) === 0;
    })
    .map((s) => ({
      studentId: s._id,
      displayName: s.displayName,
      leetcodeUsername: s.leetcodeUsername,
    }));

  const leaderboard = buildLeaderboard(students).map((row) => {
    const ranking = buildRankingPayload(
      rankings,
      row.studentId,
      row.division?._id || row.division,
      row.rank
    );
    return { ...row, ...ranking };
  });

  const payload = {
    summary: {
      totalStudents: students.length,
      totalStudentsOverall: allStudents.length,
      avgSolved,
      activeToday,
      avgStreak,
      todayTopSolved: todayTopPerformers[0]?.todaySolved || 0,
      rankingScope: divisionId ? 'division' : 'classroom',
      activeDivision: activeDivision
        ? { _id: activeDivision._id, name: activeDivision.name, slug: activeDivision.slug }
        : null,
    },
    todayTopPerformers: todayTopPerformers.slice(0, 10),
    leaderboard,
    dailyActivity: aggregateCalendar(validSnaps, 30),
    topics: aggregateTopics(validSnaps),
    inactiveStudents,
  };

  if (includeStudents) {
    payload.students = students.map((s) => ({
      _id: s._id,
      displayName: s.displayName,
      leetcodeUsername: s.leetcodeUsername,
      division: s.divisionId,
      ranking: buildRankingPayload(rankings, s._id, s.divisionId),
      snapshot: s.snapshot
        ? {
            totalSolved: s.snapshot.totalSolved,
            easy: s.snapshot.easy,
            medium: s.snapshot.medium,
            hard: s.snapshot.hard,
            streak: s.snapshot.streak,
            weeklyActivity: snapWeeklyActivity(s.snapshot),
            contestRating: s.snapshot.contestRating,
            syncError: s.snapshot.syncError,
            syncedAt: s.snapshot.syncedAt,
          }
        : null,
    }));
  }

  return payload;
};

const buildDivisionComparison = (allStudents, divisions) => {
  const today = todayLocal();
  return divisions.map((div) => {
    const divStudents = allStudents.filter(
      (s) => String(s.divisionId?._id || s.divisionId) === String(div._id)
    );
    const validSnaps = divStudents
      .map((s) => s.snapshot)
      .filter((s) => s && !s.syncError);
    const avgSolved =
      validSnaps.length > 0
        ? Math.round(validSnaps.reduce((sum, s) => sum + (s.totalSolved || 0), 0) / validSnaps.length)
        : 0;
    const avgStreak =
      validSnaps.length > 0
        ? Math.round(validSnaps.reduce((sum, s) => sum + (s.streak || 0), 0) / validSnaps.length)
        : 0;
    const activeToday = divStudents.filter(
      (s) => s.snapshot && !s.snapshot.syncError && todaySolvedOf(s.snapshot, today) > 0
    ).length;

    return {
      divisionId: div._id,
      name: div.name,
      slug: div.slug,
      totalStudents: divStudents.length,
      avgSolved,
      avgStreak,
      activeToday,
    };
  });
};

const getDivisionComparison = async (classroomId, allStudents = null) => {
  const [divisions, students] = await Promise.all([
    Division.find({ classroomId }).sort('sortOrder').lean(),
    allStudents ? Promise.resolve(allStudents) : getStudentsWithSnapshots(classroomId, null),
  ]);
  return buildDivisionComparison(students, divisions);
};

const getClassroomTeacherDashboard = async (classroomId, divisionId = null) => {
  const students = await getStudentsWithSnapshots(classroomId, divisionId, {
    snapshotSelect: SNAPSHOT_TEACHER_FIELDS,
    studentSelect: STUDENT_TEACHER_FIELDS,
  });
  const teacherInsights = await getTeacherInsights(students);
  return {
    classroomId,
    divisionId,
    ...teacherInsights,
  };
};

const STUDENT_PROFILE_FIELDS =
  'displayName leetcodeUsername divisionId classroomId dailySolveLog problemProgress institute email mobile enrollmentNumber academicDepartment graduationYear status latestSnapshotId';

const SNAPSHOT_PROFILE_FIELDS =
  'totalSolved easy medium hard streak calendar calendar30 contestRating syncError syncedAt topicBreakdown tagStats acceptanceRate totalSubmissions recentSolves problemsSolvedToday problemsSolvedTodayDate weeklyActivity score';

const getStudentDetail = async (studentId) => {
  const student = await Student.findById(studentId)
    .select(STUDENT_PROFILE_FIELDS)
    .populate('divisionId', 'name slug')
    .populate('classroomId', 'name slug')
    .lean();
  if (!student) return null;

  const classroomId = student.classroomId?._id || student.classroomId;

  const [snapshot, history, classmates] = await Promise.all([
    student.latestSnapshotId
      ? StudentSnapshot.findById(student.latestSnapshotId).select(SNAPSHOT_PROFILE_FIELDS).lean()
      : null,
    StudentSnapshot.find({
      studentId,
      syncError: { $exists: false },
      totalSolved: { $exists: true },
    })
      .sort({ syncedAt: 1 })
      .limit(45)
      .select('syncedAt totalSolved easy medium hard streak')
      .lean(),
    // Slim ranking-only load (not full calendars / topics)
    getStudentsWithSnapshots(classroomId, null, {
      snapshotSelect: SNAPSHOT_RANK_FIELDS,
      studentSelect: 'displayName leetcodeUsername divisionId latestSnapshotId',
    }),
  ]);

  let analytics = null;
  let safeSnapshot = null;
  if (snapshot) {
    snapshot.calendar = mapToObj(snapshot.calendar);
    if (snapshot.calendar30) snapshot.calendar30 = mapToObj(snapshot.calendar30);
    analytics = await buildStudentAnalytics(student, snapshot);
    // Drop heavy fields already folded into analytics / unused on the profile wire
    const { tagStats: _tagStats, calendar30: _c30, ...rest } = snapshot;
    safeSnapshot = rest;
  }

  const rankings = buildStudentRankings(classmates);
  const rankingByMetric = {};
  for (const metric of RANK_METRICS) {
    rankingByMetric[metric] = getStudentRank(
      rankings,
      studentId,
      student.divisionId,
      metric
    );
  }

  // Strip heavy raw arrays from wire response (analytics already computed)
  const { dailySolveLog: _log, problemProgress: _prog, ...safeStudent } = student;

  return {
    student: safeStudent,
    snapshot: safeSnapshot,
    history,
    analytics,
    ranking: {
      primary: rankingByMetric.score,
      byMetric: rankingByMetric,
    },
  };
};

module.exports = {
  getClassroomAnalytics,
  getClassroomTeacherDashboard,
  getDivisionComparison,
  buildDivisionComparison,
  getStudentDetail,
  getStudentsWithSnapshots,
  attachSnapshots,
  buildLeaderboard,
  buildStudentRankings,
  getStudentRank,
  sumCalendarRange,
  SNAPSHOT_LIST_FIELDS,
  SNAPSHOT_TEACHER_FIELDS,
  SNAPSHOT_TEACHER_FILTER_FIELDS,
  SNAPSHOT_RANK_FIELDS,
  STUDENT_LIST_FIELDS,
  STUDENT_TEACHER_FIELDS,
  STUDENT_TEACHER_FILTER_FIELDS,
};
