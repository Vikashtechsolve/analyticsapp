const TOPIC_META = {
  Array: { icon: '▦', category: 'Fundamentals', hue: 'violet' },
  'Hash Table': { icon: '#', category: 'Fundamentals', hue: 'violet' },
  'Linked List': { icon: '⛓', category: 'Fundamentals', hue: 'sky' },
  'Two Pointers': { icon: '⇄', category: 'Techniques', hue: 'cyan' },
  'Sliding Window': { icon: '▭', category: 'Techniques', hue: 'cyan' },
  'Binary Search': { icon: '⌕', category: 'Techniques', hue: 'blue' },
  'Dynamic Programming': { icon: '◈', category: 'Advanced', hue: 'amber' },
  'Graph': { icon: '◎', category: 'Advanced', hue: 'rose' },
  Tree: { icon: '⌘', category: 'Structures', hue: 'emerald' },
  'Binary Tree': { icon: '⌘', category: 'Structures', hue: 'emerald' },
  Stack: { icon: '⊞', category: 'Structures', hue: 'teal' },
  Queue: { icon: '⊟', category: 'Structures', hue: 'teal' },
  Heap: { icon: '△', category: 'Structures', hue: 'orange' },
  'Priority Queue': { icon: '△', category: 'Structures', hue: 'orange' },
  Backtracking: { icon: '↩', category: 'Advanced', hue: 'pink' },
  Recursion: { icon: '∞', category: 'Techniques', hue: 'indigo' },
  Greedy: { icon: '★', category: 'Techniques', hue: 'yellow' },
  Math: { icon: '∑', category: 'Fundamentals', hue: 'slate' },
  String: { icon: 'Aa', category: 'Fundamentals', hue: 'purple' },
  Sorting: { icon: '⇅', category: 'Fundamentals', hue: 'lime' },
  'Bit Manipulation': { icon: '01', category: 'Advanced', hue: 'fuchsia' },
  'Union Find': { icon: '∪', category: 'Advanced', hue: 'red' },
  'Trie': { icon: 'T', category: 'Advanced', hue: 'emerald' },
  'Breadth-First Search': { icon: '↔', category: 'Advanced', hue: 'sky' },
  'Depth-First Search': { icon: '↓', category: 'Advanced', hue: 'sky' },
};

const HUE_STYLES = {
  violet: { ring: '#8b5cf6', bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700' },
  sky: { ring: '#0ea5e9', bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-700' },
  cyan: { ring: '#06b6d4', bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-700' },
  blue: { ring: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  amber: { ring: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  rose: { ring: '#f43f5e', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700' },
  emerald: { ring: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
  teal: { ring: '#14b8a6', bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-700' },
  orange: { ring: '#f97316', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700' },
  pink: { ring: '#ec4899', bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-700' },
  indigo: { ring: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700' },
  yellow: { ring: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700' },
  slate: { ring: '#64748b', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700' },
  purple: { ring: '#a855f7', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700' },
  lime: { ring: '#84cc16', bg: 'bg-lime-50', border: 'border-lime-100', text: 'text-lime-700' },
  fuchsia: { ring: '#d946ef', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', text: 'text-fuchsia-700' },
  red: { ring: '#ef4444', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
};

export const getTopicMeta = (tag) => {
  const known = TOPIC_META[tag];
  if (known) return { ...known, ...HUE_STYLES[known.hue] };
  const hash = tag.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const hues = Object.keys(HUE_STYLES);
  const hue = hues[hash % hues.length];
  return {
    icon: tag.slice(0, 2).toUpperCase(),
    category: 'Other',
    hue,
    ...HUE_STYLES[hue],
  };
};

export const STRENGTH_CONFIG = {
  strong: {
    label: 'Strong',
    ring: '#10b981',
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    glow: 'shadow-emerald-100',
    desc: 'Solid grasp — maintain with periodic review',
  },
  moderate: {
    label: 'Growing',
    ring: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    glow: 'shadow-amber-100',
    desc: 'Good progress — a few more problems to level up',
  },
  weak: {
    label: 'Needs focus',
    ring: '#f43f5e',
    gradient: 'from-rose-500 to-red-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    glow: 'shadow-rose-100',
    desc: 'Priority area — start with easy problems in this topic',
  },
};

export const LEVEL_LABELS = {
  fundamental: 'Fundamental',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  tracked: 'Tracked',
};
