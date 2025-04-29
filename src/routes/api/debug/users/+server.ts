// src/routes/api/debug/users/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users, userWorkspaces, workspaces } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// A route to check user data
// IMPORTANT: Only enable this in development mode, never in production!
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check if we're in development mode
  if (env.NODE_ENV !== 'development') {
    return json({
      success: false,
      message: 'Debug routes only available in development environment'
    }, { status: 403 });
  }
  
  const userId = url.searchParams.get('userId') || (locals.user?.id || '');
  
  if (!userId) {
    return json({
      success: false,
      message: 'No user ID provided'
    }, { status: 400 });
  }
  
  try {
    // Test if the user exists
    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, userId));
      
    const user = userResult[0];
    
    // If no user found
    if (!user) {
      return json({
        success: false,
        message: `User with ID ${userId} not found in database`,
        exists: false
      });
    }
    
    // Get workspaces for this user
    const userWorkspacesResult = await db.select({
        userWorkspaceId: userWorkspaces.id,
        workspaceId: userWorkspaces.workspaceId,
        role: userWorkspaces.role
      })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, userId));
    
    // Get workspace names
    const workspaceIds = userWorkspacesResult.map(uw => uw.workspaceId);
    
    let workspaceData = [];
    if (workspaceIds.length > 0) {
      const workspaceResults = await db.select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceIds[0])); // Just get the first one for simplicity
        
      workspaceData = workspaceResults;
    }
    
    // Hide sensitive information
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive
    };
    
    return json({
      success: true,
      data: {
        user: safeUser,
        exists: true,
        userWorkspaces: userWorkspacesResult,
        workspaces: workspaceData
      }
    });
  } catch (error) {
    console.error('Database check failed:', error);
    
    return json({
      success: false,
      error: 'Database check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
