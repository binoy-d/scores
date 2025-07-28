const database = require('../database/database');

async function removeEmailColumn() {
  try {
    console.log('🔄 Removing email column from database...');
    
    await database.connect();
    
    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    console.log('📋 Backing up existing player data...');
    
    // Create new table without email
    await database.run(`
      CREATE TABLE IF NOT EXISTS players_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        elo_rating INTEGER DEFAULT 1200,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copy data from old table to new table (excluding email)
    console.log('📦 Copying data to new table without email...');
    await database.run(`
      INSERT INTO players_new (id, username, password_hash, elo_rating, is_admin, created_at, updated_at)
      SELECT id, username, password_hash, elo_rating, is_admin, created_at, updated_at
      FROM players
    `);
    
    // Drop old table
    console.log('🗑️  Dropping old table...');
    await database.run('DROP TABLE players');
    
    // Rename new table
    console.log('📝 Renaming new table...');
    await database.run('ALTER TABLE players_new RENAME TO players');
    
    // Recreate indexes (without email index)
    console.log('🔗 Recreating indexes...');
    await database.run('CREATE INDEX IF NOT EXISTS idx_players_username ON players (username)');
    
    console.log('✅ Email column removal completed successfully!');
    console.log('📧 Email field has been completely removed from the system');
    
  } catch (error) {
    console.error('❌ Email removal migration failed:', error);
    throw error;
  } finally {
    await database.close();
  }
}

if (require.main === module) {
  removeEmailColumn().catch(() => process.exit(1));
}

module.exports = removeEmailColumn;
