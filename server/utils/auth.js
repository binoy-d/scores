const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.is_admin
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Middleware to authenticate requests
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
}

/**
 * Middleware to check if user owns resource or is admin
 */
function requireOwnershipOrAdmin(req, res, next) {
  const resourceUserId = parseInt(req.params.userId || req.params.playerId);
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.isAdmin || req.user.id === resourceUserId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin
};
