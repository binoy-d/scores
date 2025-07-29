import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: number;
  username: string;
  email?: string;
  is_admin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email?: string;
    isAdmin: boolean;
  };
}

/**
 * Generate JWT token for a user
 */
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.is_admin
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Middleware to authenticate requests
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }
  next();
}

/**
 * Middleware to check if user owns resource or is admin
 */
export function requireOwnershipOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const resourceUserId = parseInt(req.params.userId || req.params.playerId || '0');
  
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (req.user.isAdmin || req.user.id === resourceUserId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
}
