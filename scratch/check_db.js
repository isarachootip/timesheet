import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const countRes = await pool.query('SELECT count(*) FROM tasks WHERE project_id = \'p_1783325978838\'');
    console.log('Total tasks in database for 3cx_voicebot:', countRes.rows[0].count);

    // Let's print a few imported tasks to see if their fields are perfectly populated
    const sampleImported = await pool.query('SELECT title, status, start_date, end_date, parent_id FROM tasks WHERE project_id = \'p_1783325978838\' AND id LIKE \'%1787304245072%\' LIMIT 5');
    console.log('Sample imported tasks:', sampleImported.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
