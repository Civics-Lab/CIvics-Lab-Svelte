import { db } from '$lib/server/db';
import { workspaces, userWorkspaces, users } from '$lib/db/drizzle/schema';
import { eq, inArray, sql, and } from 'drizzle-orm';
import { isGlobalSuperAdmin, verifyWorkspaceAccess } from '$lib/server/auth';

export const workspaceService = {
  async createDefaultWorkspace(userId: string) {
    try {
      console.log(`Creating default workspace for user ${userId}`);
      
      const userExists = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId));
        
      if (!userExists || userExists.length === 0) {
        console.error(`User with ID ${userId} not found in database`);
        throw new Error(`User with ID ${userId} not found in database`);
      }
      
      const [newWorkspace] = await db
        .insert(workspaces)
        .values({
          name: 'My Workspace',
          createdBy: userId
        })
        .returning();
      
      if (!newWorkspace) {
        throw new Error('Failed to create default workspace');
      }
      
      await db
        .insert(userWorkspaces)
        .values({
          userId,
          workspaceId: newWorkspace.id,
          role: 'Super Admin'
        });
      
      console.log(`Default workspace created: ${newWorkspace.id}`);
      
      return newWorkspace;
    } catch (err) {
      console.error('Error creating default workspace:', err);
      throw err;
    }
  },

  async getWorkspacesForUser(userId: string) {
    console.log('Getting workspaces for user:', userId);
    
    const isSuperAdmin = await isGlobalSuperAdmin(userId);
    console.log(`User ${userId} is global super admin:`, isSuperAdmin);
    
    if (isSuperAdmin) {
      console.log('Fetching all workspaces for global super admin');
      const allWorkspaces = await db
        .select()
        .from(workspaces);
      
      console.log('Found workspaces for global super admin:', allWorkspaces.map(ws => ({ id: ws.id, name: ws.name })));
      
      const enrichedWorkspaces = allWorkspaces.map(workspace => ({
        ...workspace,
        userRole: 'Super Admin' as const
      }));
      
      return { 
        workspaces: enrichedWorkspaces,
        isGlobalSuperAdmin: true
      };
    }
    
    console.log('Querying user_workspaces for regular user:', userId);
    const userWorkspaceData = await db
      .select({ workspaceId: userWorkspaces.workspaceId, role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, userId));
    
    console.log('Found user workspaces:', userWorkspaceData);
    
    if (!userWorkspaceData.length) {
      console.log('No workspaces found for user:', userId);
      return { 
        workspaces: [],
        isGlobalSuperAdmin: false
      };
    }
    
    const workspaceIds = userWorkspaceData.map(uw => uw.workspaceId);
    console.log('Workspace IDs to fetch:', workspaceIds);
    
    const workspaceData = await db
      .select()
      .from(workspaces)
      .where(inArray(workspaces.id, workspaceIds));
    
    console.log('Fetched workspace data:', workspaceData.map(ws => ({ id: ws.id, name: ws.name })));
    
    const validWorkspaceData = workspaceData.filter(ws => ws !== null && ws !== undefined);
    
    if (workspaceIds.length > 0 && validWorkspaceData.length === 0) {
      console.warn('Found workspace relationships but no valid workspaces. Creating default workspace...');
      try {
        const defaultWorkspace = await this.createDefaultWorkspace(userId);
        
        return {
          workspaces: [{
            ...defaultWorkspace,
            userRole: 'Super Admin'
          }],
          isGlobalSuperAdmin: false
        };
      } catch (createErr) {
        console.error('Failed to create default workspace:', createErr);
        return { 
          workspaces: [],
          isGlobalSuperAdmin: false
        };
      }
    }
    
    const enrichedWorkspaces = validWorkspaceData.map(workspace => {
      const userWorkspace = userWorkspaceData.find(uw => uw.workspaceId === workspace.id);
      return {
        ...workspace,
        userRole: userWorkspace ? userWorkspace.role : null
      };
    });
    
    console.log('Returning enriched workspaces for regular user:', 
      enrichedWorkspaces.map(ws => ({ id: ws.id, name: ws.name, role: ws.userRole })));
    
    return { 
      workspaces: enrichedWorkspaces,
      isGlobalSuperAdmin: false
    };
  },

  async createWorkspace(userId: string, name: string) {
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!userExists || userExists.length === 0) {
      console.error(`User with ID ${userId} not found in database`);
      throw new Error('User not found in database');
    }
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Workspace name is required');
    }
    
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: name.trim(),
        createdBy: userId
      })
      .returning();
    
    if (!newWorkspace) {
      throw new Error('Failed to create workspace');
    }
    
    await db
      .insert(userWorkspaces)
      .values({
        userId: userId,
        workspaceId: newWorkspace.id,
        role: 'Super Admin'
      });
    
    return newWorkspace;
  },

  async getWorkspace(workspaceId: string, userId: string) {
    const { hasAccess, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}`);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const workspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspace.length) {
      throw new Error('Workspace not found');
    }
    
    return workspace[0];
  },

  async updateWorkspace(workspaceId: string, userId: string, updates: { name?: string }) {
    const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}, role=${role}`);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
      throw new Error('You do not have permission to update this workspace');
    }
    
    const workspaceCheck = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
      
    console.log('Direct workspace check result:', workspaceCheck);
      
    if (!workspaceCheck || workspaceCheck.length === 0) {
      console.error('Workspace not found in direct check');
      throw new Error('Workspace not found in database');
    }
    
    const updateData: Record<string, any> = {};
    
    if (updates.name && typeof updates.name === 'string' && updates.name.trim()) {
      updateData.name = updates.name.trim();
    }
    
    updateData.updatedAt = new Date();
    
    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      throw new Error('No valid update fields provided');
    }
    
    console.log('Applying updates:', updateData);
    
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set(updateData)
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      const workspaceAfterUpdate = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
        
      if (!workspaceAfterUpdate.length) {
        throw new Error('Workspace not found after update');
      }
      
      return workspaceAfterUpdate[0];
    }
    
    return updatedWorkspace;
  },

  async deleteWorkspace(workspaceId: string, userId: string) {
    console.log(`User ${userId} attempting to delete workspace ${workspaceId}`);
    
    const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}, role=${role}`);
    
    if (!exists) {
      console.error(`Workspace ${workspaceId} not found`);
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess || role !== 'Super Admin') {
      console.error(`User ${userId} does not have permission to delete workspace ${workspaceId}`);
      throw new Error('Only Super Admins can delete workspaces');
    }
    
    console.log(`Checking if workspace ${workspaceId} is the only workspace for user ${userId}`);
    
    const userWorkspacesResult = await db
      .select()
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, userId));
      
    console.log(`User has ${userWorkspacesResult.length} workspaces`);
    
    if (userWorkspacesResult.length === 1) {
      console.error(`Cannot delete the only workspace for user ${userId}`);
      throw new Error('Cannot delete your only workspace. Create a new workspace first.');
    }
    
    const referenceTables = [
      { table: 'user_workspaces', column: 'workspace_id' },
      { table: 'contacts', column: 'workspace_id' },
      { table: 'contact_tags', column: 'workspace_id' },
      { table: 'contact_views', column: 'workspace_id' },
      { table: 'businesses', column: 'workspace_id' },
      { table: 'business_views', column: 'workspace_id' },
      { table: 'donation_views', column: 'workspace_id' },
      { table: 'workspace_subscriptions', column: 'workspace_id' },
      { table: 'workspace_payments', column: 'workspace_id' }
    ];
    
    for (const ref of referenceTables) {
      try {
        console.log(`Deleting from ${ref.table} where ${ref.column} = ${workspaceId}`);
        await db.execute(sql`
          DELETE FROM ${sql.raw(ref.table)}
          WHERE ${sql.raw(ref.column)} = ${workspaceId}
        `);
        console.log(`Successfully deleted from ${ref.table}`);
      } catch (tableErr) {
        console.error(`Error deleting from ${ref.table}:`, tableErr);
      }
    }
    
    console.log(`Deleting workspace ${workspaceId}`);
    const result = await db
      .delete(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .returning({ id: workspaces.id });
    
    console.log(`Deletion result:`, result);
    
    if (!result.length) {
      console.log(`No rows deleted from workspaces table, attempting direct SQL delete`);
      const sqlResult = await db.execute(sql`
        DELETE FROM workspaces
        WHERE id = ${workspaceId}
        RETURNING id
      `);
      
      console.log(`SQL deletion result:`, sqlResult);
      
      if (sqlResult.rows.length === 0) {
        throw new Error('Workspace not found');
      }
    }
    
    console.log(`Successfully deleted workspace ${workspaceId}`);
    return { success: true };
  },

  async getDebugInfo(userId: string) {
    console.log(`DEBUG: Getting workspaces for user ${userId}`);
    
    const isSuperAdmin = await isGlobalSuperAdmin(userId);
    
    const userWorkspacesData = await db
      .select({
        userWorkspace: userWorkspaces,
        workspace: workspaces
      })
      .from(userWorkspaces)
      .innerJoin(workspaces, eq(userWorkspaces.workspaceId, workspaces.id))
      .where(eq(userWorkspaces.userId, userId));
    
    const debugData = userWorkspacesData.map(item => ({
      workspaceId: item.workspace.id,
      workspaceName: item.workspace.name,
      role: item.userWorkspace.role,
      userId: userId
    }));
    
    console.log('User workspaces:', debugData);
    
    return { 
      debug: debugData,
      isGlobalSuperAdmin: isSuperAdmin 
    };
  },

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
  },

  // Workspace Members Management
  async getWorkspaceMembers(workspaceId: string, userId: string) {
    // Verify user has access to this workspace
    const { hasAccess, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // Get workspace members
    const results = await db.select()
      .from(userWorkspaces)
      .leftJoin(users, eq(userWorkspaces.userId, users.id))
      .where(eq(userWorkspaces.workspaceId, workspaceId));
      
    const members = results.map(row => ({
      id: row.user_workspaces.id,
      userId: row.user_workspaces.userId,
      workspaceId: row.user_workspaces.workspaceId,
      role: row.user_workspaces.role,
      createdAt: row.user_workspaces.createdAt?.toISOString(),
      updatedAt: row.user_workspaces.updatedAt?.toISOString(),
      user: {
        id: row.users.id,
        email: row.users.email,
        username: row.users.username,
        displayName: row.users.displayName,
        avatar: row.users.avatar
      }
    }));
    
    return { members };
  },

  async addWorkspaceMember(workspaceId: string, userId: string, newUserId: string, memberRole?: string) {
    // Verify user has admin access to this workspace
    const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
      throw new Error('You do not have permission to add members to this workspace');
    }
    
    if (!newUserId) {
      throw new Error('User ID is required');
    }
    
    // Check if the user exists
    const userResults = await db.select()
      .from(users)
      .where(eq(users.id, newUserId))
      .limit(1);
      
    if (!userResults.length) {
      throw new Error('User not found');
    }
    
    // Check if user is already in the workspace
    const existingMemberResults = await db.select()
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, newUserId),
        eq(userWorkspaces.workspaceId, workspaceId)
      ))
      .limit(1);
    
    if (existingMemberResults.length) {
      throw new Error('User is already a member of this workspace');
    }
    
    // Add user to workspace
    const newMemberResults = await db.insert(userWorkspaces).values({
      userId: newUserId,
      workspaceId,
      role: memberRole || 'Basic User'
    }).returning();
    
    // Get the full member data to return
    const addedMemberResults = await db.select()
      .from(userWorkspaces)
      .leftJoin(users, eq(userWorkspaces.userId, users.id))
      .where(eq(userWorkspaces.id, newMemberResults[0].id))
      .limit(1);
      
    if (!addedMemberResults.length) {
      throw new Error('Failed to retrieve the added member');
    }
    
    const row = addedMemberResults[0];
    const member = {
      id: row.user_workspaces.id,
      userId: row.user_workspaces.userId,
      workspaceId: row.user_workspaces.workspaceId,
      role: row.user_workspaces.role,
      createdAt: row.user_workspaces.createdAt?.toISOString(),
      updatedAt: row.user_workspaces.updatedAt?.toISOString(),
      user: {
        id: row.users.id,
        email: row.users.email,
        username: row.users.username,
        displayName: row.users.displayName,
        avatar: row.users.avatar
      }
    };
    
    return { 
      message: 'User added to workspace',
      member
    };
  },

  async getWorkspaceMember(workspaceId: string, userId: string, memberId: string) {
    // Verify user has access to this workspace
    const { hasAccess, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // Get the specific workspace member
    const member = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, memberId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            username: true,
            displayName: true
          }
        }
      }
    });
    
    if (!member) {
      throw new Error('Member not found in this workspace');
    }
    
    // Convert dates to ISO strings for consistent serialization
    const serializedMember = {
      ...member,
      createdAt: member.createdAt?.toISOString(),
      updatedAt: member.updatedAt?.toISOString()
    };
    
    return { member: serializedMember };
  },

  async updateWorkspaceMemberRole(workspaceId: string, userId: string, memberId: string, newRole: string) {
    // Verify user has admin access to this workspace
    const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
      throw new Error('You do not have permission to update member roles in this workspace');
    }
    
    if (!newRole) {
      throw new Error('Role is required');
    }
    
    // Get the existing member relationship
    const memberRelationship = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, memberId)
      )
    });
    
    if (!memberRelationship) {
      throw new Error('Member not found in this workspace');
    }
    
    // Don't allow super admins to downgrade themselves
    if (memberId === userId && memberRelationship.role === 'Super Admin' && newRole !== 'Super Admin') {
      throw new Error('You cannot downgrade your own Super Admin role');
    }
    
    // Update the role
    const [updatedMember] = await db.update(userWorkspaces)
      .set({ role: newRole, updatedAt: new Date() })
      .where(and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, memberId)
      ))
      .returning();
    
    // Get the full updated member with user details
    const fullUpdatedMember = await db.query.userWorkspaces.findFirst({
      where: eq(userWorkspaces.id, updatedMember.id),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            username: true,
            displayName: true
          }
        }
      }
    });
    
    // Convert dates for serialization
    const serializedMember = {
      ...fullUpdatedMember,
      createdAt: fullUpdatedMember?.createdAt?.toISOString(),
      updatedAt: fullUpdatedMember?.updatedAt?.toISOString()
    };
    
    return { 
      message: 'Member role updated',
      member: serializedMember
    };
  },

  async removeWorkspaceMember(workspaceId: string, userId: string, memberId: string) {
    // Verify user has admin access to this workspace
    const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!exists) {
      throw new Error('Workspace not found');
    }
    
    if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
      throw new Error('You do not have permission to remove members from this workspace');
    }
    
    // Don't allow removing self
    if (memberId === userId) {
      throw new Error('You cannot remove yourself from the workspace');
    }
    
    // Get the user's workspace relationship
    const memberRelationship = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, memberId),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });
    
    if (!memberRelationship) {
      throw new Error('Member not found in this workspace');
    }
    
    // Delete the relationship
    const [removedMember] = await db.delete(userWorkspaces)
      .where(eq(userWorkspaces.id, memberRelationship.id))
      .returning();
    
    return {
      message: 'Member removed from workspace',
      removedMemberId: memberId
    };
  },

  async updateWorkspaceLogo(workspaceId: string, userId: string, logoFile: File) {
    // Verify user has admin access to this workspace
    const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
      throw new Error('You do not have permission to update this workspace');
    }
    
    if (!logoFile || !(logoFile instanceof File)) {
      throw new Error('No logo file provided');
    }
    
    // Convert file to base64 for storage
    const buffer = await logoFile.arrayBuffer();
    const base64Logo = `data:${logoFile.type};base64,${Buffer.from(buffer).toString('base64')}`;
    
    // Update the workspace with the logo
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({ 
        logo: base64Logo,
        updatedAt: new Date()
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      throw new Error('Workspace not found');
    }
    
    return { 
      logo: updatedWorkspace.logo 
    };
  },

  async removeWorkspaceLogo(workspaceId: string, userId: string) {
    // Verify user has admin access to this workspace
    const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, userId);
    
    if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
      throw new Error('You do not have permission to update this workspace');
    }
    
    // Update the workspace to remove the logo
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({ 
        logo: null,
        updatedAt: new Date()
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      throw new Error('Workspace not found');
    }
    
    return { success: true };
  }
};
