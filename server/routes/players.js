const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/database');
const { authenticateToken, requireAdmin } = require('../utils/auth');

const router = express.Router();

// Validation middleware
const validatePlayer = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

/**
 * GET /api/players
 * Get all players with pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT id, username, email, elo_rating, is_admin, created_at,
             (SELECT COUNT(*) FROM matches WHERE player1_id = players.id OR player2_id = players.id AND status = 'confirmed') as total_matches,
             (SELECT COUNT(*) FROM matches WHERE winner_id = players.id AND status = 'confirmed') as wins
      FROM players
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM players';
    let params = [];

    if (search) {
      query += ' WHERE username LIKE ? OR email LIKE ?';
      countQuery += ' WHERE username LIKE ? OR email LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY elo_rating DESC LIMIT ? OFFSET ?';
    const queryParams = [...params, limit, offset];

    const [players, countResult] = await Promise.all([
      database.all(query, queryParams),
      database.get(countQuery, params)
    ]);

    // Calculate additional stats
    const playersWithStats = players.map(player => ({
      ...player,
      losses: player.total_matches - player.wins,
      winRate: player.total_matches > 0 ? (player.wins / player.total_matches * 100).toFixed(1) : '0.0'
    }));

    res.json({
      players: playersWithStats,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Failed to get players' });
  }
});

/**
 * GET /api/players/:id
 * Get specific player by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);

    const player = await database.get(`
      SELECT p.id, p.username, p.email, p.elo_rating, p.is_admin, p.created_at,
             COUNT(DISTINCT m.id) as total_matches,
             COUNT(DISTINCT CASE WHEN m.winner_id = p.id THEN m.id END) as wins
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      WHERE p.id = ?
      GROUP BY p.id
    `, [playerId]);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get recent matches
    const recentMatches = await database.all(`
      SELECT m.*, 
             p1.username as player1_username,
             p2.username as player2_username,
             w.username as winner_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.status = 'confirmed'
      ORDER BY m.confirmed_at DESC
      LIMIT 10
    `, [playerId, playerId]);

    const playerStats = {
      ...player,
      losses: player.total_matches - player.wins,
      winRate: player.total_matches > 0 ? (player.wins / player.total_matches * 100).toFixed(1) : '0.0',
      recentMatches
    };

    res.json({ player: playerStats });

  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Failed to get player' });
  }
});

/**
 * POST /api/players
 * Create new player (admin only)
 */
router.post('/', authenticateToken, requireAdmin, validatePlayer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, isAdmin = false } = req.body;

    // Check if username or email already exists
    const existingPlayer = await database.get(
      'SELECT id FROM players WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingPlayer) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Create player with default password
    const bcrypt = require('bcryptjs');
    const defaultPassword = 'password123'; // Player should change this
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const result = await database.run(`
      INSERT INTO players (username, email, password_hash, is_admin, elo_rating)
      VALUES (?, ?, ?, ?, ?)
    `, [username, email, hashedPassword, isAdmin ? 1 : 0, 1200]);

    const newPlayer = await database.get(
      'SELECT id, username, email, elo_rating, is_admin, created_at FROM players WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Player created successfully',
      player: newPlayer,
      defaultPassword // Include in response for admin to share with player
    });

  } catch (error) {
    console.error('Create player error:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

/**
 * PUT /api/players/:id
 * Update player (admin or self)
 */
router.put('/:id', authenticateToken, validatePlayer, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const playerId = parseInt(req.params.id);
    const { username, email, isAdmin } = req.body;

    // Check permissions
    if (!req.user.isAdmin && req.user.id !== playerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Non-admins cannot change admin status
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    // Only admins can change admin status
    if (req.user.isAdmin && typeof isAdmin === 'boolean') {
      updateFields.push('is_admin = ?');
      updateValues.push(isAdmin ? 1 : 0);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(playerId);

    await database.run(
      `UPDATE players SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedPlayer = await database.get(
      'SELECT id, username, email, elo_rating, is_admin, created_at, updated_at FROM players WHERE id = ?',
      [playerId]
    );

    res.json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });

  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

/**
 * DELETE /api/players/:id
 * Delete player (admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);

    // Check if player exists
    const player = await database.get('SELECT id FROM players WHERE id = ?', [playerId]);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if player has matches
    const hasMatches = await database.get(
      'SELECT id FROM matches WHERE player1_id = ? OR player2_id = ? LIMIT 1',
      [playerId, playerId]
    );

    if (hasMatches) {
      return res.status(400).json({ 
        error: 'Cannot delete player with existing matches. Consider deactivating instead.' 
      });
    }

    await database.run('DELETE FROM players WHERE id = ?', [playerId]);

    res.json({ message: 'Player deleted successfully' });

  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

/**
 * GET /api/players/:id/dashboard
 * Get player dashboard data
 */
router.get('/:id/dashboard', authenticateToken, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);

    // Check permissions
    if (!req.user.isAdmin && req.user.id !== playerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get pending match requests for this player
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
    `, [playerId]);

    // Get recent activity
    const recentMatches = await database.all(`
      SELECT m.*, 
             p1.username as player1_username,
             p2.username as player2_username,
             w.username as winner_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.status = 'confirmed'
      ORDER BY m.confirmed_at DESC
      LIMIT 5
    `, [playerId, playerId]);

    // Get player stats
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.winner_id = ? THEN m.id END) as wins,
        p.elo_rating,
        p.username
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      WHERE p.id = ?
      GROUP BY p.id
    `, [playerId, playerId]);

    res.json({
      pendingRequests,
      recentMatches,
      stats: {
        ...stats,
        losses: stats.total_matches - stats.wins,
        winRate: stats.total_matches > 0 ? (stats.wins / stats.total_matches * 100).toFixed(1) : '0.0'
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

module.exports = router;
