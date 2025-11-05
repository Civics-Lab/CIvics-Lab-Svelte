import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const response = await fetch(
      `/api/donors/contributions?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load contributions');
    }

    const data = await response.json();

    return {
      contributions: data.contributions,
      total: data.total,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error loading contributions:', error);
    return {
      contributions: [],
      total: 0,
      limit,
      offset
    };
  }
};
