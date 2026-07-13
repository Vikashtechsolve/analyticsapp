const mapToObj = (map) => {
  if (!map) return {};
  if (map instanceof Map) return Object.fromEntries(map);
  return map;
};

const getDateRange = (days) => {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

const sumCalendarRange = (calendar, days = 7) => {
  const cal = mapToObj(calendar);
  const dates = getDateRange(days);
  return dates.reduce((sum, d) => sum + (cal[d] || 0), 0);
};

/** Unique problems solved on a date (not submission count). */
const countUniqueSolvesOnDate = (student, date) => {
  const slugs = new Set();

  for (const entry of student.dailySolveLog || []) {
    if (entry.date === date && entry.slug) slugs.add(entry.slug);
  }

  for (const solve of student.snapshot?.recentSolves || []) {
    if (!solve.slug || !solve.timestamp) continue;
    const solvedDate = new Date(solve.timestamp * 1000).toISOString().slice(0, 10);
    if (solvedDate === date) slugs.add(solve.slug);
  }

  return slugs.size;
};

module.exports = { mapToObj, getDateRange, sumCalendarRange, countUniqueSolvesOnDate };
