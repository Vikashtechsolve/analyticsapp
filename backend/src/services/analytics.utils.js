const mapToObj = (map) => {
  if (!map) return {};
  if (map instanceof Map) return Object.fromEntries(map);
  return map;
};

const appTimeZone = () => process.env.APP_TIMEZONE || 'Asia/Kolkata';

/** YYYY-MM-DD in the app timezone (default Asia/Kolkata). */
const toLocalDateString = (input = new Date(), timeZone = appTimeZone()) => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

const todayLocal = (timeZone = appTimeZone()) => toLocalDateString(new Date(), timeZone);

const getDateRange = (days) => {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(toLocalDateString(d));
  }
  return dates;
};

const sumCalendarRange = (calendar, days = 7) => {
  const cal = mapToObj(calendar);
  const dates = getDateRange(days);
  return dates.reduce((sum, d) => sum + (cal[d] || 0), 0);
};

const buildCalendarWindow = (calendar, days = 30) => {
  const cal = mapToObj(calendar);
  const out = {};
  for (const date of getDateRange(days)) {
    if (cal[date]) out[date] = cal[date];
  }
  return out;
};

const snapWeeklyActivity = (snap) => {
  if (!snap || snap.syncError) return 0;
  if (typeof snap.weeklyActivity === 'number') return snap.weeklyActivity;
  return sumCalendarRange(snap.calendar30 || snap.calendar, 7);
};

const snapScore = (snap) => {
  if (!snap || snap.syncError) return 0;
  if (typeof snap.score === 'number' && Number.isFinite(snap.score)) return snap.score;
  const weekly = snapWeeklyActivity(snap);
  return Math.round(((snap.totalSolved || 0) * 1 + (snap.streak || 0) * 0.5 + weekly * 0.3) * 10) / 10;
};

/** Today count: use synced value, else calendar for that day. */
const todaySolvedOf = (snap, date = todayLocal()) => {
  if (!snap || snap.syncError) return 0;
  if (
    snap.problemsSolvedTodayDate === date &&
    typeof snap.problemsSolvedToday === 'number'
  ) {
    return snap.problemsSolvedToday;
  }
  const cal = mapToObj(snap.calendar30 || snap.calendar);
  return Number(cal[date] || 0);
};

const countUniqueSolvesOnDate = (student, date, timeZone = appTimeZone()) => {
  const snap = student.snapshot || student;
  if (
    snap &&
    snap.problemsSolvedTodayDate === date &&
    typeof snap.problemsSolvedToday === 'number'
  ) {
    return snap.problemsSolvedToday;
  }

  const slugs = new Set();
  for (const entry of student.dailySolveLog || []) {
    if (!entry?.slug) continue;
    const entryDate = entry.solvedAt
      ? toLocalDateString(entry.solvedAt, timeZone)
      : entry.date;
    if (entryDate === date) slugs.add(String(entry.slug).toLowerCase());
  }
  for (const solve of snap?.recentSolves || []) {
    if (!solve?.slug || !solve.timestamp) continue;
    const solvedDate = toLocalDateString(new Date(Number(solve.timestamp) * 1000), timeZone);
    if (solvedDate === date) slugs.add(String(solve.slug).toLowerCase());
  }
  return slugs.size;
};

const computeUniqueSolvesOnDate = (dailySolveLog, recentSolves, date, timeZone = appTimeZone()) =>
  countUniqueSolvesOnDate(
    { dailySolveLog, snapshot: { recentSolves } },
    date,
    timeZone
  );

module.exports = {
  mapToObj,
  getDateRange,
  sumCalendarRange,
  buildCalendarWindow,
  snapWeeklyActivity,
  snapScore,
  todaySolvedOf,
  countUniqueSolvesOnDate,
  computeUniqueSolvesOnDate,
  toLocalDateString,
  todayLocal,
  appTimeZone,
};
