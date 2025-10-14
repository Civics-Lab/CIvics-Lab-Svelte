import { isGlobalSuperAdmin } from '$lib/server/auth';

export const adminService = {
  async checkAdminAccess(userId: string) {
    if (!userId) {
      throw new Error('Authentication required');
    }
    
    const isSuperAdmin = await isGlobalSuperAdmin(userId);
    
    if (!isSuperAdmin) {
      throw new Error('Forbidden - Requires Super Admin privileges');
    }
    
    return {
      hasAccess: true,
      isGlobalSuperAdmin: true
    };
  }
};