import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ parent, fetch, url }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, '/login');
  }

  // Check if user is super admin
  try {
    const accessResponse = await fetch('/api/admin/access', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!accessResponse.ok) {
      throw redirect(302, '/app');
    }

    // Get query parameters
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const workspaceId = url.searchParams.get('workspace_id') || '';
    const status = url.searchParams.get('status') || '';
    const type = url.searchParams.get('type') || '';

    // Build query string
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    if (workspaceId) params.set('workspace_id', workspaceId);
    if (status) params.set('status', status);
    if (type) params.set('type', type);

    // Fetch transactions
    const transactionsResponse = await fetch(
      `/api/admin/financial/transactions?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const transactionsData = transactionsResponse.ok
      ? await transactionsResponse.json()
      : { transactions: [], total: 0 };

    // Fetch workspaces for filter
    const workspacesResponse = await fetch('/api/workspaces', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const workspacesData = workspacesResponse.ok
      ? await workspacesResponse.json()
      : { workspaces: [] };

    return {
      transactions: transactionsData.transactions,
      total: transactionsData.total,
      workspaces: workspacesData.workspaces,
      filters: {
        workspaceId,
        status,
        type,
        limit,
        offset
      }
    };
  } catch (error) {
    console.error('Error loading transactions:', error);
    throw redirect(302, '/app');
  }
};
