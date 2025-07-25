const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const db = require('./db');

// Resolve the absolute path to the frontend directory
const frontendPath = path.join(__dirname, '../../frontend');

// Check if frontend directory exists
if (!fs.existsSync(frontendPath)) {
  console.error('Frontend directory not found at:', frontendPath);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Temporarily disable CSP for development
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend directory
app.use(express.static(frontendPath));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

// Serve extension page
app.get('/extension', (req, res) => {
  res.sendFile(path.join(frontendPath, 'extension.html'));
});

// Redirect root to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Tracking pixel endpoint (public - track.brasilito.org)
app.get('/api/track/pixel/:id', async (req, res) => {
  const { id } = req.params;
  const recipient = req.query.to || 'unknown';
  const userAgent = req.get('User-Agent');
  const ipAddress = req.ip;
  const timestamp = new Date();
  
  try {
    // Update the email record to mark it as opened
    await db.query(
      `UPDATE emails 
       SET opened = true, 
           opened_at = $1, 
           user_agent = $2,
           ip_address = $3,
           updated_at = $1
       WHERE id = $4
       RETURNING *`,
      [timestamp, userAgent, ipAddress, id]
    );
    
    console.log(`📊 Pixel tracked: ${id} for ${recipient} at ${timestamp}`);
    
    // 1x1 transparent GIF
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.send(gif);
  } catch (error) {
    console.error('Error tracking pixel:', error);
    // Still return the pixel even if tracking fails
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(gif);
  }
});

// Link tracking endpoint (public - track.brasilito.org)
app.get('/api/track/link/:id', async (req, res) => {
  const { id } = req.params;
  const url = req.query.url || 'https://brasilito.org';
  const recipient = req.query.to || 'unknown';
  const userAgent = req.get('User-Agent');
  const ipAddress = req.ip;
  const timestamp = new Date();
  
  try {
    // Record the link click
    await db.query(
      `INSERT INTO link_clicks 
       (email_id, url, recipient, user_agent, ip_address, clicked_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, url, recipient, userAgent, ipAddress, timestamp]
    );
    
    console.log(`🔗 Link clicked: ${id} to ${url} for ${recipient} at ${timestamp}`);
    
    // Redirect to the original URL
    res.redirect(302, url);
  } catch (error) {
    console.error('Error tracking link click:', error);
    // Still redirect even if tracking fails
    res.redirect(302, url);
  }
});

// Recent emails endpoint
app.get('/api/emails/recent', async (req, res) => {
  try {
    // Get query parameters for pagination
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Query the database for recent emails with pagination
    const result = await db.query(
      `SELECT 
        id,
        subject,
        recipient,
        sent_at as "sentAt",
        opened,
        opened_at as "openedAt",
        user_agent as "userAgent",
        ip_address as "ipAddress",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM emails 
      ORDER BY sent_at DESC 
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    // Get total count for pagination
    const countResult = await db.query('SELECT COUNT(*) FROM emails');
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      emails: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + result.rows.length) < total
      }
    });
  } catch (error) {
    console.error('Error fetching recent emails:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent emails',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Dashboard (protected - e.brasilito.org)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dashboard.html'));
});

// Chrome extension page
app.get('/extension', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/extension.html'));
});

// API endpoint to send an email
app.post('/api/emails/send', async (req, res) => {
  const { subject, recipient, content } = req.body;
  
  if (!subject || !recipient) {
    return res.status(400).json({ error: 'Subject and recipient are required' });
  }
  
  try {
    // Generate a unique ID for this email
    const emailId = require('crypto').randomUUID();
    
    // Insert the email into the database
    const result = await db.query(
      `INSERT INTO emails 
       (id, subject, recipient, content, sent_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [emailId, subject, recipient, content || '', new Date()]
    );
    
    // Generate tracking pixel URL
    const trackingPixelUrl = `https://track.brasilito.org/api/track/pixel/${emailId}?to=${encodeURIComponent(recipient)}`;
    
    // In a real implementation, you would send the email here using a service like SendGrid, Mailgun, etc.
    console.log(`📧 Email sent to ${recipient} with ID ${emailId}`);
    console.log(`📊 Tracking pixel: ${trackingPixelUrl}`);
    
    res.status(201).json({
      id: emailId,
      subject,
      recipient,
      sentAt: new Date().toISOString(),
      trackingPixelUrl
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    // Get time range (default: last 30 days)
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total email stats
    const [
      totalEmailsResult,
      openedEmailsResult,
      recentActivityResult,
      topRecipientsResult,
      linkClicksResult
    ] = await Promise.all([
      // Total emails sent
      db.query('SELECT COUNT(*) FROM emails'),
      
      // Total emails opened
      db.query('SELECT COUNT(*) FROM emails WHERE opened = true'),
      
      // Recent activity (grouped by day)
      db.query(
        `SELECT 
          DATE(sent_at) as date,
          COUNT(*) as sent,
          COUNT(opened_at) as opened,
          COUNT(DISTINCT CASE WHEN opened = true THEN id END) as unique_opens
        FROM emails
        WHERE sent_at >= $1
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
        LIMIT 30`,
        [startDate]
      ),
      
      // Top recipients
      db.query(
        `SELECT 
          recipient,
          COUNT(*) as total_emails,
          COUNT(CASE WHEN opened = true THEN 1 END) as opened_emails,
          ROUND(COUNT(CASE WHEN opened = true THEN 1 END) * 100.0 / COUNT(*), 1) as open_rate
        FROM emails
        GROUP BY recipient
        ORDER BY total_emails DESC
        LIMIT 5`
      ),
      
      // Total link clicks
      db.query('SELECT COUNT(*) FROM link_clicks')
    ]);
    
    const totalEmails = parseInt(totalEmailsResult.rows[0].count) || 0;
    const openedEmails = parseInt(openedEmailsResult.rows[0].count) || 0;
    const totalClicks = parseInt(linkClicksResult.rows[0].count) || 0;
    const openRate = totalEmails > 0 ? (openedEmails / totalEmails) : 0;
    const clickThroughRate = totalEmails > 0 ? (totalClicks / totalEmails) : 0;
    
    // Construct the response
    res.json({
      // Summary stats
      totalEmails,
      openedEmails,
      totalClicks,
      openRate: parseFloat(openRate.toFixed(4)),
      clickThroughRate: parseFloat(clickThroughRate.toFixed(4)),
      
      // Detailed data
      recentActivity: recentActivityResult.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        sent: parseInt(row.sent) || 0,
        opened: parseInt(row.opened) || 0,
        uniqueOpens: parseInt(row.unique_opens) || 0
      })),
      
      topRecipients: topRecipientsResult.rows.map(row => ({
        recipient: row.recipient,
        totalEmails: parseInt(row.total_emails) || 0,
        openedEmails: parseInt(row.opened_emails) || 0,
        openRate: parseFloat(row.open_rate) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      totalEmails: 0,
      openedEmails: 0,
      totalClicks: 0,
      openRate: 0,
      clickThroughRate: 0,
      error: 'Failed to load statistics'
    });
  }
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
