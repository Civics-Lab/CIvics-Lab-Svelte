import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authService } from './service';

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
  });
