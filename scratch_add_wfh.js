import { pool } from './server/config/db.js';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS is_wfh BOOLEAN DEFAULT FALSE');
    console.log('Successfully added is_wfh column to timesheets table.');
  } catch (err) {
    console.error('Failed to add is_wfh column:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
