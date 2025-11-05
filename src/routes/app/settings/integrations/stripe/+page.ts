import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ parent, fetch }) => {
  const { user, currentWorkspace } = await parent();

  if (!user) {
    throw redirect(302, '/login');
  }

  if (!currentWorkspace) {
    throw redirect(302, '/app');
  }

  try {
    // Fetch existing Stripe config
    const response = await fetch(`/api/stripe/config?workspace_id=${currentWorkspace.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    let config = null;
    if (response.ok) {
      const data = await response.json();
      config = data.config;
    }

    return {
      currentWorkspace,
      config
    };
  } catch (error) {
    console.error('Error loading Stripe config:', error);
    return {
      currentWorkspace,
      config: null
    };
  }
};
