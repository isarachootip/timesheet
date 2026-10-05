import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  const tsRes = await client.query("SELECT * FROM timesheets");
  
  // Map timesheets like Express backend does, then serialize to JSON and parse back to simulate frontend receiving JSON
  const timesheets = JSON.parse(JSON.stringify(tsRes.rows.map(ts => ({
    id: ts.id,
    userId: ts.user_id,
    projectId: ts.project_id,
    taskId: ts.task_id,
    date: ts.date,
    hours: parseFloat(ts.hours || '0'),
    description: ts.description,
    status: ts.status
  }))));

  const activePersonalUser = 'u_1781089080824'; // Jitpanu
  const selectedMonth = '2026-08';

  const personalTimesheets = timesheets.filter(ts => {
    return ts.userId === activePersonalUser && ts.date.slice(0, 7) === selectedMonth;
  });

  console.log(`Total timesheets for month ${selectedMonth}: ${personalTimesheets.length}`);

  const daysInMonthArray = Array.from({ length: 31 }, (_, i) => i + 1);
  
  daysInMonthArray.forEach(day => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const matched = personalTimesheets.filter(ts => ts.date.startsWith(dateStr));
    const dayHours = matched.reduce((s, ts) => s + ts.hours, 0);
    if (dayHours > 0) {
      console.log(`Day: ${day} | DateStr: ${dateStr} | DayHours: ${dayHours} | Matched Count: ${matched.length}`);
      matched.forEach(m => {
        console.log(`  - Entry ID: ${m.id} | Date: ${m.date} | Hours: ${m.hours}`);
      });
    }
  });

  client.release();
  await pool.end();
}

main().catch(console.error);
