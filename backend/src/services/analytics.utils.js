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

module.exports = { mapToObj, getDateRange, sumCalendarRange };
