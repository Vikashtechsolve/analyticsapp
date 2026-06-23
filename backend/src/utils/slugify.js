const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseLeetCodeUsername = (input) => {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/leetcode\.com\/u\/([^/?#]+)/i);
  if (urlMatch) return urlMatch[1];
  const legacyMatch = trimmed.match(/leetcode\.com\/([^/?#]+)/i);
  if (legacyMatch && legacyMatch[1] !== 'problems' && legacyMatch[1] !== 'u') {
    return legacyMatch[1];
  }
  return trimmed.replace(/^@/, '');
};

module.exports = { slugify, parseLeetCodeUsername };
