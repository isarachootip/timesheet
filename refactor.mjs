import fs from 'fs';
import path from 'path';

const serverJsPath = 'server.js';
const content = fs.readFileSync(serverJsPath, 'utf8');

function extract(startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) throw new Error(`Marker not found: ${startMarker}`);
  const end = endMarker ? content.indexOf(endMarker, start) : content.length;
  if (end === -1) throw new Error(`Marker not found: ${endMarker}`);
  return content.slice(start, end);
}

// 1. Create directories
if (!fs.existsSync('server')) fs.mkdirSync('server');
if (!fs.existsSync('server/config')) fs.mkdirSync('server/config');
if (!fs.existsSync('server/routes')) fs.mkdirSync('server/routes');

// 2. Extract DB
const dbContent = `import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

${extract('// Database Connection', '// --- API Endpoints ---')}

export { pool, initDB, dbReady };
`;
fs.writeFileSync('server/config/db.js', dbContent);

// 3. Extract Routes
const authRoutes = `import express from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

${extract('// LINE OAuth Authentication', '// Chatbot API Endpoint').replace(/app\./g, 'router.')}
${extract('// Password Authentication Endpoint', '// ==========================================').replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/authRoutes.js', authRoutes);

const chatRoutes = `import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

${extract('// Chatbot API Endpoint', '// Password Authentication Endpoint').replace(/app\./g, 'router.')}
${extract('// Project Messages API (Chat)', '// File Upload API').replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/chatRoutes.js', chatRoutes);

const userRoutes = `import express from 'express';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const router = express.Router();

${extract('// Users REST API', '// Projects REST API').replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/userRoutes.js', userRoutes);

const projectRoutes = `import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

${extract('// Project Baselines & Versioning API', '// Health check').replace(/app\./g, 'router.')}
${extract('// Projects REST API', '// --- Permission and Workflow Validation Helpers ---').replace(/app\./g, 'router.')}
${extract('// --- Permission and Workflow Validation Helpers ---', '// Tasks REST API')}
${extract('// Project Workflows API', '// Task Commits API').replace(/app\./g, 'router.')}

export default router;
export { checkPermission, validateTransition };
`;
fs.writeFileSync('server/routes/projectRoutes.js', projectRoutes);

const taskRoutes = `import express from 'express';
import { pool } from '../config/db.js';
import { checkPermission, validateTransition } from './projectRoutes.js';

const router = express.Router();

${extract('// Tasks REST API', '// Sprints REST API').replace(/app\./g, 'router.')}
${extract('// Sprints REST API', '// Releases REST API').replace(/app\./g, 'router.')}
${extract('// Releases REST API', '// Permission Schemes API').replace(/app\./g, 'router.')}
${extract('// Task Commits API', '// Project Messages API (Chat)').replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/taskRoutes.js', taskRoutes);

const timesheetRoutes = `import express from 'express';
import { pool } from '../config/db.js';
import { sendEmail } from '../../mailService.js';

const router = express.Router();

${extract('// Timesheets REST API', '// Task Templates REST API').replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/timesheetRoutes.js', timesheetRoutes);

const systemRoutes = `import express from 'express';
import { pool } from '../config/db.js';

const router = express.Router();

${extract('// Permission Schemes API', '// Project Workflows API').replace(/app\./g, 'router.')}
${extract('// Task Templates REST API', '// Cost Rates REST API').replace(/app\./g, 'router.')}
${extract('// Cost Rates REST API', '// --- System Settings API ---').replace(/app\./g, 'router.')}
${extract('// --- System Settings API ---', '// DB Connection Diagnostics API').replace(/app\./g, 'router.')}
${extract('// DB Connection Diagnostics API', '// Clean / Reset Tasks Data API (Admin Only)').replace(/app\./g, 'router.')}
${extract('// Clean / Reset Tasks Data API (Admin Only)', "app.get('/api/user-manual'").replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/systemRoutes.js', systemRoutes);

const generalRoutes = `import express from 'express';
import { pool, dbReady } from '../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

${extract('// Health check', '// Initial load').replace(/app\./g, 'router.')}
${extract('// Initial load', '// Users REST API').replace(/app\./g, 'router.')}
${extract('// File Upload API', '// Helper for Processing Webhook Commits').replace(/app\./g, 'router.')}
${extract('// Helper for Processing Webhook Commits', '// Timesheets REST API').replace(/app\./g, 'router.')}
${extract('app.get(\'/api/user-manual\'', '// Using app.use instead of app.get').replace(/app\./g, 'router.')}

export default router;
`;
fs.writeFileSync('server/routes/generalRoutes.js', generalRoutes);

// 4. Create app.js
const appJsContent = `import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import timesheetRoutes from './routes/timesheetRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import generalRoutes from './routes/generalRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

app.use(express.static(path.join(__dirname, '../dist'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    } else {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use(authRoutes);
app.use(userRoutes);
app.use(projectRoutes);
app.use(taskRoutes);
app.use(timesheetRoutes);
app.use(chatRoutes);
app.use(systemRoutes);
app.use(generalRoutes);

// Catch all for frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

export default app;
`;
fs.writeFileSync('server/app.js', appJsContent);

// 5. Replace server.js
const newServerJsContent = `import dotenv from 'dotenv';
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
    console.error(\`⚠️  DB init attempt \${attempt} failed: \${err.message}\`);
    console.log(\`🔄 Retrying in 5 seconds...\`);
    setTimeout(() => startWithRetry(attempt + 1), 5000);
  }
}
startWithRetry();

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`;
fs.writeFileSync('server.js', newServerJsContent);

console.log("Refactoring complete! The server.js has been split modularly.");
