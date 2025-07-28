const bcrypt = require('bcryptjs');
const database = require('../database/database');

async function addTestUser() {
  try {
    await database.connect();
    
    // Check if testlogin user exists
    const existing = await database.get('SELECT id FROM players WHERE username = ?', ['testlogin']);
    
    if (!existing) {
      const hashedPassword = await bcrypt.hash('test', 12);
      await database.run(
        'INSERT INTO players (username, password_hash, elo_rating) VALUES (?, ?, ?)',
        ['testlogin', hashedPassword, 1200]
      );
      console.log('✅ Test user created: username=testlogin, password=test');
    } else {
      console.log('ℹ️  Test user already exists');
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await database.close();
  }
}

addTestUser();
