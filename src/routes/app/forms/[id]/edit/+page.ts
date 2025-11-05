import type { PageLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { user, currentWorkspace } = await parent();

  if (!user) {
    throw redirect(302, '/login');
  }

  if (!currentWorkspace) {
    throw redirect(302, '/app');
  }

  try {
    const response = await fetch(`/api/forms/${params.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw error(404, 'Form not found');
    }

    const data = await response.json();

    // Get available field bindings
    const availableBindings = {
      org_name: currentWorkspace.name || 'Organization Name',
      ein: 'Tax ID (EIN)',
      address: 'Organization Address',
      city: 'City',
      state: 'State',
      zip: 'ZIP Code',
      phone: 'Phone Number',
      email: 'Email Address',
      website: 'Website URL',
      year: new Date().getFullYear().toString(),
      date: new Date().toLocaleDateString()
    };

    return {
      form: data.form,
      currentWorkspace,
      availableBindings
    };
  } catch (err) {
    console.error('Error loading form:', err);
    throw error(404, 'Form not found');
  }
};
