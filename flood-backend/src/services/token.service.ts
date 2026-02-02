import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables (should be in .env file)
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || process.env.ACCESS_TOKEN_SECRET || 'access_secret_key_change_in_production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_key_change_in_production';

console.log('[TOKEN] JWT Configuration:', {
  accessSecret: ACCESS_TOKEN_SECRET ? 'SET' : 'NOT SET',
  refreshSecret: REFRESH_TOKEN_SECRET ? 'SET' : 'NOT SET'
});

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

class TokenService {
  generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '10d' });
    
    return {
      accessToken,
      refreshToken
    };
  }

  validateAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  validateRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  generateVerificationToken(): string {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async saveToken(userId: string, refreshToken: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.refreshToken = refreshToken;
    await user.save();
    
    return refreshToken;
  }

  async removeToken(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.refreshToken = undefined;
    await user.save();
  }

  async findToken(refreshToken: string) {
    const user = await User.findOne({ refreshToken });
    return user?.refreshToken;
  }
}

export default new TokenService();
