const bcrypt = require('bcryptjs');
const database = require('../database/database');

async function updateTestUserPassword() {
  try {
    await database.connect();
    
    // Hash the password "test"
    const hashedPassword = await bcrypt.hash('test', 12);
    
    // Update the test user's password
    const result = await database.run(
      'UPDATE players SET password_hash = ? WHERE username = ?',
      [hashedPassword, 'test']
    );
    
    if (result.changes > 0) {
      console.log('✅ Test user password updated successfully!');
      console.log('🔑 You can now login with: username=test, password=test');
    } else {
      console.log('❌ Test user not found');
    }
    
  } catch (error) {
    console.error('❌ Error updating test user password:', error);
  } finally {
    await database.close();
  }
}

updateTestUserPassword();
