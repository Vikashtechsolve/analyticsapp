/** Shared leaderboard / podium sort config — Today is always first + default. */
export const DEFAULT_LEADERBOARD_SORT = 'todaySolved';

export const LEADERBOARD_SORT_OPTIONS = [
  { key: 'todaySolved', label: 'Today' },
  { key: 'score', label: 'Overall' },
  { key: 'totalSolved', label: 'Solved' },
  { key: 'streak', label: 'Streak' },
  { key: 'weeklyActivity', label: 'Weekly' },
  { key: 'contestRating', label: 'Contest' },
];

export const LEADERBOARD_SORT_LABELS = Object.fromEntries(
  LEADERBOARD_SORT_OPTIONS.map(({ key, label }) => [key, label])
);
