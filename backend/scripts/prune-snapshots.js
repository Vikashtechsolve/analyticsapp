/**
 * One-time cleanup for existing StudentSnapshot bloat.
 *
 * Usage (from leetcode/backend):
 *   node scripts/prune-snapshots.js
 *
 * Env (optional):
 *   SNAPSHOT_RETENTION_DAYS=45
 *   SNAPSHOT_MAX_PER_STUDENT=45
 */
require('dotenv').config();
const connectDB = require('../src/config/db');
const { pruneAllSnapshots } = require('../src/services/snapshot-retention.service');
const { StudentSnapshot } = require('../src/models');

const main = async () => {
  await connectDB();

  const before = await StudentSnapshot.countDocuments();
  console.log(`Snapshots before prune: ${before}`);

  const result = await pruneAllSnapshots();
  const after = await StudentSnapshot.countDocuments();

  console.log(`Deleted: ${result.deleted}`);
  console.log(`Snapshots after prune: ${after}`);
  console.log(
    `Retention: ${result.retentionDays} days, max ${result.maxPerStudent} per student`
  );
  console.log('Done. Consider compacting your MongoDB volume if using Atlas Free tier.');
  process.exit(0);
};

main().catch((err) => {
  console.error('Prune failed:', err);
  process.exit(1);
});
