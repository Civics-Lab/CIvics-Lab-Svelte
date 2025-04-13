import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users, workspaces, userWorkspaces, contacts, businesses, donations } from '$lib/db/drizzle/schema';

export const resolvers = {
  Query: {
    // User queries
    me: async (_, __, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return user;
    },
    
    user: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Admin can view any user
      if (context.user.role === 'admin') {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      
      // Regular users can only view users in their workspaces
      const [user] = await db.select().from(users)
        .where(eq(users.id, id))
        .innerJoin(userWorkspaces, eq(userWorkspaces.userId, users.id))
        .innerJoin(
          userWorkspaces,
          and(
            eq(userWorkspaces.workspaceId, userWorkspaces.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      return user;
    },
    
    workspaceUsers: async (_, { workspaceId }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0) {
        throw new Error('Access denied');
      }
      
      // Get all users in the workspace
      const workspaceUsersList = await db.select({
        user: users
      })
      .from(users)
      .innerJoin(
        userWorkspaces,
        and(
          eq(userWorkspaces.userId, users.id),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      );
      
      return workspaceUsersList.map(item => item.user);
    },
    
    // Workspace queries
    workspace: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, id),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      return workspace;
    },
    
    myWorkspaces: async (_, __, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Get all workspaces where user is a member
      const userWorkspaces = await db.select({
        workspace: workspaces
      })
      .from(workspaces)
      .innerJoin(
        userWorkspaces,
        and(
          eq(userWorkspaces.workspaceId, workspaces.id),
          eq(userWorkspaces.userId, userId)
        )
      );
      
      return userWorkspaces.map(item => item.workspace);
    },
    
    // Contact queries with workspace validation
    contact: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
      
      if (!contact) {
        return null;
      }
      
      // Check if user has access to contact's workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, contact.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      return contact;
    },
    
    workspaceContacts: async (_, { workspaceId }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      return db.select().from(contacts).where(eq(contacts.workspaceId, workspaceId));
    },
    
    // Business queries with workspace validation
    business: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
      
      if (!business) {
        return null;
      }
      
      // Check if user has access to business's workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, business.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      return business;
    },
    
    workspaceBusinesses: async (_, { workspaceId }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      return db.select().from(businesses).where(eq(businesses.workspaceId, workspaceId));
    },
    
    // Donation queries with workspace validation
    donation: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      const [donation] = await db.select().from(donations).where(eq(donations.id, id));
      
      if (!donation) {
        return null;
      }
      
      // Check if user has access to donation's workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, donation.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      return donation;
    },
    
    workspaceDonations: async (_, { workspaceId }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      return db.select().from(donations).where(eq(donations.workspaceId, workspaceId));
    }
  },
  
  Mutation: {
    // Workspace mutations
    createWorkspace: async (_, { input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Create workspace
      const [workspace] = await db.insert(workspaces)
        .values({
          name: input.name,
          slug: input.slug,
          ownerId: userId,
          settings: input.settings ? JSON.parse(input.settings) : null
        })
        .returning();
      
      // Add owner as member
      await db.insert(userWorkspaces)
        .values({
          workspaceId: workspace.id,
          userId,
          role: 'owner'
        });
      
      return workspace;
    },
    
    updateWorkspace: async (_, { id, input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user is owner or admin
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.ownerId !== userId && context.user.role !== 'admin') {
        throw new Error('Only workspace owner can update workspace');
      }
      
      // Update workspace
      const [updatedWorkspace] = await db.update(workspaces)
        .set({
          name: input.name,
          slug: input.slug,
          settings: input.settings ? JSON.parse(input.settings) : workspace.settings,
          updatedAt: new Date()
        })
        .where(eq(workspaces.id, id))
        .returning();
      
      return updatedWorkspace;
    },
    
    deleteWorkspace: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user is owner or admin
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.ownerId !== userId && context.user.role !== 'admin') {
        throw new Error('Only workspace owner can delete workspace');
      }
      
      // Delete all related records (cascade)
      await db.delete(userWorkspaces).where(eq(userWorkspaces.workspaceId, id));
      await db.delete(contacts).where(eq(contacts.workspaceId, id));
      await db.delete(businesses).where(eq(businesses.workspaceId, id));
      await db.delete(donations).where(eq(donations.workspaceId, id));
      
      // Delete workspace
      await db.delete(workspaces).where(eq(workspaces.id, id));
      
      return true;
    },
    
    addWorkspaceMember: async (_, { workspaceId, input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user is owner or admin
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      const [userRole] = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (workspace.ownerId !== userId && 
          (userRole?.role !== 'admin' && context.user.role !== 'admin')) {
        throw new Error('Only workspace owner or admin can add members');
      }
      
      // Check if user exists
      const [userToAdd] = await db.select().from(users).where(eq(users.id, input.userId));
      
      if (!userToAdd) {
        throw new Error('User not found');
      }
      
      // Check if user is already a member
      const existingMember = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, input.userId)
          )
        );
      
      if (existingMember.length > 0) {
        throw new Error('User is already a member of this workspace');
      }
      
      // Add member
      const [newMember] = await db.insert(userWorkspaces)
        .values({
          workspaceId,
          userId: input.userId,
          role: input.role
        })
        .returning();
      
      return newMember;
    },
    
    removeWorkspaceMember: async (_, { workspaceId, userId: memberUserId }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user is owner or admin
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      const [userRole] = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (workspace.ownerId !== userId && 
          (userRole?.role !== 'admin' && context.user.role !== 'admin')) {
        throw new Error('Only workspace owner or admin can remove members');
      }
      
      // Cannot remove workspace owner
      if (workspace.ownerId === memberUserId) {
        throw new Error('Cannot remove workspace owner');
      }
      
      // Remove member
      await db.delete(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, workspaceId),
            eq(userWorkspaces.userId, memberUserId)
          )
        );
      
      return true;
    },
    
    // Contact mutations
    createContact: async (_, { input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, input.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Create contact
      const [contact] = await db.insert(contacts)
        .values({
          ...input,
          createdById: userId
        })
        .returning();
      
      return contact;
    },
    
    updateContact: async (_, { id, input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if contact exists
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, contact.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Update contact
      const [updatedContact] = await db.update(contacts)
        .set({
          ...input,
          updatedAt: new Date()
        })
        .where(eq(contacts.id, id))
        .returning();
      
      return updatedContact;
    },
    
    deleteContact: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if contact exists
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, contact.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Delete contact
      await db.delete(contacts).where(eq(contacts.id, id));
      
      return true;
    },
    
    // Business mutations
    createBusiness: async (_, { input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, input.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Create business
      const [business] = await db.insert(businesses)
        .values({
          ...input,
          createdById: userId
        })
        .returning();
      
      return business;
    },
    
    updateBusiness: async (_, { id, input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if business exists
      const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
      
      if (!business) {
        throw new Error('Business not found');
      }
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, business.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Update business
      const [updatedBusiness] = await db.update(businesses)
        .set({
          ...input,
          updatedAt: new Date()
        })
        .where(eq(businesses.id, id))
        .returning();
      
      return updatedBusiness;
    },
    
    deleteBusiness: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if business exists
      const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
      
      if (!business) {
        throw new Error('Business not found');
      }
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, business.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Delete business
      await db.delete(businesses).where(eq(businesses.id, id));
      
      return true;
    },
    
    // Donation mutations
    createDonation: async (_, { input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, input.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Create donation
      const [donation] = await db.insert(donations)
        .values({
          ...input,
          createdById: userId
        })
        .returning();
      
      return donation;
    },
    
    updateDonation: async (_, { id, input }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if donation exists
      const [donation] = await db.select().from(donations).where(eq(donations.id, id));
      
      if (!donation) {
        throw new Error('Donation not found');
      }
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, donation.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Update donation
      const [updatedDonation] = await db.update(donations)
        .set({
          ...input,
          updatedAt: new Date()
        })
        .where(eq(donations.id, id))
        .returning();
      
      return updatedDonation;
    },
    
    deleteDonation: async (_, { id }, context) => {
      const userId = context.user.id;
      if (!userId) throw new Error('Authentication required');
      
      // Check if donation exists
      const [donation] = await db.select().from(donations).where(eq(donations.id, id));
      
      if (!donation) {
        throw new Error('Donation not found');
      }
      
      // Check if user has access to workspace
      const userWorkspace = await db.select().from(userWorkspaces)
        .where(
          and(
            eq(userWorkspaces.workspaceId, donation.workspaceId),
            eq(userWorkspaces.userId, userId)
          )
        );
      
      if (userWorkspace.length === 0 && context.user.role !== 'admin') {
        throw new Error('Access denied');
      }
      
      // Delete donation
      await db.delete(donations).where(eq(donations.id, id));
      
      return true;
    }
  },
  
  // Field resolvers
  Workspace: {
    owner: async (parent) => {
      const [owner] = await db.select().from(users).where(eq(users.id, parent.ownerId));
      return owner;
    },
    
    members: async (parent) => {
      return db.select().from(userWorkspaces).where(eq(userWorkspaces.workspaceId, parent.id));
    }
  },
  
  WorkspaceUser: {
    workspace: async (parent) => {
      const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, parent.workspaceId));
      return workspace;
    },
    
    user: async (parent) => {
      const [user] = await db.select().from(users).where(eq(users.id, parent.userId));
      return user;
    }
  },
  
  Contact: {
    createdBy: async (parent) => {
      if (!parent.createdById) return null;
      const [user] = await db.select().from(users).where(eq(users.id, parent.createdById));
      return user;
    }
  },
  
  Business: {
    createdBy: async (parent) => {
      if (!parent.createdById) return null;
      const [user] = await db.select().from(users).where(eq(users.id, parent.createdById));
      return user;
    }
  },
  
  Donation: {
    createdBy: async (parent) => {
      if (!parent.createdById) return null;
      const [user] = await db.select().from(users).where(eq(users.id, parent.createdById));
      return user;
    }
  }
};
