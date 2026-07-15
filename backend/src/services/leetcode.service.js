const { LeetCode } = require('leetcode-query');

const leetcode = new LeetCode();

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

let requestQueue = Promise.resolve();
let lastRequestAt = 0;
const MIN_REQUEST_GAP_MS = 400;

const throttleRequest = (fn) => {
  const run = async () => {
    const wait = Math.max(0, MIN_REQUEST_GAP_MS - (Date.now() - lastRequestAt));
    if (wait > 0) await delay(wait);
    lastRequestAt = Date.now();
    return fn();
  };
  const result = requestQueue.then(run, run);
  requestQueue = result.catch(() => {}).then(() => delay(MIN_REQUEST_GAP_MS));
  return result;
};

const withRetry = async (fn, retries = 2) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await throttleRequest(fn);
    } catch (err) {
      lastError = err;
      const message = err?.message || String(err);
      const retryable = /ECONNRESET|ETIMEDOUT|ENOTFOUND|429|502|503|504|socket hang up|graphql failed|fetch failed/i.test(
        message
      );
      if (!retryable || attempt === retries) throw err;
      await delay(1200 * (attempt + 1));
    }
  }
  throw lastError;
};

const leetcodeUser = (username) => withRetry(() => leetcode.user(username));
const leetcodeGraphql = (payload) => withRetry(() => leetcode.graphql(payload));
const leetcodeContest = (username) =>
  withRetry(() => leetcode.user_contest_info(username)).catch(() => null);

const CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;

const parseCalendar = (submissionCalendar) => {
  const result = {};
  if (!submissionCalendar) return result;
  let parsed = submissionCalendar;
  if (typeof submissionCalendar === 'string') {
    try {
      parsed = JSON.parse(submissionCalendar);
    } catch {
      return result;
    }
  }
  for (const [ts, count] of Object.entries(parsed)) {
    const date = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
    result[date] = (result[date] || 0) + Number(count);
  }
  return result;
};

const getDifficultyCounts = (acSubmissionNum) => {
  const map = { All: 0, Easy: 0, Medium: 0, Hard: 0 };
  for (const item of acSubmissionNum || []) {
    map[item.difficulty] = item.count || 0;
  }
  return map;
};

const getTotalSubmissions = (totalSubmissionNum, acSubmissionNum) => {
  const allTotal = (totalSubmissionNum || []).find((s) => s.difficulty === 'All');
  const allAc = (acSubmissionNum || []).find((s) => s.difficulty === 'All');
  const total = allTotal?.submissions || allTotal?.count || 0;
  const accepted = allAc?.count || 0;
  const rate = total > 0 ? Math.round((accepted / total) * 1000) / 10 : 0;
  return { total, rate };
};

const TAG_STATS_QUERY = `
  query tagStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        fundamental { tagName problemsSolved }
        intermediate { tagName problemsSolved }
        advanced { tagName problemsSolved }
      }
    }
  }
`;

const RECENT_AC_QUERY = `
  query recentAc($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
    }
  }
`;

const PROBLEM_DETAIL_QUERY = `
  query problemDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      difficulty
      topicTags { name }
    }
  }
`;

const parseTagStats = (tagProblemCounts) => {
  if (!tagProblemCounts) return [];
  const result = [];
  for (const level of ['fundamental', 'intermediate', 'advanced']) {
    for (const item of tagProblemCounts[level] || []) {
      if (item.problemsSolved > 0) {
        result.push({
          tag: item.tagName,
          solved: item.problemsSolved,
          level,
        });
      }
    }
  }
  return result.sort((a, b) => b.solved - a.solved);
};

const fetchProblemDetail = async (slug) => {
  const res = await leetcodeGraphql({
    query: PROBLEM_DETAIL_QUERY,
    variables: { titleSlug: slug },
  });
  const q = res?.data?.question;
  if (!q) return null;
  return {
    slug: q.titleSlug,
    title: q.title,
    difficulty: q.difficulty,
    tags: (q.topicTags || []).map((t) => t.name),
  };
};

const fetchUserData = async (username) => {
  const year = new Date().getFullYear();
  const profileData = await leetcodeUser(username);
  const recentRes = await leetcodeGraphql({
    query: RECENT_AC_QUERY,
    variables: { username, limit: 50 },
  });
  const contestData = await leetcodeContest(username);
  const calendarRes = await leetcodeGraphql({
    query: CALENDAR_QUERY,
    variables: { username, year },
  }).catch(() => null);
  const tagRes = await leetcodeGraphql({
    query: TAG_STATS_QUERY,
    variables: { username },
  }).catch(() => null);

  const recentList = recentRes?.data?.recentAcSubmissionList || [];

  const matchedUser = profileData?.matchedUser;
  if (!matchedUser) {
    throw new Error(`LeetCode user "${username}" not found`);
  }

  const acStats = getDifficultyCounts(matchedUser.submitStats?.acSubmissionNum);
  const { total: totalSubmissions, rate: acceptanceRate } = getTotalSubmissions(
    matchedUser.submitStats?.totalSubmissionNum,
    matchedUser.submitStats?.acSubmissionNum
  );

  const calendarFromProfile = parseCalendar(matchedUser.submissionCalendar);
  const calendarFromYear = parseCalendar(
    calendarRes?.data?.matchedUser?.userCalendar?.submissionCalendar
  );
  const calendar = { ...calendarFromProfile, ...calendarFromYear };

  const streak =
    calendarRes?.data?.matchedUser?.userCalendar?.streak ??
    0;
  const totalActiveDays =
    calendarRes?.data?.matchedUser?.userCalendar?.totalActiveDays ??
    Object.keys(calendar).length;

  const recentSolves = (recentList || []).map((s) => ({
    title: s.title,
    slug: s.titleSlug,
    timestamp: Number(s.timestamp),
    difficulty: null,
  }));

  const contest = contestData?.userContestRanking || {};
  const tagStats = parseTagStats(tagRes?.data?.matchedUser?.tagProblemCounts);

  return {
    username: matchedUser.username,
    totalSolved: acStats.All,
    easy: acStats.Easy,
    medium: acStats.Medium,
    hard: acStats.Hard,
    totalSubmissions,
    acceptanceRate,
    ranking: matchedUser.profile?.ranking,
    reputation: matchedUser.profile?.reputation || 0,
    streak,
    totalActiveDays,
    contestRating: contest.rating,
    contestAttended: contest.attendedContestsCount || 0,
    calendar,
    recentSolves,
    recentSlugs: recentSolves.map((s) => s.slug).filter(Boolean),
    tagStats,
  };
};

const fetchProblemsBatch = async (limit = 50, skip = 0) => {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          title
          titleSlug
          difficulty
          topicTags { name slug }
        }
      }
    }
  `;
  const res = await leetcodeGraphql({
    query,
    variables: { categorySlug: '', skip, limit, filters: {} },
  });
  return res?.data?.problemsetQuestionList || { total: 0, questions: [] };
};

module.exports = {
  fetchUserData,
  fetchProblemsBatch,
  fetchProblemDetail,
  parseCalendar,
  parseTagStats,
};
