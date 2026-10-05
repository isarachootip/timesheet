import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  const tsRes = await client.query("SELECT * FROM timesheets WHERE user_id = 'u_1781089080824' ORDER BY date DESC LIMIT 3");
  
  const serialized = tsRes.rows.map(ts => ({
    id: ts.id,
    userId: ts.user_id,
    projectId: ts.project_id,
    taskId: ts.task_id,
    date: ts.date,
    hours: parseFloat(ts.hours || '0'),
    description: ts.description,
    status: ts.status
  }));

  console.log('JSON serialized payload:');
  console.log(JSON.stringify(serialized, null, 2));

  client.release();
  await pool.end();
}

main().catch(console.error);
