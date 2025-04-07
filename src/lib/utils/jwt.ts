import { verify, sign } from 'hono/jwt';
import { env } from '$env/dynamic/private';

// Define JWT payload interface
export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  // Additional custom claims
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// JWT utilities
export const jwtUtils = {
  /**
   * Generate a JWT token for a user
   */
  generateToken: async (payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string = '7d') => {
    // Calculate expiration time
    const now = Math.floor(Date.now() / 1000);
    let expiration: number;
    
    if (expiresIn === '7d') {
      expiration = now + (7 * 24 * 60 * 60); // 7 days
    } else if (expiresIn === '1d') {
      expiration = now + (24 * 60 * 60); // 1 day
    } else if (expiresIn === '1h') {
      expiration = now + (60 * 60); // 1 hour
    } else {
      expiration = now + (7 * 24 * 60 * 60); // Default to 7 days
    }
    
    // Create token with expiration
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: expiration
    };
    
    return sign(tokenPayload, env.JWT_SECRET);
  },
  
  /**
   * Verify and decode a JWT token
   */
  verifyToken: async (token: string): Promise<JwtPayload> => {
    try {
      return await verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};
