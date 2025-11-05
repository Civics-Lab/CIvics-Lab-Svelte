import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ parent }) => {
  const { user, currentWorkspace } = await parent();

  if (!user) {
    throw redirect(302, '/login');
  }

  if (!currentWorkspace) {
    throw redirect(302, '/app');
  }

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
    currentWorkspace,
    availableBindings
  };
};
