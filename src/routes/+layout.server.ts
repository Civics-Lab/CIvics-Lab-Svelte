// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  // Get user from locals (set in hooks.server.ts)
  const user = locals.user || null;
  const token = locals.token || null;
  
  // Initialize workspaces as an empty array
  let userWorkspacesList = [];
  let currentWorkspace = locals.currentWorkspace || null;
  
  if (user) {
    try {
      // Fetch user's workspaces
      // Fetch user's workspaces
      if (userWorkspaces) {
        try {
          const results = await db.select()
            .from(userWorkspaces)
            .leftJoin(workspaces, eq(userWorkspaces.workspaceId, workspaces.id))
            .where(eq(userWorkspaces.userId, user.id));
            
          userWorkspacesList = results.map(item => ({
            id: item.user_workspaces.id,
            userId: item.user_workspaces.userId,
            workspaceId: item.user_workspaces.workspaceId,
            role: item.user_workspaces.role,
            createdAt: item.user_workspaces.createdAt,
            updatedAt: item.user_workspaces.updatedAt,
            workspace: {
              id: item.workspaces.id,
              name: item.workspaces.name,
              createdAt: item.workspaces.createdAt,
              updatedAt: item.workspaces.updatedAt,
              createdById: item.workspaces.createdBy
            }
          }));
        } catch (queryError) {
          console.error('Error querying userWorkspaces:', queryError);
        }
      } else {
        console.warn('userWorkspaces table is not defined - skipping workspaces query');
      }
      
      // Map to desired format
      const workspacesList = userWorkspacesList.map(uw => ({
        id: uw.workspace.id,
        name: uw.workspace.name,
        role: uw.role,
        createdAt: uw.workspace.createdAt,
        updatedAt: uw.workspace.updatedAt,
        createdById: uw.workspace.createdById
      }));
      
      // If no current workspace is set but we have workspaces, set the first one as current
      if (!currentWorkspace && workspacesList.length > 0) {
        // Try to get workspace from cookie
        const workspaceId = cookies.get('currentWorkspaceId');
        
        if (workspaceId) {
          const workspace = workspacesList.find(w => w.id === workspaceId);
          if (workspace) {
            currentWorkspace = workspace;
          }
        }
        
        // Fallback to first workspace
        if (!currentWorkspace) {
          currentWorkspace = workspacesList[0];
        }
      }
      
      return {
        session: token ? { active: true } : null,
        user,
        token,
        workspaces: workspacesList,
        currentWorkspace
      };
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      
      // Return just user info if workspace fetch fails
      return {
        session: token ? { active: true } : null,
        user,
        token,
        workspaces: [],
        currentWorkspace: null
      };
    }
  }
  
  // Return minimal data if not authenticated
  return {
    session: null,
    user: null,
    token: null,
    workspaces: [],
    currentWorkspace: null
  };
}