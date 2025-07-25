import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the tracking router
import { router as trackingRouter } from './routes/tracking.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/track', trackingRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));

// API Root route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Email Tracker API',
    version: '1.0.0',
    endpoints: [
      '/api/track/pixel/:id',
      '/api/track/link/:id',
      '/health',
      '/dashboard'
    ]
  });
});

// Serve dashboard.html as the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dashboard.html'));
});

// Serve extension page
app.get('/extension', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/extension.html'));
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Email Tracker API running on port ${PORT}`);
  console.log(`📊 Tracking endpoints available at:`);
  console.log(`   - http://localhost:${PORT}/api/track/pixel/:id`);
  console.log(`   - http://localhost:${PORT}/api/track/link/:id`);
  console.log(`   - http://localhost:${PORT}/health`);
});
