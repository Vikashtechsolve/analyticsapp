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

/**
 * Unique problems solved on a given local date — never LeetCode submission counts.
 * Uses dailySolveLog + recentSolves, keyed by problem slug.
 */
const countUniqueSolvesOnDate = (student, date, timeZone = appTimeZone()) => {
  const slugs = new Set();

  for (const entry of student.dailySolveLog || []) {
    if (!entry?.slug) continue;
    const entryDate = entry.solvedAt
      ? toLocalDateString(entry.solvedAt, timeZone)
      : entry.date;
    if (entryDate === date) slugs.add(String(entry.slug).toLowerCase());
  }

  for (const solve of student.snapshot?.recentSolves || []) {
    if (!solve?.slug || !solve.timestamp) continue;
    const solvedDate = toLocalDateString(new Date(Number(solve.timestamp) * 1000), timeZone);
    if (solvedDate === date) slugs.add(String(solve.slug).toLowerCase());
  }

  return slugs.size;
};

module.exports = {
  mapToObj,
  getDateRange,
  sumCalendarRange,
  countUniqueSolvesOnDate,
  toLocalDateString,
  todayLocal,
  appTimeZone,
};
