import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
  const { contact } = await parent();

  try {
    // Fetch recent contributions
    const contributionsResponse = await fetch(`/api/donors/contributions/recent?limit=5`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const contributionsData = contributionsResponse.ok
      ? await contributionsResponse.json()
      : { contributions: [] };

    // Fetch active subscriptions
    const subscriptionsResponse = await fetch(`/api/donors/subscriptions?status=active`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const subscriptionsData = subscriptionsResponse.ok
      ? await subscriptionsResponse.json()
      : { subscriptions: [] };

    // Fetch contribution summary
    const summaryResponse = await fetch(`/api/donors/summary`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    const summaryData = summaryResponse.ok ? await summaryResponse.json() : { summary: {} };

    return {
      recentContributions: contributionsData.contributions,
      activeSubscriptions: subscriptionsData.subscriptions,
      summary: summaryData.summary,
      contact
    };
  } catch (error) {
    console.error('Error loading donor dashboard:', error);
    return {
      recentContributions: [],
      activeSubscriptions: [],
      summary: {},
      contact
    };
  }
};
