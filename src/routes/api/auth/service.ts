import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users } from '$lib/db/drizzle';
import { env } from '$env/dynamic/private';
import { sign, verify } from 'hono/jwt';

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authService = {
  /**
   * Login user and return JWT if credentials are valid
   */
  async login({ username, password }: LoginData) {
    // Find user by username
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login time
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    
    // Generate JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    const token = await this.generateToken(payload);
    
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    };
  },
  
  /**
   * Create new user account and return JWT
   */
  async signup({ email, username, password, displayName }: SignupData) {
    // Check if username or email already exists
    const existingUser = await db.select().from(users)
      .where(eq(users.username, username))
      .or(eq(users.email, email));
      
    if (existingUser.length > 0) {
      throw new Error('Username or email already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new user
    const [newUser] = await db.insert(users)
      .values({
        email,
        username,
        passwordHash,
        displayName: displayName || username,
        lastLoginAt: new Date()
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role
      });
    
    // Generate JWT
    const payload = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    };
    
    const token = await this.generateToken(payload);
    
    return {
      token,
      user: newUser
    };
  },
  
  /**
   * Generate JWT token
   */
  async generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string = '7d') {
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
   * Validate JWT token
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await verify(token, env.JWT_SECRET);
      return payload as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};
