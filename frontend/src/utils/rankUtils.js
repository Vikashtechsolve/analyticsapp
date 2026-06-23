export const getRankTier = (rank) => {
  if (!rank || rank < 1) return 'default';
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  if (rank <= 10) return 'top10';
  return 'default';
};

export const RANK_TIER_STYLES = {
  gold: 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-200',
  silver: 'bg-slate-100 text-slate-700 border-slate-300',
  bronze: 'bg-orange-50 text-orange-700 border-orange-300',
  top10: 'bg-brand-50 text-brand-700 border-brand-300',
  default: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const formatRank = (rank, total) => {
  if (!rank) return '—';
  if (total) return `#${rank} / ${total}`;
  return `#${rank}`;
};

export const rankMotivation = (rank, total) => {
  if (!rank || !total) return 'Keep solving to earn your rank';
  if (rank === 1) return 'You are #1 — defend your crown!';
  if (rank <= 3) return 'Podium position — push for #1!';
  if (rank <= 10) return 'Top 10 — a few more problems to climb!';
  const pct = Math.round((rank / total) * 100);
  if (pct > 75) return 'Rising fast — consistency beats talent';
  if (pct > 50) return 'Upper half — keep the momentum going';
  return 'Every solve moves you up — start climbing today';
};
