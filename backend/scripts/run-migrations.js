const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres', // Default user for local development
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'email_tracker',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        run_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migrations that have already been run
    const result = await client.query('SELECT name FROM migrations');
    const completedMigrations = new Set(result.rows.map(row => row.name));
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure they run in order
    
    let migrationsRun = 0;
    
    // Run each migration that hasn't been run yet
    for (const file of migrationFiles) {
      if (!completedMigrations.has(file)) {
        console.log(`Running migration: ${file}`);
        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(migrationSQL);
        
        // Record that we ran this migration
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        migrationsRun++;
        console.log(`✅ Migration ${file} completed successfully`);
      }
    }
    
    await client.query('COMMIT');
    
    if (migrationsRun === 0) {
      console.log('No new migrations to run');
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migration(s)`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
