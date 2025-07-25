const { execSync } = require('child_process');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database configuration for the application
const dbConfig = {
  user: process.env.DB_USER || 'email_tracker',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'email_tracker_password',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'email_tracker'
};

async function setupDatabase() {
  const dbName = process.env.DB_NAME || 'email_tracker';
  
  // First, try to connect to the database directly
  let pool = new Pool(dbConfig);
  let client;
  
  try {
    client = await pool.connect();
    console.log(`✅ Successfully connected to database: ${dbName}`);
  } catch (err) {
    if (err.code === '3D000') { // Database doesn't exist
      console.log(`🔄 Database ${dbName} does not exist. Creating it now...`);
      
      // Create the database using the postgres system user
      try {
        // This assumes the script is running as the postgres user or has sudo access
        const createDbCmd = `sudo -u postgres createdb -O email_tracker ${dbName}`;
        const { execSync } = require('child_process');
        execSync(createDbCmd, { stdio: 'inherit' });
        console.log(`✅ Created database: ${dbName}`);
        
        // Reconnect to the new database
        pool = new Pool(dbConfig);
        client = await pool.connect();
      } catch (createErr) {
        console.error('❌ Failed to create database:', createErr.message);
        console.error('Please create the database manually with:');
        console.error(`  sudo -u postgres createdb -O email_tracker ${dbName}`);
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to connect to PostgreSQL server');
      console.error('Please check your database configuration and ensure it is running');
      console.error('Error:', err.message);
      process.exit(1);
    }
  }

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
