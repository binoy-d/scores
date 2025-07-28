const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authenticateToken } = require('../utils/auth');
const EloCalculator = require('../utils/eloCalculator');

const router = express.Router();
const eloCalc = new EloCalculator();

// Validation middleware
const validateMatch = [
  body('opponent_id').isInt({ min: 1 }).withMessage('Valid opponent ID is required'),
  body('player_score').isInt({ min: 0 }).withMessage('Valid player score is required'),
  body('opponent_score').isInt({ min: 0 }).withMessage('Valid opponent score is required')
];

/**
 * POST /api/matches
 * Create a new match (requires confirmation from opponent)
 */
router.post('/', authenticateToken, validateMatch, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { opponent_id, player_score, opponent_score } = req.body;
    const requesting_player_id = req.user.id;

    // Validate that player isn't playing against themselves
    if (requesting_player_id === opponent_id) {
      return res.status(400).json({ error: 'Cannot create match against yourself' });
    }

    // Validate that opponent exists
    const opponent = await database.get('SELECT id FROM players WHERE id = ?', [opponent_id]);
    if (!opponent) {
      return res.status(404).json({ error: 'Opponent not found' });
    }

    // Determine winner
    let winner_id;
    if (player_score > opponent_score) {
      winner_id = requesting_player_id;
    } else if (opponent_score > player_score) {
      winner_id = opponent_id;
    } else {
      return res.status(400).json({ error: 'Matches cannot end in a tie in ping pong' });
    }

    // Create match
    const matchResult = await database.run(`
      INSERT INTO matches (player1_id, player2_id, player1_score, player2_score, winner_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [requesting_player_id, opponent_id, player_score, opponent_score, winner_id]);

    // Create match request
    await database.run(`
      INSERT INTO match_requests (match_id, requesting_player_id, confirming_player_id, status)
      VALUES (?, ?, ?, 'pending')
    `, [matchResult.id, requesting_player_id, opponent_id]);

    // Get the created match with player info
    const match = await database.get(`
      SELECT m.*, 
             p1.username as player1_username,
             p2.username as player2_username,
             w.username as winner_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [matchResult.id]);

    res.status(201).json({
      message: 'Match created successfully. Waiting for opponent confirmation.',
      match
    });

  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

/**
 * PUT /api/matches/:id/confirm
 * Confirm or deny a match request
 */
router.put('/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { action } = req.body; // 'approve' or 'deny'
    const confirmingPlayerId = req.user.id;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "deny"' });
    }

    // Get match request
    const matchRequest = await database.get(`
      SELECT mr.*, m.*
      FROM match_requests mr
      JOIN matches m ON mr.match_id = m.id
      WHERE mr.match_id = ? AND mr.confirming_player_id = ? AND mr.status = 'pending'
    `, [matchId, confirmingPlayerId]);

    if (!matchRequest) {
      return res.status(404).json({ error: 'Match request not found or already processed' });
    }

    if (action === 'deny') {
      // Update match request and match status
      await Promise.all([
        database.run(`
          UPDATE match_requests 
          SET status = 'denied', responded_at = CURRENT_TIMESTAMP 
          WHERE match_id = ? AND confirming_player_id = ?
        `, [matchId, confirmingPlayerId]),
        database.run(`
          UPDATE matches 
          SET status = 'denied' 
          WHERE id = ?
        `, [matchId])
      ]);

      return res.json({ message: 'Match request denied' });
    }

    // Approve match - calculate ELO changes
    const [player1, player2] = await Promise.all([
      database.get('SELECT id, elo_rating FROM players WHERE id = ?', [matchRequest.player1_id]),
      database.get('SELECT id, elo_rating FROM players WHERE id = ?', [matchRequest.player2_id])
    ]);

    const eloResults = eloCalc.calculateNewRatings(
      player1.elo_rating,
      player2.elo_rating,
      matchRequest.player1_score,
      matchRequest.player2_score
    );

    // Update all records atomically
    await Promise.all([
      // Update match status
      database.run(`
        UPDATE matches 
        SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [matchId]),
      
      // Update match request
      database.run(`
        UPDATE match_requests 
        SET status = 'approved', responded_at = CURRENT_TIMESTAMP 
        WHERE match_id = ? AND confirming_player_id = ?
      `, [matchId, confirmingPlayerId]),
      
      // Update player ELO ratings
      database.run(`
        UPDATE players 
        SET elo_rating = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [eloResults.player1.newRating, player1.id]),
      
      database.run(`
        UPDATE players 
        SET elo_rating = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [eloResults.player2.newRating, player2.id])
    ]);

    // Get updated match with player info
    const confirmedMatch = await database.get(`
      SELECT m.*, 
             p1.username as player1_username, p1.elo_rating as player1_elo,
             p2.username as player2_username, p2.elo_rating as player2_elo,
             w.username as winner_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [matchId]);

    res.json({
      message: 'Match confirmed successfully',
      match: confirmedMatch,
      eloChanges: {
        [player1.id]: eloResults.player1,
        [player2.id]: eloResults.player2
      }
    });

  } catch (error) {
    console.error('Confirm match error:', error);
    res.status(500).json({ error: 'Failed to confirm match' });
  }
});

/**
 * GET /api/matches/pending/requests
 * Get pending match requests for current user
 */
router.get('/pending/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

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
    `, [userId]);

    res.json({ pendingRequests });

  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
});

/**
 * GET /api/matches
 * Get matches with pagination and filtering
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || 'confirmed';
    const playerId = req.query.player_id ? parseInt(req.query.player_id) : null;

    let query = `
      SELECT m.*, 
             p1.username as player1_username,
             p2.username as player2_username,
             w.username as winner_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE m.status = ?
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM matches WHERE status = ?';
    let params = [status];

    if (playerId) {
      query += ' AND (m.player1_id = ? OR m.player2_id = ?)';
      countQuery += ' AND (player1_id = ? OR player2_id = ?)';
      params.push(playerId, playerId);
    }

    query += ' ORDER BY COALESCE(m.confirmed_at, m.created_at) DESC LIMIT ? OFFSET ?';
    const queryParams = [...params, limit, offset];

    const [matches, countResult] = await Promise.all([
      database.all(query, queryParams),
      database.get(countQuery, params)
    ]);

    res.json({
      matches,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

/**
 * GET /api/matches/:id
 * Get specific match by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);

    const match = await database.get(`
      SELECT m.*, 
             p1.username as player1_username, p1.elo_rating as player1_elo,
             p2.username as player2_username, p2.elo_rating as player2_elo,
             w.username as winner_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Get match request info if pending
    if (match.status === 'pending') {
      const matchRequest = await database.get(`
        SELECT mr.*, req.username as requesting_username, conf.username as confirming_username
        FROM match_requests mr
        JOIN players req ON mr.requesting_player_id = req.id
        JOIN players conf ON mr.confirming_player_id = conf.id
        WHERE mr.match_id = ?
      `, [matchId]);

      match.request_info = matchRequest;
    }

    res.json({ match });

  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to get match' });
  }
});

/**
 * DELETE /api/matches/:id
 * Delete a pending match (only by creator)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId = req.user.id;

    // Check if match exists and is pending
    const match = await database.get(`
      SELECT m.*, mr.requesting_player_id
      FROM matches m
      JOIN match_requests mr ON m.id = mr.match_id
      WHERE m.id = ? AND m.status = 'pending'
    `, [matchId]);

    if (!match) {
      return res.status(404).json({ error: 'Pending match not found' });
    }

    // Check if user is the creator or admin
    if (match.requesting_player_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete match and associated request
    await Promise.all([
      database.run('DELETE FROM match_requests WHERE match_id = ?', [matchId]),
      database.run('DELETE FROM matches WHERE id = ?', [matchId])
    ]);

    res.json({ message: 'Match deleted successfully' });

  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

module.exports = router;
