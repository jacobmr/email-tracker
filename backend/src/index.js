const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tracking pixel endpoint (public - track.brasilito.org)
app.get('/api/track/pixel/:id', (req, res) => {
  const { id } = req.params;
  const recipient = req.query.to || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`📊 Pixel tracked: ${id} for ${recipient} at ${timestamp}`);
  
  // 1x1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(gif);
});

// Link tracking endpoint (public - track.brasilito.org)
app.get('/api/track/link/:id', (req, res) => {
  const { id } = req.params;
  const url = req.query.url || 'https://brasilito.org';
  const recipient = req.query.to || 'unknown';
  const timestamp = new Date().toISOString();
  
  console.log(`🔗 Link clicked: ${id} to ${url} for ${recipient} at ${timestamp}`);
  
  res.redirect(302, url);
});

// Recent emails endpoint
app.get('/api/emails/recent', (req, res) => {
  // Mock data - replace with database
  const mockEmails = [
    {
      id: '1',
      subject: 'Welcome to Email Tracker',
      recipient: 'test@example.com',
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      opened: true,
      openedAt: new Date(Date.now() - 3600000).toISOString(),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    {
      id: '2',
      subject: 'Product Update',
      recipient: 'demo@example.com',
      sentAt: new Date(Date.now() - 172800000).toISOString(),
      opened: false,
      openedAt: null,
      userAgent: null
    }
  ];
  
  res.json(mockEmails);
});

// Dashboard (protected - e.brasilito.org)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dashboard.html'));
});

// Chrome extension page
app.get('/extension', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/extension.html'));
});

// API endpoints for dashboard
app.get('/api/stats', (req, res) => {
  const mockStats = {
    total: 127,
    opened: 89,
    notOpened: 38,
    openRate: 70
  };
  res.json(mockStats);
});

// Serve static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Serve dashboard files
app.use('/dashboard', express.static(path.join(__dirname, '../../frontend')));
app.use('/extension', express.static(path.join(__dirname, '../../frontend')));

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
  console.log(`🚀 Email tracker server running on port ${PORT}`);
  console.log(`📊 Tracking endpoints: track.brasilito.org/api/track/*`);
  console.log(`🎯 Dashboard: e.brasilito.org/dashboard`);
  console.log(`🔧 Extension: e.brasilito.org/extension`);
});
