import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutLoad = async ({ parent, fetch }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, '/login');
  }

  // Fetch donor profile data (contact info)
  try {
    const response = await fetch('/api/donors/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load donor profile');
    }

    const data = await response.json();

    return {
      user,
      contact: data.contact
    };
  } catch (error) {
    console.error('Error loading donor portal:', error);
    throw redirect(302, '/app');
  }
};
