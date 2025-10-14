# Hono Implementation Guide

## Overview

This guide provides detailed instructions for implementing new API routes using the Hono framework within our SvelteKit application. It establishes patterns and best practices based on the successful migration of workspaces, contacts, and businesses APIs.

## Architecture Pattern

### File Structure
Each domain follows a consistent structure:

```
src/routes/api/{domain}/
├── service.ts     # Business logic layer
├── routes.ts      # Hono router definition
└── types.ts       # TypeScript interfaces (optional)
```

### Integration Point
All routers are registered in the main Hono app:

```typescript
// src/routes/api/+server.ts
import { domainRouter } from './domain/routes';

const app = new Hono()
  .route('/domain', domainRouter)
  // ... other routes
```

## Service Layer Implementation

### Basic Service Structure

```typescript
// src/routes/api/{domain}/service.ts
import { db } from '$lib/server/db';
import { entityTable } from '$lib/db/drizzle/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';

export const entityService = {
  // READ Operations
  async getEntities(workspaceId: string, userId: string, options: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    // 1. Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // 2. Build query with filters
    const { search, limit = 100, offset = 0 } = options;
    
    let query = db
      .select()
      .from(entityTable)
      .where(eq(entityTable.workspaceId, workspaceId));
    
    // 3. Add search if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        and(
          eq(entityTable.workspaceId, workspaceId),
          ilike(entityTable.name, searchTerm) // Adjust field as needed
        )
      );
    }
    
    // 4. Apply pagination
    query = query.limit(limit).offset(offset);
    
    // 5. Execute and return
    const entities = await query;
    return { entities };
  },

  async getEntityById(entityId: string, workspaceId: string, userId: string) {
    // 1. Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // 2. Fetch entity
    const [entity] = await db
      .select()
      .from(entityTable)
      .where(
        and(
          eq(entityTable.id, entityId),
          eq(entityTable.workspaceId, workspaceId)
        )
      );
    
    if (!entity) {
      throw new Error('Entity not found');
    }
    
    return entity;
  },

  // CREATE Operations
  async createEntity(data: any, workspaceId: string, userId: string) {
    // 1. Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // 2. Prepare data
    const entityData = {
      ...data,
      workspaceId,
      createdBy: userId
    };
    
    // 3. Insert and return
    const [newEntity] = await db
      .insert(entityTable)
      .values(entityData)
      .returning();
    
    return newEntity;
  },

  // UPDATE Operations
  async updateEntity(entityId: string, data: any, workspaceId: string, userId: string) {
    // 1. Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // 2. Update entity
    const [updatedEntity] = await db
      .update(entityTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(entityTable.id, entityId),
          eq(entityTable.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!updatedEntity) {
      throw new Error('Entity not found');
    }
    
    return updatedEntity;
  },

  // DELETE Operations
  async deleteEntity(entityId: string, workspaceId: string, userId: string) {
    // 1. Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // 2. Delete related records first (if any)
    // await db.delete(relatedTable).where(eq(relatedTable.entityId, entityId));
    
    // 3. Delete main entity
    const [deletedEntity] = await db
      .delete(entityTable)
      .where(
        and(
          eq(entityTable.id, entityId),
          eq(entityTable.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!deletedEntity) {
      throw new Error('Entity not found');
    }
    
    return { success: true };
  },

  // PAGINATION Operations
  async getEntitiesPaginated(workspaceId: string, userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    // 1. Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;
    
    // 2. Build base query
    let query = db
      .select()
      .from(entityTable)
      .where(eq(entityTable.workspaceId, workspaceId));
    
    // 3. Add search if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        and(
          eq(entityTable.workspaceId, workspaceId),
          ilike(entityTable.name, searchTerm)
        )
      );
    }
    
    // 4. Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(entityTable)
      .where(eq(entityTable.workspaceId, workspaceId));
    
    const total = totalResult[0].count;
    
    // 5. Apply pagination
    query = query.limit(limit).offset(offset);
    
    const entities = await query;
    
    return {
      entities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
};
```

### Service Best Practices

1. **Always verify workspace access first**
2. **Use consistent error messages**
3. **Handle related data deletion in correct order**
4. **Include audit fields (createdBy, updatedAt)**
5. **Use transactions for multi-table operations**

## Router Layer Implementation

### Basic Router Structure

```typescript
// src/routes/api/{domain}/routes.ts
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { entityService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Validation Schemas
const createEntitySchema = z.object({
  name: z.string().min(1).trim(),
  // Add other required fields
  workspaceId: z.string().uuid()
});

const updateEntitySchema = z.object({
  name: z.string().min(1).trim().optional(),
  // Add other updatable fields
});

const paginationSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  workspace_id: z.string().uuid()
});

export const entityRouter = new Hono()
  // Apply JWT middleware to all routes
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/entities - List entities with search
  .get('/', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, search, page, limit, sortBy, sortOrder } = c.req.valid('query');
    
    try {
      const result = await entityService.getEntities(workspace_id, userId, {
        search,
        limit,
        offset: page && limit ? (page - 1) * limit : 0,
        sortBy,
        sortOrder
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching entities:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch entities' });
    }
  })
  
  // GET /api/entities/paginated - Paginated entities
  .get('/paginated', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, search, page, limit, sortBy, sortOrder } = c.req.valid('query');
    
    try {
      const result = await entityService.getEntitiesPaginated(workspace_id, userId, {
        page,
        limit,
        search,
        sortBy,
        sortOrder
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching paginated entities:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch entities' });
    }
  })
  
  // POST /api/entities - Create new entity
  .post('/', zValidator('json', createEntitySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const entityData = c.req.valid('json');
    
    try {
      const entity = await entityService.createEntity(entityData, entityData.workspaceId, userId);
      return c.json({ entity }, 201);
    } catch (err) {
      console.error('Error creating entity:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to create entity' });
    }
  })
  
  // GET /api/entities/:id - Get specific entity
  .get('/:id', zValidator('query', z.object({ workspace_id: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id } = c.req.valid('query');
    
    try {
      const entity = await entityService.getEntityById(id, workspace_id, userId);
      return c.json({ entity });
    } catch (err) {
      console.error('Error fetching entity:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Entity not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch entity' });
    }
  })
  
  // PUT /api/entities/:id - Update entity
  .put('/:id', zValidator('json', updateEntitySchema.extend({ workspaceId: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId, ...updateData } = c.req.valid('json');
    
    try {
      const entity = await entityService.updateEntity(id, updateData, workspaceId, userId);
      return c.json({ entity });
    } catch (err) {
      console.error('Error updating entity:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Entity not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update entity' });
    }
  })
  
  // DELETE /api/entities/:id - Delete entity
  .delete('/:id', zValidator('json', z.object({ workspaceId: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId } = c.req.valid('json');
    
    try {
      const result = await entityService.deleteEntity(id, workspaceId, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting entity:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Entity not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to delete entity' });
    }
  });
```

### Router Best Practices

1. **Always include JWT middleware**
2. **Validate all inputs with Zod schemas**
3. **Use consistent error handling patterns**
4. **Include proper HTTP status codes**
5. **Log errors for debugging**

## Validation Schemas

### Common Patterns

```typescript
// UUID validation
const uuidSchema = z.string().uuid();

// Pagination schema
const paginationSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  workspace_id: z.string().uuid()
});

// String field with trimming
const nameSchema = z.string().min(1).trim();

// Optional string field
const optionalNameSchema = z.string().min(1).trim().optional();

// Email validation
const emailSchema = z.string().email().toLowerCase();

// Phone number validation
const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number');

// Date validation
const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: "Invalid date format"
}).transform((val) => new Date(val));
```

### Entity-Specific Schemas

```typescript
// Contact schemas
const createContactSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  middleName: z.string().optional(),
  workspaceId: z.string().uuid()
});

// Business schemas
const createBusinessSchema = z.object({
  businessName: z.string().min(1).trim(),
  industry: z.string().optional(),
  workspaceId: z.string().uuid()
});

// Donation schemas
const createDonationSchema = z.object({
  amount: z.number().positive(),
  donorType: z.enum(['contact', 'business']),
  donorId: z.string().uuid(),
  workspaceId: z.string().uuid()
});
```

## Error Handling

### Standard Error Responses

```typescript
// Authentication errors
throw new HTTPException(401, { message: 'Authentication required' });

// Authorization errors  
throw new HTTPException(403, { message: 'You do not have permission to access this workspace' });

// Not found errors
throw new HTTPException(404, { message: 'Entity not found' });

// Validation errors
throw new HTTPException(400, { message: 'Invalid input data' });

// Server errors
throw new HTTPException(500, { message: 'Failed to process request' });
```

### Error Handling Pattern

```typescript
try {
  // Service operation
  const result = await entityService.operation();
  return c.json(result);
} catch (err) {
  console.error('Error in operation:', err);
  
  if (err instanceof Error) {
    // Handle specific error types
    if (err.message === 'Entity not found') {
      throw new HTTPException(404, { message: err.message });
    }
    if (err.message === 'You do not have permission to access this workspace') {
      throw new HTTPException(403, { message: err.message });
    }
  }
  
  // Default server error
  throw new HTTPException(500, { message: 'Failed to process request' });
}
```

## Main App Integration

### Adding New Router

```typescript
// src/routes/api/+server.ts
import { newEntityRouter } from './new-entity/routes';

const app = new Hono()
  .use('*', cors({
    origin: ['http://localhost:5173', 'https://civics-lab.vercel.app'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type']
  }))
  
  // Route handlers
  .route('/auth', authRouter)
  .route('/graph', graphRouter)
  .route('/workspaces', workspaceRouter)
  .route('/contacts', contactRouter)
  .route('/businesses', businessRouter)
  .route('/new-entity', newEntityRouter) // Add your new router here
  
  // Health check and error handling
  .get('/health', (c) => {
    return c.json({
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV || 'development'
    });
  })
  
  .notFound((c) => {
    return c.json({
      success: false,
      error: 'Endpoint not found'
    }, 404);
  });
```

## Testing Strategy

### Service Layer Testing

```typescript
// Test workspace access
test('should require workspace access', async () => {
  await expect(
    entityService.getEntities('invalid-workspace', 'user-id')
  ).rejects.toThrow('You do not have permission to access this workspace');
});

// Test CRUD operations
test('should create entity successfully', async () => {
  const entity = await entityService.createEntity(
    { name: 'Test Entity' },
    'workspace-id',
    'user-id'
  );
  
  expect(entity).toHaveProperty('id');
  expect(entity.name).toBe('Test Entity');
});
```

### Router Testing

```typescript
// Test authentication
test('should require authentication', async () => {
  const response = await app.request('/api/entities');
  expect(response.status).toBe(401);
});

// Test successful operations
test('should list entities', async () => {
  const response = await app.request('/api/entities?workspace_id=123', {
    headers: { Authorization: 'Bearer valid-token' }
  });
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty('entities');
});
```

## Migration Checklist

When migrating a new domain to Hono:

### Pre-Migration
- [ ] Analyze existing SvelteKit route structure
- [ ] Identify all endpoints and their functionality
- [ ] Review database schema and relationships
- [ ] Document current request/response formats

### Implementation
- [ ] Create service.ts with all business logic
- [ ] Create routes.ts with Hono router
- [ ] Define Zod validation schemas
- [ ] Implement error handling
- [ ] Add router to main app

### Testing
- [ ] Test all CRUD operations
- [ ] Verify authentication and authorization
- [ ] Test input validation
- [ ] Confirm error responses
- [ ] Test pagination and search

### Deployment
- [ ] Update environment variables if needed
- [ ] Deploy and monitor performance
- [ ] Verify frontend compatibility
- [ ] Monitor error logs

## Performance Optimization

### Database Queries
- Use selective column selection when possible
- Implement proper indexes for search fields
- Use joins efficiently for related data
- Consider query result caching for expensive operations

### Response Optimization
- Return minimal data for list operations
- Use pagination for large datasets
- Implement field selection (sparse fieldsets)
- Compress responses when appropriate

### Memory Management
- Use connection pooling
- Avoid loading unnecessary related data
- Implement proper cleanup for long-running operations
- Monitor memory usage in production

This guide provides the foundation for implementing consistent, performant, and maintainable Hono API routes within our application architecture.