const express = require('express');
const database = require('../database/database');

const router = express.Router();

/**
 * GET /api/public/leaderboard
 * Get public leaderboard with player rankings
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const minMatches = parseInt(req.query.min_matches) || 1; // Minimum matches to appear on leaderboard

    const leaderboard = await database.all(`
      SELECT 
        p.id,
        p.username,
        p.elo_rating,
        p.created_at,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.winner_id = p.id THEN m.id END) as wins,
        COUNT(DISTINCT CASE WHEN m.winner_id != p.id THEN m.id END) as losses,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT m.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN m.winner_id = p.id THEN m.id END) * 100.0 / COUNT(DISTINCT m.id))
            ELSE 0 
          END, 1
        ) as win_rate,
        MAX(m.confirmed_at) as last_match_date
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      GROUP BY p.id, p.username, p.elo_rating, p.created_at
      HAVING COUNT(DISTINCT m.id) >= ?
      ORDER BY p.elo_rating DESC, total_matches DESC
      LIMIT ?
    `, [minMatches, limit]);

    // Add ranking position
    const rankedLeaderboard = leaderboard.map((player, index) => ({
      ...player,
      rank: index + 1
    }));

    // Get overall stats
    const stats = await database.get(`
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT m.id) as total_matches,
        MAX(p.elo_rating) as highest_elo,
        MIN(p.elo_rating) as lowest_elo,
        ROUND(AVG(p.elo_rating), 0) as average_elo
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      WHERE p.id IN (
        SELECT player_id FROM (
          SELECT p2.id as player_id, COUNT(DISTINCT m2.id) as match_count
          FROM players p2
          LEFT JOIN matches m2 ON (m2.player1_id = p2.id OR m2.player2_id = p2.id) AND m2.status = 'confirmed'
          GROUP BY p2.id
          HAVING match_count >= ?
        )
      )
    `, [minMatches]);

    res.json({
      leaderboard: rankedLeaderboard,
      stats: stats || {
        total_players: 0,
        total_matches: 0,
        highest_elo: 1200,
        lowest_elo: 1200,
        average_elo: 1200
      },
      filters: {
        min_matches: minMatches,
        limit
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/public/recent-matches
 * Get recent confirmed matches for public display
 */
router.get('/recent-matches', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const recentMatches = await database.all(`
      SELECT 
        m.id,
        m.player1_score,
        m.player2_score,
        m.confirmed_at,
        p1.username as player1_username,
        p1.elo_rating as player1_elo,
        p2.username as player2_username,
        p2.elo_rating as player2_elo,
        w.username as winner_username,
        CASE 
          WHEN m.winner_id = m.player1_id THEN m.player1_score - m.player2_score
          ELSE m.player2_score - m.player1_score
        END as score_margin
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE m.status = 'confirmed'
      ORDER BY m.confirmed_at DESC
      LIMIT ?
    `, [limit]);

    res.json({ recent_matches: recentMatches });

  } catch (error) {
    console.error('Get recent matches error:', error);
    res.status(500).json({ error: 'Failed to get recent matches' });
  }
});

/**
 * GET /api/public/player/:username
 * Get public player profile by username
 */
router.get('/player/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const player = await database.get(`
      SELECT 
        p.id,
        p.username,
        p.elo_rating,
        p.created_at,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.winner_id = p.id THEN m.id END) as wins,
        COUNT(DISTINCT CASE WHEN m.winner_id != p.id THEN m.id END) as losses,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT m.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN m.winner_id = p.id THEN m.id END) * 100.0 / COUNT(DISTINCT m.id))
            ELSE 0 
          END, 1
        ) as win_rate,
        MAX(m.confirmed_at) as last_match_date
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      WHERE p.username = ?
      GROUP BY p.id, p.username, p.elo_rating, p.created_at
    `, [username]);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get player's rank
    const rankQuery = await database.get(`
      SELECT COUNT(*) + 1 as rank
      FROM players p2
      LEFT JOIN matches m2 ON (m2.player1_id = p2.id OR m2.player2_id = p2.id) AND m2.status = 'confirmed'
      WHERE p2.elo_rating > ?
      GROUP BY p2.id
      HAVING COUNT(DISTINCT m2.id) >= 1
    `, [player.elo_rating]);

    player.rank = rankQuery ? rankQuery.rank : 1;

    // Get recent matches
    const recentMatches = await database.all(`
      SELECT 
        m.id,
        m.player1_score,
        m.player2_score,
        m.confirmed_at,
        p1.username as player1_username,
        p2.username as player2_username,
        w.username as winner_username,
        CASE 
          WHEN m.player1_id = ? THEN p2.username
          ELSE p1.username
        END as opponent_username,
        CASE 
          WHEN m.winner_id = ? THEN 'win'
          ELSE 'loss'
        END as result
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      JOIN players w ON m.winner_id = w.id
      WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.status = 'confirmed'
      ORDER BY m.confirmed_at DESC
      LIMIT 10
    `, [player.id, player.id, player.id, player.id]);

    res.json({
      player,
      recent_matches: recentMatches
    });

  } catch (error) {
    console.error('Get public player error:', error);
    res.status(500).json({ error: 'Failed to get player profile' });
  }
});

/**
 * GET /api/public/player/:username/elo-history
 * Get ELO history for a player
 */
router.get('/player/:username/elo-history', async (req, res) => {
  try {
    const { username } = req.params;

    // First get the player
    const player = await database.get(`
      SELECT id FROM players WHERE username = ?
    `, [username]);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get ELO history from matches
    const eloHistory = await database.all(`
      SELECT 
        m.confirmed_at as date,
        CASE 
          WHEN m.player1_id = ? THEN m.player1_elo_before
          ELSE m.player2_elo_before
        END as elo_before,
        CASE 
          WHEN m.player1_id = ? THEN m.player1_elo_after
          ELSE m.player2_elo_after
        END as elo_after,
        CASE 
          WHEN m.player1_id = ? THEN m.player1_score
          ELSE m.player2_score
        END as player_score,
        CASE 
          WHEN m.player1_id = ? THEN m.player2_score
          ELSE m.player1_score
        END as opponent_score,
        CASE 
          WHEN m.winner_id = ? THEN 'win'
          ELSE 'loss'
        END as result,
        CASE 
          WHEN m.player1_id = ? THEN p2.username
          ELSE p1.username
        END as opponent_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      WHERE (m.player1_id = ? OR m.player2_id = ?) 
        AND m.status = 'confirmed'
        AND m.player1_elo_before IS NOT NULL
        AND m.player2_elo_before IS NOT NULL
      ORDER BY m.confirmed_at ASC
    `, [player.id, player.id, player.id, player.id, player.id, player.id, player.id, player.id]);

    // Add starting ELO point if we have history
    let fullHistory = [];
    if (eloHistory.length > 0) {
      // Add the starting point
      fullHistory.push({
        date: null,
        elo: eloHistory[0].elo_before,
        isStarting: true
      });

      // Add all the match points
      fullHistory = fullHistory.concat(eloHistory.map(match => ({
        date: match.date,
        elo: match.elo_after,
        eloChange: match.elo_after - match.elo_before,
        result: match.result,
        opponent: match.opponent_username,
        playerScore: match.player_score,
        opponentScore: match.opponent_score,
        isStarting: false
      })));
    }

    res.json({ 
      elo_history: fullHistory,
      total_matches: eloHistory.length
    });

  } catch (error) {
    console.error('Get player ELO history error:', error);
    res.status(500).json({ error: 'Failed to get player ELO history' });
  }
});

/**
 * GET /api/public/players
 * Get all players for match creation (no minimum match requirement)
 */
router.get('/players', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);

    const players = await database.all(`
      SELECT 
        p.id,
        p.username,
        p.elo_rating,
        COUNT(DISTINCT m.id) as total_matches
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      GROUP BY p.id, p.username, p.elo_rating
      ORDER BY p.username ASC
      LIMIT ?
    `, [limit]);

    res.json({ players });

  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ error: 'Failed to get players' });
  }
});

/**
 * GET /api/public/stats
 * Get general statistics about the ping pong league
 */
router.get('/stats', async (req, res) => {
  try {
    // Get overall stats
    const overallStats = await database.get(`
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT CASE WHEN m.status = 'confirmed' THEN m.id END) as total_matches,
        COUNT(DISTINCT CASE WHEN m.status = 'pending' THEN m.id END) as pending_matches,
        MAX(p.elo_rating) as highest_elo,
        MIN(p.elo_rating) as lowest_elo,
        ROUND(AVG(p.elo_rating), 0) as average_elo
      FROM players p
      LEFT JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id)
    `);

    // Get most active players
    const mostActive = await database.all(`
      SELECT 
        p.username,
        COUNT(DISTINCT m.id) as match_count
      FROM players p
      JOIN matches m ON (m.player1_id = p.id OR m.player2_id = p.id) AND m.status = 'confirmed'
      GROUP BY p.id, p.username
      ORDER BY match_count DESC
      LIMIT 5
    `);

    // Get recent activity (matches per day for last 30 days)
    const recentActivity = await database.all(`
      SELECT 
        DATE(confirmed_at) as match_date,
        COUNT(*) as matches_count
      FROM matches
      WHERE status = 'confirmed' 
        AND confirmed_at >= DATE('now', '-30 days')
      GROUP BY DATE(confirmed_at)
      ORDER BY match_date DESC
    `);

    res.json({
      overall: overallStats,
      most_active_players: mostActive,
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
