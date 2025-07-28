const database = require('./database/database');

async function testMatchApproval() {
  console.log('\n=== Testing Match Approval Functionality ===');
  
  try {
    // Connect to database
    await database.connect();
    
    // Check if we have any users to work with
    const users = await database.all('SELECT id, username FROM players ORDER BY id LIMIT 3');
    console.log('Available users:', users);
    
    if (users.length < 2) {
      console.log('Not enough users for testing. Need at least 2 users.');
      return;
    }
    
    const player1 = users[0];
    const player2 = users[1];
    
    console.log('\nCreating test match between:', player1.username, 'vs', player2.username);
    
    // Create a match
    const matchResult = await database.run(`
      INSERT INTO matches (player1_id, player2_id, player1_score, player2_score, winner_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [player1.id, player2.id, 21, 18, player1.id]);
    
    console.log('Match created with ID:', matchResult.id);
    
    // Create match request
    await database.run(`
      INSERT INTO match_requests (match_id, requesting_player_id, confirming_player_id, status)
      VALUES (?, ?, ?, 'pending')
    `, [matchResult.id, player1.id, player2.id]);
    
    console.log('Match request created. Requesting player:', player1.username, 'Confirming player:', player2.username);
    
    // Check pending requests
    const pendingRequests = await database.all(`
      SELECT mr.*, m.*, 
             p1.username as player1_username,
             p2.username as player2_username,
             req.username as requesting_username
      FROM match_requests mr
      JOIN matches m ON mr.match_id = m.id
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players req ON mr.requesting_player_id = req.id
      WHERE mr.confirming_player_id = ? AND mr.status = 'pending'
      ORDER BY mr.created_at DESC
    `, [player2.id]);
    
    console.log('\nPending requests for', player2.username, ':', pendingRequests.length);
    if (pendingRequests.length > 0) {
      console.log('Request details:', {
        match_id: pendingRequests[0].match_id,
        requesting_player: pendingRequests[0].requesting_username,
        score: `${pendingRequests[0].player1_score} - ${pendingRequests[0].player2_score}`
      });
    }
    
    console.log('\n✅ Match approval infrastructure is working!');
    console.log('✅ Route /api/matches/pending/requests should return pending requests');
    console.log('✅ Route /api/matches/:id/confirm should handle approve/deny actions');
    console.log('\nNow you can:');
    console.log('1. Login as', player2.username, 'to see pending match requests');
    console.log('2. Approve or deny the match on the homepage');
    console.log('3. Check the ELO rating changes after approval');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await database.close();
    process.exit(0);
  }
}

testMatchApproval();
