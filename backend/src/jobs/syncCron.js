const cron = require('node-cron');
const { syncAllActiveStudents, syncProblemCache } = require('../services/sync.service');

const startSyncCron = () => {
  const hours = parseInt(process.env.SYNC_INTERVAL_HOURS, 10) || 6;
  const cronExpr = `0 */${hours} * * *`;

  cron.schedule(cronExpr, async () => {
    console.log('[cron] Starting scheduled student sync...');
    try {
      const result = await syncAllActiveStudents();
      console.log(`[cron] Synced ${result.synced} students`);
    } catch (err) {
      console.error('[cron] Sync failed:', err.message);
    }
  });

  cron.schedule('0 3 * * 0', async () => {
    console.log('[cron] Refreshing problem cache...');
    try {
      const result = await syncProblemCache(20);
      console.log(`[cron] Cached ${result.cached} problems`);
    } catch (err) {
      console.error('[cron] Problem cache sync failed:', err.message);
    }
  });

  console.log(`Sync cron scheduled every ${hours} hours`);
};

module.exports = { startSyncCron };
