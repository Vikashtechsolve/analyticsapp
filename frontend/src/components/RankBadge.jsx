import { getRankTier, RANK_TIER_STYLES, formatRank } from '../utils/rankUtils';

export default function RankBadge({
  rank,
  total,
  size = 'md',
  showTotal = false,
  className = '',
}) {
  if (!rank) {
    return (
      <span className={`text-slate-600 text-xs ${className}`}>Unranked</span>
    );
  }

  const tier = getRankTier(rank);
  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 min-w-[28px]',
    md: 'text-xs px-2 py-0.5 min-w-[36px]',
    lg: 'text-sm px-3 py-1 min-w-[44px]',
    xl: 'text-lg px-4 py-1.5 min-w-[52px] font-black',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-bold tabular-nums rounded-lg border ring-1 ${sizes[size]} ${RANK_TIER_STYLES[tier]} ${className}`}
      title={total ? `Rank ${rank} of ${total}` : `Rank ${rank}`}
    >
      {showTotal ? formatRank(rank, total) : `#${rank}`}
    </span>
  );
}
