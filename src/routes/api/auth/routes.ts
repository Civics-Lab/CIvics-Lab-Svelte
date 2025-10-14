import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Define validation schemas
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().optional()
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters')
});

const checkUsernameSchema = z.object({
  username: z.string().min(1, 'Username is required')
});

const updateProfileSchema = z.object({
  username: z.string().optional(),
  displayName: z.string().optional(),
  avatar: z.string().nullable().optional()
});

const updateEmailSchema = z.object({
  email: z.string().email('Invalid email address')
});

// Create auth router
export const authRouter = new Hono()
  // Login route
  .post('/login', zValidator('json', loginSchema, (result, c) => {
    // Handle validation errors
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Validation error',
        details: result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }, 400);
    }
  }), async (c) => {
    try {
      const { username, password } = c.req.valid('json');
      const result = await authService.login({ username, password });
      
      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Invalid credentials' ? 401 : 500;
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, statusCode);
    }
  })
  
  // Signup route
  .post('/signup', zValidator('json', signupSchema, (result, c) => {
    // Handle validation errors
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Validation error',
        details: result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }, 400);
    }
  }), async (c) => {
    try {
      const { email, username, password, displayName } = c.req.valid('json');
      const result = await authService.signup({ email, username, password, displayName });
      
      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      const statusCode = error instanceof Error && 
        error.message === 'Username or email already exists' ? 409 : 500;
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, statusCode);
    }
  })
  
  // Validate token route (useful for client-side validation)
  .post('/validate', async (c) => {
    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: 'No token provided'
      }, 401);
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = await authService.validateToken(token);
      
      return c.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: payload.id,
            username: payload.username,
            email: payload.email,
            role: payload.role
          }
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: 'Invalid token',
        data: {
          valid: false
        }
      }, 401);
    }
  })

  // Change password route (requires authentication)
  .post('/change-password', jwt({ secret: env.JWT_SECRET || '' }), zValidator('json', changePasswordSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { current_password, new_password } = c.req.valid('json');
    
    try {
      const result = await authService.changePassword(userId, current_password, new_password);
      return c.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Current password is incorrect')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message.includes('User not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('required') || err.message.includes('characters')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      throw new HTTPException(500, { message: 'Failed to change password' });
    }
  })

  // Check username availability (requires authentication)
  .post('/check-username', jwt({ secret: env.JWT_SECRET || '' }), zValidator('json', checkUsernameSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const currentUsername = payload.username as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { username } = c.req.valid('json');
    
    try {
      const result = await authService.checkUsername(userId, currentUsername, username);
      return c.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof Error && err.message.includes('required')) {
        throw new HTTPException(400, { message: err.message });
      }
      throw new HTTPException(500, { message: 'Failed to check username availability' });
    }
  })

  // Update profile (requires authentication)
  .post('/update-profile', jwt({ secret: env.JWT_SECRET || '' }), zValidator('json', updateProfileSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const currentUsername = payload.username as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const updates = c.req.valid('json');
    
    try {
      const result = await authService.updateProfile(userId, currentUsername, updates);
      return c.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('already taken')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message.includes('User not found')) {
          throw new HTTPException(404, { message: err.message });
        }
      }
      throw new HTTPException(500, { message: 'Failed to update profile' });
    }
  })

  // Update email (requires authentication)
  .post('/update-email', jwt({ secret: env.JWT_SECRET || '' }), zValidator('json', updateEmailSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { email } = c.req.valid('json');
    
    try {
      const result = await authService.updateEmail(userId, email);
      return c.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('already taken') || err.message.includes('Invalid email')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message.includes('User not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      throw new HTTPException(500, { message: 'Failed to update email' });
    }
  })

  // Upload avatar (requires authentication)
  .post('/upload-avatar', jwt({ secret: env.JWT_SECRET || '' }), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const formData = await c.req.formData();
      const avatarFile = formData.get('avatar');
      
      if (!avatarFile || !(avatarFile instanceof File)) {
        throw new HTTPException(400, { message: 'No avatar file provided or invalid format' });
      }
      
      const result = await authService.uploadAvatar(userId, avatarFile);
      return c.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof HTTPException) {
        throw err;
      }
      if (err instanceof Error) {
        if (err.message.includes('Invalid file type') || err.message.includes('File size exceeds') || err.message.includes('No avatar file')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message.includes('User not found')) {
          throw new HTTPException(404, { message: err.message });
        }
      }
      throw new HTTPException(500, { message: 'Failed to upload avatar' });
    }
  });
