import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import './db.js'; // opens the database and seeds it on first run
import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import orderRoutes from './routes/orders.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { UPLOAD_DIR } from './upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Allow the Android/iOS app (and other origins) to call the API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);

// Uploaded product images — filenames are unique, so cache aggressively.
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, { immutable: true, maxAge: '30d', fallthrough: false })
);

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// In production, serve the built SPA
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '1h', index: false }));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// JSON error handler (multer + body parser + anything thrown in routes)
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || (err.message?.includes('image') ? 400 : 500);
  console.error('[api]', err.message);
  res.status(status).json({ error: err.message || 'Server error. Please try again.' });
});

app.listen(PORT, () => {
  console.log(`Burger House API running on http://localhost:${PORT}`);
});
