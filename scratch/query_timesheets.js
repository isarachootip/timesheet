import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  
  // Find user Jitpanu
  const userRes = await client.query("SELECT id, name FROM users WHERE name LIKE '%Jitpanu%'");
  console.log('Jitpanu User:', userRes.rows);
  
  if (userRes.rows.length > 0) {
    const userId = userRes.rows[0].id;
    const tsRes = await client.query("SELECT id, user_id, date, hours, description FROM timesheets WHERE user_id = $1 ORDER BY date DESC LIMIT 20", [userId]);
    console.log('Jitpanu Timesheets:');
    tsRes.rows.forEach(r => {
      console.log(`ID: ${r.id} | Date: ${r.date} | Type of Date: ${typeof r.date} | Hours: ${r.hours} | Desc: ${r.description}`);
      if (r.date instanceof Date) {
        console.log(`  ISOString: ${r.date.toISOString()} | LocalString: ${r.date.toString()}`);
      }
    });
  }

  client.release();
  await pool.end();
}

main().catch(console.error);
