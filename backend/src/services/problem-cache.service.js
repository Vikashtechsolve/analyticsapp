const { ProblemCache } = require('../models');
const { fetchProblemDetail } = require('./leetcode.service');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const ensureProblemsCached = async (slugs) => {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (!unique.length) return {};

  const existing = await ProblemCache.find({ slug: { $in: unique } });
  const bySlug = Object.fromEntries(existing.map((p) => [p.slug, p]));
  const missing = unique.filter((s) => !bySlug[s]);

  for (const slug of missing.slice(0, 8)) {
    try {
      const detail = await fetchProblemDetail(slug);
      if (detail) {
        await ProblemCache.findOneAndUpdate({ slug: detail.slug }, detail, { upsert: true });
        bySlug[detail.slug] = detail;
      }
      await delay(400);
    } catch {
      /* skip failed lookups */
    }
  }

  return bySlug;
};

module.exports = { ensureProblemsCached };
