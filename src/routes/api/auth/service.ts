import bcrypt from 'bcryptjs';
import { eq, or, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users, userInvites, userWorkspaces } from '$lib/db/drizzle/schema';
import { env } from '$env/dynamic/private';
import { processPendingInvitations } from '$lib/server/invites';
// Import node-compatible crypto functions instead of browser APIs
import crypto from 'crypto';

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  inviteToken?: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Simple JWT implementation without requiring WebCrypto
const jwt = {
  sign: (payload: any, secret: string): string => {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  },
  
  verify: (token: string, secret: string): any => {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    
    if (expectedSignature !== signatureB64) {
      throw new Error('Invalid signature');
    }
    
    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid token payload');
    }
  }
};

export const authService = {
  /**
   * Login user and return JWT if credentials are valid
   */
  async login({ username, password }: LoginData) {
    try {
      console.log(`Attempting login for username: ${username}`);
      
      // Debug: Check if db is properly initialized
      console.log('Database connection status:', !!db);
      console.log('Environment:', env.NODE_ENV);
      console.log('JWT Secret configured:', !!env.JWT_SECRET);
      
      // Find user by username
      console.log('Querying user from database...');
      let user;
      try {
        const userResults = await db.select().from(users).where(eq(users.username, username));
        console.log(`Found ${userResults.length} matching users`);
        
        [user] = userResults;
        
        if (!user) {
          console.log('No user found with that username');
          throw new Error('Invalid credentials');
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}`);
      }
      
      // Debug: Log user object (without password)
      const userDebug = { ...user };
      delete userDebug.passwordHash;
      console.log('User found:', JSON.stringify(userDebug));
      
      // Verify password
      console.log('Verifying password...');
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      console.log('Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Password verification failed');
        throw new Error('Invalid credentials');
      }
      
      // Update last login time
      console.log('Updating last login time...');
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));
      
      // Generate JWT
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isGlobalSuperAdmin: user.isGlobalSuperAdmin || false
      };
      
      console.log('Generating JWT token...');
      const token = await this.generateToken(payload);
      console.log('Token generated successfully');
      
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
    } catch (error) {
      console.error('Login error details:', error);
      
      // Add stack trace for better debugging
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  },
  
  /**
   * Create new user account and return JWT
   */
  async signup({ email, username, password, displayName, inviteToken }: SignupData) {
    try {
      console.log(`Attempting signup for username: ${username}, email: ${email}`);
      
      // Check if username or email already exists
      const existingUser = await db.select().from(users)
        .where(or(
          eq(users.username, username),
          eq(users.email, email)
        ));
        
      console.log(`Found ${existingUser.length} existing users with same username/email`);
      
      if (existingUser.length > 0) {
        throw new Error('Username or email already exists');
      }
      
      // Hash password
      console.log('Hashing password...');
      const passwordHash = await bcrypt.hash(password, 10);
      console.log('Password hashed successfully');
      
      // Create new user
      console.log('Creating new user...');
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
      
      console.log('User created successfully:', JSON.stringify(newUser));
      
      // Process all pending invitations for this email using the service
      console.log('Processing pending invitations...');
      const { processed, errors } = await processPendingInvitations(email, newUser.id);
      
      console.log(`Processed ${processed} invitations`);
      if (errors.length > 0) {
        console.warn('Invitation processing errors:', errors);
      }
      
      // Check if user is now a Super Admin
      const updatedUser = await db.select()
        .from(users)
        .where(eq(users.id, newUser.id))
        .limit(1);
      
      const isNowSuperAdmin = updatedUser[0]?.isGlobalSuperAdmin || false;
      
      // Generate JWT
      console.log('Generating JWT token...');
      const payload = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isGlobalSuperAdmin: isNowSuperAdmin
      };
      
      const token = await this.generateToken(payload);
      console.log('Token generated successfully');
      
      return {
        token,
        user: {
          ...newUser,
          isGlobalSuperAdmin: isNowSuperAdmin
        },
        invitesProcessed: processed,
        inviteErrors: errors,
        hasAcceptedInvites: processed > 0
      };
    } catch (error) {
      console.error('Signup error details:', error);
      
      // Add stack trace for better debugging
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  },
  
  /**
   * Generate JWT token
   */
  async generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string = '7d') {
    try {
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
      
      // Debug JWT secret (don't log the actual secret)
      console.log('JWT Secret length:', env.JWT_SECRET?.length || 0);
      console.log('Environment:', env.NODE_ENV);
      
      // In production, we'll use the PRODUCTION_JWT_SECRET if available
      let secretToUse = env.JWT_SECRET;
      if (env.NODE_ENV === 'production' && env.PRODUCTION_JWT_SECRET) {
        console.log('Using production JWT secret for token generation');
        secretToUse = env.PRODUCTION_JWT_SECRET;
      }
      
      // Check if JWT secret is properly set
      if (!secretToUse || secretToUse.length < 10) {
        console.error('JWT secret is missing or too short!');
        throw new Error('Server configuration error: Invalid JWT secret');
      }
      
      // Use Node.js-friendly JWT implementation
      return jwt.sign(tokenPayload, secretToUse);
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  },
  
  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      console.log('Validating token...');
      console.log('Environment:', env.NODE_ENV);
      
      // In production, we'll use the PRODUCTION_JWT_SECRET if available
      let secretToUse = env.JWT_SECRET;
      if (env.NODE_ENV === 'production' && env.PRODUCTION_JWT_SECRET) {
        console.log('Using production JWT secret for validation');
        secretToUse = env.PRODUCTION_JWT_SECRET;
      }
      
      // First try with the selected secret
      try {
        const payload = jwt.verify(token, secretToUse);
        console.log('Token validated successfully with primary secret');
        return payload as JwtPayload;
      } catch (primaryError) {
        // If we're in production and using the production secret, also try the development secret
        // This helps during transitions between environments
        if (env.NODE_ENV === 'production' && env.PRODUCTION_JWT_SECRET && env.JWT_SECRET !== env.PRODUCTION_JWT_SECRET) {
          console.log('Primary validation failed, trying fallback secret');
          try {
            const payload = jwt.verify(token, env.JWT_SECRET);
            console.log('Token validated successfully with fallback secret');
            return payload as JwtPayload;
          } catch (fallbackError) {
            console.error('Token validation failed with both secrets');
            throw fallbackError;
          }
        } else {
          throw primaryError;
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      throw new Error('Invalid token');
    }
  },

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current password and new password are required');
    }
    
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Get the user from the database to verify current password
    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (userResult.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
    
    return { success: true, message: 'Password updated successfully' };
  },

  /**
   * Check if username is available
   */
  async checkUsername(currentUserId: string, currentUsername: string, username: string) {
    if (!username) {
      throw new Error('Username is required');
    }
    
    // Check if the username is the same as the current user's username
    if (currentUsername === username) {
      return { available: true };
    }
    
    // Check if the username already exists in the database
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    
    const available = existingUser.length === 0;
    return { available };
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, currentUsername: string, updates: { username?: string; displayName?: string; avatar?: string | null }) {
    const dbUpdates: Record<string, any> = {};
    
    // Handle username update
    if (updates.username && updates.username !== currentUsername) {
      // Check if the username is already taken
      const existingUser = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.username, updates.username));
      
      if (existingUser.length > 0) {
        throw new Error('Username is already taken');
      }
      
      dbUpdates.username = updates.username;
    }
    
    // Handle displayName update
    if (updates.displayName !== undefined) {
      dbUpdates.displayName = updates.displayName;
    }
    
    // Handle avatar update (including removal)
    if (updates.hasOwnProperty('avatar')) {
      dbUpdates.avatar = updates.avatar; // Can be null to remove the avatar
    }
    
    // If no updates, return early
    if (Object.keys(dbUpdates).length === 0) {
      const userResult = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar,
        role: users.role
      }).from(users).where(eq(users.id, userId));
      
      return { 
        message: 'No changes made',
        user: userResult[0],
        token: null
      };
    }
    
    // Update the user in the database
    const [updatedUser] = await db.update(users)
      .set(dbUpdates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar,
        role: users.role
      });
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    // Generate a new token with the updated information
    const newToken = await this.generateToken({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    });
    
    return { 
      user: updatedUser,
      token: newToken
    };
  },

  /**
   * Update user email
   */
  async updateEmail(userId: string, newEmail: string) {
    if (!newEmail) {
      throw new Error('Email is required');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new Error('Invalid email format');
    }
    
    // Check if email is already taken
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail));
    
    if (existingUser.length > 0) {
      throw new Error('Email is already taken');
    }
    
    // Update the email in the database
    const [updatedUser] = await db.update(users)
      .set({ email: newEmail })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar,
        role: users.role
      });
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    // Generate a new token with the updated information
    const newToken = await this.generateToken({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    });
    
    return { 
      user: updatedUser,
      token: newToken
    };
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, avatarFile: File) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(avatarFile.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are supported.');
    }
    
    // Validate file size (limit to 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (avatarFile.size > maxSize) {
      throw new Error('File size exceeds the 2MB limit.');
    }
    
    // Read the file as a base64-encoded string
    const buffer = await avatarFile.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const base64Image = Buffer.from(uint8Array).toString('base64');
    const avatarData = `data:${avatarFile.type};base64,${base64Image}`;
    
    // Update the user record in the database
    const [updatedUser] = await db.update(users)
      .set({ 
        avatar: avatarData,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar,
        role: users.role
      });
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    // Generate a new token with the updated information
    const newToken = await this.generateToken({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    });
    
    return { 
      message: 'Avatar uploaded successfully',
      user: updatedUser,
      token: newToken
    };
  }
};
