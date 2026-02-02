import { Request, Response, NextFunction } from 'express';
import tokenService from '../services/token.service';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const userData = tokenService.validateAccessToken(token);
    if (!userData) {
      throw new AppError('Invalid or expired token', 401);
    }

    req.user = userData;
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

// Convenience middlewares
export const requireAdmin = requireRole('admin');
export const requireGMC = requireRole('gmc', 'admin');
