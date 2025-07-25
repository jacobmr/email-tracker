const express = require('express');
const router = express.Router();

// Tracking pixel endpoint
router.get('/pixel/:id', (req, res) => {
  const pixelId = req.params.id;
  
  console.log(`📊 Tracking pixel opened: ${pixelId}`);
  
  // Return 1x1 transparent GIF
  const gif = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
    0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x21,
    0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
    0x01, 0x00, 0x3B
  ]);

  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': gif.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.end(gif);
});

// Link tracking endpoint
router.get('/link/:id', (req, res) => {
  const linkId = req.params.id;
  const redirectUrl = req.query.url || 'https://example.com';
  
  console.log(`🔗 Link clicked: ${linkId} -> ${redirectUrl}`);
  
  res.redirect(redirectUrl);
});

// Get tracking events
router.get('/events', (req, res) => {
  res.json({
    events: [],
    message: 'Tracking events endpoint'
  });
});

module.exports = router;
