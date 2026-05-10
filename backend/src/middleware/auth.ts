// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createChildLogger } from '../config/logger';

const logger = createChildLogger('auth-middleware');

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authenticate JWT token from Authorization header
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Missing authentication token', { path: req.path });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired', { email: req.user?.email });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    logger.error('Token verification error', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token verification failed',
    });
  }
};

/**
 * Require specific role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No user found',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized role access', {
        userId: req.user.id,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Require specific merchant
 */
export const requireMerchant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No user found',
    });
  }

  if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
    logger.warn('Non-merchant access to merchant routes', {
      userId: req.user.id,
      role: req.user.role,
    });

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only merchants can access this resource',
    });
  }

  next();
};

/**
 * Utility: Generate JWT token
 */
export interface TokenPayload {
  id: string;
  email: string;
  role: 'consumer' | 'merchant' | 'admin';
  iat?: number;
  exp?: number;
}

export function generateToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): string {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn,
    });
    return token;
  } catch (error) {
    logger.error('Error generating token', { error });
    throw error;
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  return {
    accessToken: generateToken(payload, '1h'),
    refreshToken: generateToken(payload, '7d'),
  };
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
