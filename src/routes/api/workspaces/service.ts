import { db, workspaces, userWorkspaces } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';

export interface CreateWorkspaceData {
  name: string;
  userId: string;
}

export interface GetUserWorkspacesData {
  userId: string;
}

export const workspaceService = {
  /**
   * Create a new workspace and assign creator as Super Admin
   */
  async createWorkspace({ name, userId }: CreateWorkspaceData) {
    // Create the workspace
    const [workspace] = await db.insert(workspaces)
      .values({
        name,
        createdById: userId
      })
      .returning();
    
    // Create user-workspace relationship with Super Admin role
    const [userWorkspace] = await db.insert(userWorkspaces)
      .values({
        userId,
        workspaceId: workspace.id,
        role: 'Super Admin'
      })
      .returning();
    
    return {
      workspace,
      userWorkspace
    };
  },
  
  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces({ userId }: GetUserWorkspacesData) {
    const userWorkspacesData = await db.select({
      userWorkspace: userWorkspaces,
      workspace: workspaces
    })
    .from(userWorkspaces)
    .innerJoin(workspaces, eq(userWorkspaces.workspaceId, workspaces.id))
    .where(eq(userWorkspaces.userId, userId));
    
    return userWorkspacesData.map(({ userWorkspace, workspace }) => ({
      workspace,
      role: userWorkspace.role
    }));
  },
  
  /**
   * Check if a user has any workspaces
   */
  async hasWorkspaces({ userId }: GetUserWorkspacesData) {
    const count = await db.select({ count: db.fn.count() })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, userId));
    
    return count[0].count > 0;
  },
  
  /**
   * Get a specific workspace
   */
  async getWorkspace(workspaceId: string) {
    const [workspace] = await db.select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
    
    return workspace;
  },
  
  /**
   * Check if user is a member of a workspace
   */
  async isWorkspaceMember(userId: string, workspaceId: string) {
    const [userWorkspace] = await db.select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      );
    
    return !!userWorkspace;
  }
};
