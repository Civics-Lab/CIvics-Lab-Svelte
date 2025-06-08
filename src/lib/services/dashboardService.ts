/**
 * Service for dashboard-related aggregate data
 */

export interface DashboardStats {
  totalContacts: number;
  totalBusinesses: number;
  totalDonations: number;
  totalDonationAmount: number;
}

/**
 * Fetch aggregate dashboard statistics for a workspace
 */
export async function fetchDashboardStats(workspaceId: string): Promise<DashboardStats> {
  try {
    console.log('Fetching dashboard stats for workspace ID:', workspaceId);
    
    const response = await fetch(`/api/dashboard/stats?workspace_id=${workspaceId}`);
    console.log('Dashboard stats API response status:', response.status);
    
    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.message || 'Failed to fetch dashboard stats');
      } catch (jsonError) {
        // If the response body isn't valid JSON
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('Dashboard stats:', data);
    
    return {
      totalContacts: data.totalContacts || 0,
      totalBusinesses: data.totalBusinesses || 0,
      totalDonations: data.totalDonations || 0,
      totalDonationAmount: data.totalDonationAmount || 0
    };
  } catch (error) {
    console.error('Error in fetchDashboardStats:', error);
    // Return default stats on error to prevent UI breaking
    return {
      totalContacts: 0,
      totalBusinesses: 0,
      totalDonations: 0,
      totalDonationAmount: 0
    };
  }
}
