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
    // Fetch form settings
    const response = await fetch(`/api/forms/settings?workspace_id=${currentWorkspace.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    let settings = null;
    if (response.ok) {
      const data = await response.json();
      settings = data.settings;
    }

    // Get available field bindings
    const availableBindings = {
      org_name: currentWorkspace.name || 'Organization Name',
      ein: currentWorkspace.ein || 'Tax ID (EIN)',
      address: currentWorkspace.address || 'Organization Address',
      city: currentWorkspace.city || 'City',
      state: currentWorkspace.state || 'State',
      zip: currentWorkspace.zipCode || 'ZIP Code',
      phone: currentWorkspace.phone || 'Phone Number',
      email: currentWorkspace.email || 'Email Address',
      website: currentWorkspace.website || 'Website URL',
      year: new Date().getFullYear().toString(),
      date: new Date().toLocaleDateString()
    };

    return {
      currentWorkspace,
      settings,
      availableBindings
    };
  } catch (error) {
    console.error('Error loading form settings:', error);
    return {
      currentWorkspace,
      settings: null,
      availableBindings: {}
    };
  }
};
