import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user, currentWorkspace } = await parent();

  if (!user) {
    throw redirect(302, '/login');
  }

  if (!currentWorkspace) {
    throw redirect(302, '/app');
  }

  try {
    const response = await fetch(
      `/api/forms?workspace_id=${currentWorkspace.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch forms');
    }

    const data = await response.json();

    return {
      forms: data.forms || []
    };
  } catch (error) {
    console.error('Error loading forms:', error);
    return {
      forms: []
    };
  }
};
