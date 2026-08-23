import dotenv from 'dotenv';
dotenv.config();

import app from './server/app.js';
import { initDB } from './server/config/db.js';

const PORT = process.env.PORT || 3000;

// Start initialization with retry logic
let dbReady = false;
async function startWithRetry(attempt = 1) {
  try {
    await initDB();
    dbReady = true;
    console.log('✅ Database connected and initialized successfully.');
  } catch (err) {
    console.error(`⚠️  DB init attempt ${attempt} failed: ${err.message}`);
    console.log(`🔄 Retrying in 5 seconds...`);
    setTimeout(() => startWithRetry(attempt + 1), 5000);
  }
}
startWithRetry();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
