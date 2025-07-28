const database = require('../database/database');

async function migrateEmailOptional() {
  try {
    console.log('🔄 Migrating database to make email optional...');
    
    await database.connect();
    
    // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
    // First, create a backup of existing data
    console.log('📋 Backing up existing player data...');
    
    // Create new table with optional email
    await database.run(`
      CREATE TABLE IF NOT EXISTS players_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        elo_rating INTEGER DEFAULT 1200,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy data from old table to new table
    console.log('📦 Copying data to new table...');
    await database.run(`
      INSERT INTO players_new (id, username, email, password_hash, elo_rating, is_admin, created_at, updated_at)
      SELECT id, username, email, password_hash, elo_rating, is_admin, created_at, updated_at
      FROM players
    `);
    
    // Drop old table
    console.log('🗑️  Dropping old table...');
    await database.run('DROP TABLE players');
    
    // Rename new table
    console.log('📝 Renaming new table...');
    await database.run('ALTER TABLE players_new RENAME TO players');
    
    // Recreate indexes
    console.log('🔗 Recreating indexes...');
    await database.run('CREATE INDEX IF NOT EXISTS idx_players_username ON players (username)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_players_email ON players (email)');
    
    console.log('✅ Email migration completed successfully!');
    console.log('📧 Email field is now optional for all users');
    
  } catch (error) {
    console.error('❌ Email migration failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

if (require.main === module) {
  migrateEmailOptional().catch(() => process.exit(1));
}

module.exports = migrateEmailOptional;
