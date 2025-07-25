const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const trackingRouter = require('./routes/tracking');

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

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Email Tracker API',
    version: '1.0.0',
    endpoints: [
      '/api/track/pixel/:id',
      '/api/track/link/:id',
      '/health'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
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
