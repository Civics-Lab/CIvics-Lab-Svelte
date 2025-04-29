import bcrypt from 'bcryptjs';
import { eq, or, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users, userInvites, userWorkspaces } from '$lib/db/drizzle/schema';
import { env } from '$env/dynamic/private';
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
        role: user.role
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
      
      let acceptedInvites = [];
      let pendingInvites = [];
      let defaultWorkspaceCreated = false;
      
      // Check for an invite token if provided
      if (inviteToken) {
        console.log(`Processing invite token: ${inviteToken}`);
        const invite = await db.query.userInvites.findFirst({
          where: eq(userInvites.token, inviteToken)
        });
        
        if (invite) {
          console.log('Found invite:', JSON.stringify(invite));
          // Verify the invite is for this email
          if (invite.email.toLowerCase() === email.toLowerCase()) {
            // Update invite status to accepted
            console.log('Accepting invite...');
            await db.update(userInvites)
              .set({ 
                status: 'Accepted',
                acceptedAt: new Date()
              })
              .where(eq(userInvites.id, invite.id));
            
            // Create user-workspace relationship
            console.log('Adding user to workspace...');
            try {
            // Verify the user still exists
            const userExists = await db
            .select({ id: users.id })
            .from(users)
              .where(eq(users.id, newUser.id));
                
              if (!userExists || userExists.length === 0) {
                console.error(`User with ID ${newUser.id} not found when adding to workspace`);
              throw new Error(`User with ID ${newUser.id} no longer exists in database`);
            }
            
            await db.insert(userWorkspaces)
              .values({
                userId: newUser.id,
                workspaceId: invite.workspaceId,
                role: invite.role
              });
              
            acceptedInvites.push(invite);
            console.log('Invite processed successfully');  
          } catch (err) {
            console.error('Error adding user to workspace:', err);
            throw err;
          }
          }
        }
      }
      
      // Check for any other pending invites for this email
      console.log('Checking for other pending invites...');
      pendingInvites = await db.select()
        .from(userInvites)
        .where(
          and(
            eq(userInvites.email, email),
            eq(userInvites.status, 'Pending')
          )
        );
      
      console.log(`Found ${pendingInvites.length} additional pending invites`);
      
      // Accept all other pending invites for this email
      if (pendingInvites.length > 0) {
        for (const invite of pendingInvites) {
          // Skip the one we already processed
          if (invite.token === inviteToken) continue;
          
          console.log(`Processing additional invite: ${invite.id}`);
          
          // Update invite status to accepted
          await db.update(userInvites)
            .set({ 
              status: 'Accepted',
              acceptedAt: new Date()
            })
            .where(eq(userInvites.id, invite.id));
          
          // Create user-workspace relationship
          await db.insert(userWorkspaces)
            .values({
              userId: newUser.id,
              workspaceId: invite.workspaceId,
              role: invite.role
            });
          
          acceptedInvites.push(invite);
          console.log('Additional invite processed successfully');
        }
      }
      
      // We'll no longer automatically create a default workspace
      // Only use workspaces that come from accepted invites
      
      // Generate JWT
      console.log('Generating JWT token...');
      const payload = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      };
      
      const token = await this.generateToken(payload);
      console.log('Token generated successfully');
      
      return {
        token,
        user: newUser,
        invites: acceptedInvites,
        hasAcceptedInvites: acceptedInvites.length > 0
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
  }
};
