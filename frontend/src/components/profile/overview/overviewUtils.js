import { rankMotivation } from '../../../utils/rankUtils';

export const sumCalendarDays = (calendar, days = 7) => {
  if (!calendar) return 0;
  const now = new Date();
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    total += Number(calendar[key] || 0);
  }
  return total;
};

export const computeScore = (snapshot) => {
  if (!snapshot) return 0;
  const weekly = sumCalendarDays(snapshot.calendar, 7);
  return (
    Math.round(
      ((snapshot.totalSolved || 0) * 1 +
        (snapshot.streak || 0) * 0.5 +
        weekly * 0.3) *
        10
    ) / 10
  );
};

export const buildOverviewStory = ({ snapshot, analytics, ranking }) => {
  const streak = snapshot?.streak ?? 0;
  const weekly = sumCalendarDays(snapshot?.calendar, 7);
  const mastery = analytics?.avgMastery ?? 0;
  const solved = snapshot?.totalSolved ?? 0;
  const rank = ranking?.primary?.overall?.rank;
  const total = ranking?.primary?.overall?.total;

  let headline = 'Your coding journey, at a glance';
  let subtext =
    'Every problem you solve builds skill. Here is where you stand today and what to focus on next.';

  if (rank === 1) {
    headline = 'You are leading the class';
    subtext = `With ${solved} problems solved and a ${streak}-day streak, you are setting the pace. Keep defending your #1 spot.`;
  } else if (rank && rank <= 3) {
    headline = 'Podium position — so close to the top';
    subtext = `${rankMotivation(rank, total)} You have ${solved} solves and ${weekly} submissions this week.`;
  } else if (streak >= 7) {
    headline = `${streak}-day streak — consistency is your superpower`;
    subtext = `You have been showing up every day. ${weekly} problems this week keeps your momentum rolling.`;
  } else if (weekly >= 5) {
    headline = 'Strong week — you are on a roll';
    subtext = `${weekly} problems solved in the last 7 days. ${mastery}% average mastery across topics.`;
  } else if (weekly === 0 && solved > 0) {
    headline = 'Time to get back in the game';
    subtext = `You have ${solved} total solves, but no activity this week. One problem today can restart your streak.`;
  } else if (solved === 0) {
    headline = 'Your story starts with the first solve';
    subtext = 'Pick an easy problem, get your first acceptance, and watch this dashboard come alive.';
  }

  return { headline, subtext, weekly, score: computeScore(snapshot) };
};
