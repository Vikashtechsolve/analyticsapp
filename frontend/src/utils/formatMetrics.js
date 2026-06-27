/** Format LeetCode contest rating — whole number, no decimals. */
export function formatContestRating(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (n <= 0) return '—';
  return Math.round(n).toLocaleString();
}

/** Round numeric leaderboard metrics for display. */
export function formatLeaderboardMetric(value, sortBy) {
  switch (sortBy) {
    case 'contestRating':
      return formatContestRating(value);
    case 'score':
      return value == null || Number.isNaN(Number(value)) ? '—' : Math.round(Number(value));
    case 'weeklyActivity':
    case 'totalSolved':
    case 'streak':
    case 'todaySolved':
      return value ?? 0;
    default:
      return value == null ? '—' : Math.round(Number(value));
  }
}
