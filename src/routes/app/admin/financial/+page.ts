import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ parent, fetch }) => {
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

    // Fetch financial overview
    const overviewResponse = await fetch('/api/admin/financial/overview', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const overviewData = overviewResponse.ok
      ? await overviewResponse.json()
      : { overview: {} };

    // Fetch recent transactions
    const transactionsResponse = await fetch('/api/admin/financial/transactions?limit=10', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const transactionsData = transactionsResponse.ok
      ? await transactionsResponse.json()
      : { transactions: [] };

    return {
      overview: overviewData.overview,
      recentTransactions: transactionsData.transactions
    };
  } catch (error) {
    console.error('Error loading financial dashboard:', error);
    throw redirect(302, '/app');
  }
};
