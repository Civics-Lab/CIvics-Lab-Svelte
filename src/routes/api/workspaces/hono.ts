import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { db } from '$lib/db/drizzle';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '$lib/middleware/auth';

// Create a new Hono app for workspaces routes
const app = new Hono()
  // Apply authentication middleware to all routes
  .use('*', auth);

// GET /api/workspaces - Get all workspaces for the current user
app.get('/', async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // First, get all workspace IDs the user has access to
    const userWorkspaceData = await db
      .select({ workspaceId: userWorkspaces.workspaceId, role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, user.id));
    
    if (!userWorkspaceData.length) {
      return c.json({ workspaces: [] });
    }
    
    // Extract workspace IDs
    const workspaceIds = userWorkspaceData.map(uw => uw.workspaceId);
    
    // Fetch the actual workspace data
    const workspaceData = await db
      .select()
      .from(workspaces)
      .where(inArray(workspaces.id, workspaceIds));
    
    // Combine workspace data with user roles
    const enrichedWorkspaces = workspaceData.map(workspace => {
      const userWorkspace = userWorkspaceData.find(uw => uw.workspaceId === workspace.id);
      return {
        ...workspace,
        userRole: userWorkspace ? userWorkspace.role : null
      };
    });
    
    return c.json({ workspaces: enrichedWorkspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return c.json({ error: 'Failed to fetch workspaces' }, 500);
  }
});

// Export the Hono app
export default app;

// POST /api/workspaces - Create a new workspace
app.post('/', async (c) => {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  try {
    // Get the name from the request body
    const { name } = await c.req.json();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return c.json({ error: 'Workspace name is required' }, 400);
    }
    
    // Insert the new workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: name.trim(),
        createdBy: user.id
      })
      .returning();
    
    if (!newWorkspace) {
      throw new Error('Failed to create workspace');
    }
    
    // Add user to workspace with Super Admin role
    await db
      .insert(userWorkspaces)
      .values({
        userId: user.id,
        workspaceId: newWorkspace.id,
        role: 'Super Admin'
      });
    
    return c.json({ workspace: newWorkspace }, 201);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return c.json({ error: 'Failed to create workspace' }, 500);
  }
});

// Export the handle function for Vercel
export const GET = handle(app);
export const POST = handle(app);
