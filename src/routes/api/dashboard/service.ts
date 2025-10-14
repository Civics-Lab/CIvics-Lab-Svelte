import { db } from '$lib/server/db';
import { contacts, businesses, donations } from '$lib/db/drizzle/schema';
import { eq, count, sum } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';

export const dashboardService = {
  async getDashboardStats(workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    // Get total contacts count for the workspace
    const contactsResult = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    const totalContacts = contactsResult[0]?.count || 0;
    
    // Get total businesses count for the workspace
    const businessesResult = await db
      .select({ count: count() })
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    const totalBusinesses = businessesResult[0]?.count || 0;
    
    // Get donations count and total amount for contacts in this workspace
    const contactDonationsResult = await db
      .select({ 
        count: count(),
        totalAmount: sum(donations.amount)
      })
      .from(donations)
      .innerJoin(contacts, eq(donations.contactId, contacts.id))
      .where(eq(contacts.workspaceId, workspaceId));
    
    // Get donations count and total amount for businesses in this workspace
    const businessDonationsResult = await db
      .select({ 
        count: count(),
        totalAmount: sum(donations.amount)
      })
      .from(donations)
      .innerJoin(businesses, eq(donations.businessId, businesses.id))
      .where(eq(businesses.workspaceId, workspaceId));
    
    // Calculate totals
    const contactDonationsCount = contactDonationsResult[0]?.count || 0;
    const contactDonationsAmount = contactDonationsResult[0]?.totalAmount || 0;
    const businessDonationsCount = businessDonationsResult[0]?.count || 0;
    const businessDonationsAmount = businessDonationsResult[0]?.totalAmount || 0;
    
    const totalDonations = Number(contactDonationsCount) + Number(businessDonationsCount);
    const totalDonationAmount = Number(contactDonationsAmount) + Number(businessDonationsAmount);
    
    console.log('Dashboard stats calculated:', {
      workspaceId,
      totalContacts,
      totalBusinesses,
      totalDonations,
      totalDonationAmount,
      contactDonationsCount,
      contactDonationsAmount,
      businessDonationsCount,
      businessDonationsAmount
    });
    
    return {
      totalContacts,
      totalBusinesses,
      totalDonations,
      totalDonationAmount
    };
  }
};