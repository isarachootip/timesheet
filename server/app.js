import express from 'express';
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
import noteRoutes from './routes/noteRoutes.js';

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
app.use(noteRoutes);

// Catch all for frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

export default app;
