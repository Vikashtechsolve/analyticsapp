const { mapToObj, sumCalendarRange, snapWeeklyActivity } = require('./analytics.utils');
const {
  getStudentsWithSnapshots,
  buildStudentRankings,
  SNAPSHOT_TEACHER_FIELDS,
  STUDENT_TEACHER_FIELDS,
} = require('./analytics.service');
const { buildStudentAnalytics } = require('./student-analytics.service');

const PERIOD_DAYS = { week: 7, month: 30 };

const periodToDays = (period, customDays) => {
  if (period === 'days') return Math.max(1, Number(customDays) || 7);
  return PERIOD_DAYS[period] || 7;
};

const daysSinceLastActivity = (snapshot) => {
  const cal = mapToObj(snapshot?.calendar30 || snapshot?.calendar);
  if (!cal || !Object.keys(cal).length) return null;
  let lastDate = null;
  for (const [date, count] of Object.entries(cal)) {
    if (count > 0 && (!lastDate || date > lastDate)) lastDate = date;
  }
  if (!lastDate) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const lastUtc = new Date(`${lastDate}T00:00:00Z`).getTime();
  return Math.floor((todayUtc - lastUtc) / 86400000);
};

const countSolvesInPeriod = (student, periodDays) => {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - periodDays + 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const log = student.dailySolveLog || [];
  const inPeriod = log.filter((e) => e.date >= cutoffStr);
  const uniqueProblems = new Set(inPeriod.map((e) => e.slug).filter(Boolean)).size;

  return {
    uniqueProblems,
    totalEntries: inPeriod.length,
    periodDays,
  };
};

const buildStudentMetrics = async (student, snapshot) => {
  const analytics = snapshot && !snapshot.syncError
    ? await buildStudentAnalytics(student, snapshot)
    : { avgMastery: 0, topicMastery: [] };

  const weeklyActivity = snapshot ? snapWeeklyActivity(snapshot) : 0;
  const monthlyActivity = snapshot
    ? sumCalendarRange(snapshot.calendar30 || snapshot.calendar, 30)
    : 0;

  return {
    totalSolved: snapshot?.totalSolved ?? 0,
    avgMastery: analytics.avgMastery ?? 0,
    streak: snapshot?.streak ?? 0,
    weeklyActivity,
    monthlyActivity,
    daysSinceActive: snapshot ? daysSinceLastActivity(snapshot) : null,
    lastActiveDate: (() => {
      const cal = mapToObj(snapshot?.calendar30 || snapshot?.calendar);
      const dates = Object.keys(cal).filter((d) => cal[d] > 0).sort();
      return dates[dates.length - 1] || null;
    })(),
    hasSyncError: Boolean(snapshot?.syncError),
    noSnapshot: !snapshot,
    solvesInPeriod: (days) => countSolvesInPeriod(student, days),
    submissionsInDays: (days) =>
      snapshot ? sumCalendarRange(snapshot.calendar30 || snapshot.calendar, days) : 0,
  };
};

const evaluateFilter = (filterKey, config, metrics, classAvgs) => {
  if (!config?.enabled) return null;

  switch (filterKey) {
    case 'inactive': {
      const days = Math.max(1, Number(config.days) || 7);
      const submissions = metrics.submissionsInDays(days);
      const match = submissions === 0;
      return {
        match,
        reason: match
          ? `No submissions in last ${days} day${days !== 1 ? 's' : ''}`
          : null,
        detail: { days, submissions },
      };
    }
    case 'lowSolvesInPeriod': {
      const periodDays = periodToDays(config.period, config.days);
      const fewerThan = Math.max(0, Number(config.fewerThan) ?? 1);
      const { uniqueProblems } = metrics.solvesInPeriod(periodDays);
      const match = uniqueProblems < fewerThan;
      const periodLabel =
        config.period === 'week'
          ? 'week'
          : config.period === 'month'
            ? 'month'
            : `${periodDays} days`;
      return {
        match,
        reason: match
          ? `Only ${uniqueProblems} problem${uniqueProblems !== 1 ? 's' : ''} solved in last ${periodLabel} (need ${fewerThan}+)`
          : null,
        detail: { uniqueProblems, fewerThan, periodDays },
      };
    }
    case 'lowMastery': {
      const below = Number(config.below) ?? 40;
      const match = metrics.avgMastery < below;
      return {
        match,
        reason: match ? `Mastery ${metrics.avgMastery}% (below ${below}%)` : null,
        detail: { avgMastery: metrics.avgMastery, below },
      };
    }
    case 'lowStreak': {
      const below = Number(config.below) ?? 2;
      const match = metrics.streak < below;
      return {
        match,
        reason: match ? `Streak ${metrics.streak} day${metrics.streak !== 1 ? 's' : ''} (below ${below})` : null,
        detail: { streak: metrics.streak, below },
      };
    }
    case 'belowClassAverage': {
      const metric = config.metric || 'totalSolved';
      const thresholdPct = Number(config.percentOfClassAvg) ?? 70;
      const avgKey =
        metric === 'mastery'
          ? 'avgMastery'
          : metric === 'weeklyActivity'
            ? 'weeklyActivity'
            : metric === 'streak'
              ? 'streak'
              : 'totalSolved';
      const classAvg = classAvgs[avgKey] || 0;
      const studentVal = metrics[avgKey === 'avgMastery' ? 'avgMastery' : avgKey] ?? 0;
      const threshold = classAvg * (thresholdPct / 100);
      const match = classAvg > 0 && studentVal < threshold;
      return {
        match,
        reason: match
          ? `${avgKey} ${studentVal} is below ${thresholdPct}% of class avg (${Math.round(classAvg)})`
          : null,
        detail: { studentVal, classAvg, thresholdPct },
      };
    }
    case 'noRecentActivity': {
      const days = Math.max(1, Number(config.days) || 14);
      const since = metrics.daysSinceActive;
      const match = since === null || since >= days;
      return {
        match,
        reason: match
          ? since === null
            ? 'No recorded activity ever'
            : `Last active ${since} day${since !== 1 ? 's' : ''} ago`
          : null,
        detail: { daysSinceActive: since, days },
      };
    }
    case 'syncIssue': {
      const match = metrics.noSnapshot || metrics.hasSyncError;
      return {
        match,
        reason: match
          ? metrics.noSnapshot
            ? 'No sync data'
            : 'LeetCode sync error'
          : null,
        detail: {},
      };
    }
    default:
      return null;
  }
};

const filterStudentsForTeacher = async (classroomId, options = {}) => {
  const {
    divisionId = null,
    matchMode = 'all',
    filters = {},
    search = '',
  } = options;

  const allStudents = await getStudentsWithSnapshots(classroomId, null, {
    snapshotSelect: SNAPSHOT_TEACHER_FIELDS,
    studentSelect: STUDENT_TEACHER_FIELDS,
  });
  const rankings = buildStudentRankings(allStudents);

  let pool = divisionId
    ? allStudents.filter(
        (s) => String(s.divisionId?._id || s.divisionId) === String(divisionId)
      )
    : allStudents;

  const enabledFilters = Object.entries(filters).filter(([, cfg]) => cfg?.enabled);
  if (!enabledFilters.length) {
    return {
      matched: [],
      totalScanned: pool.length,
      classAverages: {},
      message: 'Enable at least one filter',
    };
  }

  const validForAvg = pool.filter((s) => s.snapshot && !s.snapshot.syncError);
  const classAvgs = {
    totalSolved:
      validForAvg.length > 0
        ? Math.round(
            validForAvg.reduce((s, e) => s + (e.snapshot.totalSolved || 0), 0) / validForAvg.length
          )
        : 0,
    avgMastery: 0,
    weeklyActivity:
      validForAvg.length > 0
        ? Math.round(
            validForAvg.reduce((s, e) => s + snapWeeklyActivity(e.snapshot), 0) /
              validForAvg.length
          )
        : 0,
    streak:
      validForAvg.length > 0
        ? Math.round(
            validForAvg.reduce((s, e) => s + (e.snapshot.streak || 0), 0) / validForAvg.length
          )
        : 0,
  };

  if (validForAvg.length > 0) {
    const masterySum = await Promise.all(
      validForAvg.map(async (s) => {
        const a = await buildStudentAnalytics(s, s.snapshot);
        return a.avgMastery;
      })
    );
    classAvgs.avgMastery = Math.round(
      masterySum.reduce((a, b) => a + b, 0) / masterySum.length
    );
  }

  const q = search.trim().toLowerCase();
  if (q) {
    pool = pool.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.leetcodeUsername.toLowerCase().includes(q) ||
        (s.institute || '').toLowerCase().includes(q) ||
        (s.academicDepartment || '').toLowerCase().includes(q) ||
        (s.mobile || '').toLowerCase().includes(q) ||
        (s.enrollmentNumber || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    );
  }

  const matched = [];

  for (const student of pool) {
    const metrics = await buildStudentMetrics(student, student.snapshot);
    const results = [];

    for (const [key, config] of enabledFilters) {
      const result = evaluateFilter(key, config, metrics, classAvgs);
      if (result) results.push({ key, ...result });
    }

    const matches =
      matchMode === 'any'
        ? results.some((r) => r.match)
        : results.every((r) => r.match);

    if (!matches) continue;

    const rankData = rankings.overallByMetric?.score?.get(String(student._id));
    const divId = String(student.divisionId?._id || student.divisionId);
    const divRank = rankings.divisionByMetric?.[divId]?.byMetric?.score?.get(String(student._id));

    matched.push({
      studentId: student._id,
      displayName: student.displayName,
      leetcodeUsername: student.leetcodeUsername,
      institute: student.institute || '',
      academicDepartment: student.academicDepartment || '',
      mobile: student.mobile || '',
      enrollmentNumber: student.enrollmentNumber || '',
      email: student.email || '',
      division: student.divisionId
        ? { _id: student.divisionId._id, name: student.divisionId.name, slug: student.divisionId.slug }
        : null,
      metrics: {
        totalSolved: metrics.totalSolved,
        avgMastery: metrics.avgMastery,
        streak: metrics.streak,
        weeklyActivity: metrics.weeklyActivity,
        daysSinceActive: metrics.daysSinceActive,
        lastActiveDate: metrics.lastActiveDate,
        solvesLast7Days: metrics.solvesInPeriod(7).uniqueProblems,
        solvesLast30Days: metrics.solvesInPeriod(30).uniqueProblems,
      },
      overallRank: rankData?.rank ?? null,
      overallTotal: rankData?.total ?? 0,
      divisionRank: divRank?.rank ?? null,
      divisionTotal: divRank?.total ?? 0,
      matchedReasons: results.filter((r) => r.match).map((r) => r.reason).filter(Boolean),
    });
  }

  matched.sort((a, b) => {
    const rankA = a.overallRank ?? 9999;
    const rankB = b.overallRank ?? 9999;
    return rankB - rankA;
  });

  return {
    matched,
    totalScanned: pool.length,
    matchCount: matched.length,
    classAverages: classAvgs,
    matchMode,
    appliedFilters: Object.fromEntries(enabledFilters),
  };
};

module.exports = { filterStudentsForTeacher, periodToDays, countSolvesInPeriod };
