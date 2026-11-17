import { pool, resolveDbHostLabel, withPoolClient } from './dbPool.js';
import { runCoreSchemaMigration } from '../migrations/coreSchemaMigration.js';
import { runSeedInitialData } from '../migrations/seedInitialData.js';
import { runLegacyDataMigrations } from '../migrations/legacyDataMigrations.js';
import { runProjectHealthMigration } from '../migrations/projectHealthMigration.js';

console.log(`Connecting to PostgreSQL database host: ${resolveDbHostLabel()}`);

let activeInitPromise = null;

const initDB = async (targetPool = pool) => {
  if (targetPool === pool && activeInitPromise) {
    return activeInitPromise;
  }

  const run = async () => {
    try {
      await withPoolClient(targetPool, async (client) => {
        await runCoreSchemaMigration(client);
        await runSeedInitialData(client);
        await runLegacyDataMigrations(client);
        await runProjectHealthMigration(client);
      });
    } catch (err) {
      console.error('Error initializing database:', err.message);
      throw err;
    } finally {
      if (targetPool === pool) {
        activeInitPromise = null;
      }
    }
  };

  if (targetPool === pool) {
    activeInitPromise = run();
    return activeInitPromise;
  }
  return run();
};

let dbReady = false;

async function startWithRetry(attempt = 1) {
  try {
    await initDB();
    dbReady = true;
    console.log('✅ Database connected and initialized successfully.');
  } catch (err) {
    console.error(`⚠️  DB init attempt ${attempt} failed: ${err.message}`);
    const delayMs = Math.min(30_000, 5000 * Math.min(attempt, 6));
    console.log(`🔄 Retrying in ${delayMs / 1000} seconds...`);
    const retryTimer = setTimeout(() => startWithRetry(attempt + 1), delayMs);
    if (typeof retryTimer.unref === 'function') retryTimer.unref();
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startWithRetry();
}

export { pool, initDB, dbReady };
