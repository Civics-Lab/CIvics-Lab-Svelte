import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const response = await fetch('/api/donors/subscriptions', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load subscriptions');
    }

    const data = await response.json();

    return {
      subscriptions: data.subscriptions
    };
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    return {
      subscriptions: []
    };
  }
};
