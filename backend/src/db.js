const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'email_tracker',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'email_tracker',
  password: process.env.DB_PASSWORD || 'email_tracker_password',
  port: process.env.DB_PORT || 5432,
});

// Test the database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
