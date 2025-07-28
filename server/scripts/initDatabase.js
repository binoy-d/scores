const database = require('../database/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing SVIC Scores database...');
    
    await database.connect();
    await database.initializeTables();
    
    // Create default admin user
    const adminExists = await database.get(
      'SELECT id FROM players WHERE username = ?', 
      ['admin']
    );
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await database.run(
        `INSERT INTO players (username, password_hash, is_admin, elo_rating) 
         VALUES (?, ?, ?, ?)`,
        ['admin', hashedPassword, 1, 1500]
      );
      console.log('👤 Default admin user created (username: admin, password: admin123)');
    }
    
    // Create some sample players for testing
    const samplePlayers = [
      { username: 'alice', elo: 1250 },
      { username: 'bob', elo: 1180 },
      { username: 'charlie', elo: 1320 },
      { username: 'diana', elo: 1150 }
    ];
    
    for (const player of samplePlayers) {
      const exists = await database.get(
        'SELECT id FROM players WHERE username = ?', 
        [player.username]
      );
      
      if (!exists) {
        const hashedPassword = await bcrypt.hash('password123', 12);
        await database.run(
          `INSERT INTO players (username, password_hash, elo_rating) 
           VALUES (?, ?, ?)`,
          [player.username, hashedPassword, player.elo]
        );
        console.log(`👤 Sample player created: ${player.username}`);
      }
    }
    
    console.log('✅ Database initialization complete!');
    console.log('📊 SVIC Scores database is ready for use');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
