const { execSync } = require('child_process');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database configuration for initial connection (using postgres superuser)
const adminConfig = {
  user: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: 'your_secure_password', // This should match the password set for the postgres user
  port: process.env.DB_PORT || 5432,
  database: 'postgres' // Connect to default postgres database first
};

// Application database configuration
const dbConfig = {
  user: process.env.DB_USER || 'email_tracker',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'email_tracker_password',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'email_tracker'
};

async function setupDatabase() {
  // First connect as postgres user to create the database if it doesn't exist
  const adminPool = new Pool(adminConfig);
  const adminClient = await adminPool.connect().catch(err => {
    console.error('❌ Failed to connect to PostgreSQL server as postgres user');
    console.error('Please make sure PostgreSQL is running and the postgres user password is correct');
    console.error('Error:', err.message);
    process.exit(1);
  });

  try {
    console.log('✅ Connected to PostgreSQL server as postgres user');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'email_tracker';
    const dbCheck = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1', 
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`🔄 Creating database: ${dbName}`);
      // Create the database with the email_tracker user as owner
      await adminClient.query(`CREATE DATABASE ${dbName} OWNER email_tracker`);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`✅ Database exists: ${dbName}`);
    }
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    process.exit(1);
  } finally {
    await adminClient.release();
    await adminPool.end();
  }

  // Now connect as the application user to run migrations
  const pool = new Pool(dbConfig);
  const client = await pool.connect().catch(err => {
    console.error('❌ Failed to connect to PostgreSQL server as application user');
    console.error('Please check the database user credentials in your .env file');
    console.error('Error:', err.message);
    process.exit(1);
  });
  
  console.log(`✅ Connected to database ${dbConfig.database} as user ${dbConfig.user}`);

  try {
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'email_tracker';
    const dbCheck = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1', 
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`🔄 Creating database: ${dbName}`);
      // Create the database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Created database: ${dbName}`);
    } else {
      console.log(`✅ Database exists: ${dbName}`);
    }

    // Close the connection to the default database
    await client.release();
    await pool.end();

    // Now connect to the application database
    const appDbConfig = { ...dbConfig, database: dbName };
    const appPool = new Pool(appDbConfig);
    const appClient = await appPool.connect().catch(err => {
      console.error(`❌ Failed to connect to database: ${dbName}`);
      console.error('Error:', err.message);
      process.exit(1);
    });

    try {
      console.log(`✅ Connected to database: ${dbName}`);
      
      // Run migrations
      console.log('🔄 Running migrations...');
      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      // Create migrations table if it doesn't exist
      await appClient.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          run_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Get completed migrations
      const completedMigrations = await appClient.query('SELECT name FROM migrations');
      const completedMigrationNames = new Set(completedMigrations.rows.map(row => row.name));
      
      // Run new migrations
      for (const file of migrationFiles) {
        if (!completedMigrationNames.has(file)) {
          console.log(`  🔄 Running migration: ${file}`);
          const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          
          // Run in a transaction
          await appClient.query('BEGIN');
          try {
            await appClient.query(migrationSQL);
            await appClient.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
            await appClient.query('COMMIT');
            console.log(`  ✅ Applied migration: ${file}`);
          } catch (err) {
            await appClient.query('ROLLBACK');
            console.error(`  ❌ Failed to apply migration ${file}:`, err.message);
            throw err;
          }
        }
      }
      
      console.log('✅ All migrations completed successfully');
      
    } finally {
      await appClient.release();
      await appPool.end();
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);
