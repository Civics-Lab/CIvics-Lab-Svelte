import { Hono } from 'hono';
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { jwt } from 'hono/jwt';
import { env } from '$env/dynamic/private';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// Create executable GraphQL schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

// Create GraphQL router
export const graphRouter = new Hono()
  // Add JWT middleware for all graph routes
  .use('*', jwt({
    secret: env.JWT_SECRET,
    message: 'Authentication required'
  }))
  
  // Error handling middleware for JWT validation
  .use('*', async (c, next) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof Error) {
        return c.json({
          success: false,
          error: error.message
        }, 401);
      }
      return c.json({
        success: false,
        error: 'Authentication failed'
      }, 401);
    }
  })
  
  // GraphQL endpoint
  .post('/', async (c) => {
    // Create Yoga instance with context
    const yoga = createYoga({
      schema,
      // Add user context from JWT
      context: () => {
        // The JWT middleware has already validated the token
        // and added the payload to c.var
        const user = c.get('jwtPayload');
        
        return {
          user,
          token: c.req.header('Authorization')?.replace('Bearer ', '')
        };
      },
      // Configure GraphQL behavior
      graphiql: env.NODE_ENV !== 'production',
      landingPage: false
    });
    
    try {
      // Handle GraphQL request
      const response = await yoga.handleRequest(c.req.raw, {});
      
      // Convert Yoga response to Hono response
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      console.error('GraphQL Error:', error);
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred processing the GraphQL request'
      }, 500);
    }
  })
  
  // GraphiQL endpoint (only in development)
  .get('/', async (c) => {
    if (env.NODE_ENV === 'production') {
      return c.json({
        success: false,
        error: 'GraphiQL is disabled in production'
      }, 404);
    }
    
    // Create Yoga instance with GraphiQL enabled
    const yoga = createYoga({
      schema,
      graphiql: true,
      context: () => {
        const user = c.get('jwtPayload');
        
        return { 
          user,
          token: c.req.header('Authorization')?.replace('Bearer ', '')
        };
      }
    });
    
    try {
      // Handle GraphQL request
      const response = await yoga.handleRequest(c.req.raw, {});
      
      // Convert Yoga response to Hono response
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      console.error('GraphiQL Error:', error);
      
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred with GraphiQL'
      }, 500);
    }
  });
