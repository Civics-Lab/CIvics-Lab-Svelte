import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    // Fetch public form data by slug
    const formResponse = await fetch(`/api/forms/public/${params.slug}`);

    if (!formResponse.ok) {
      throw error(404, 'Form not found');
    }

    const formData = await formResponse.json();

    return {
      form: formData.form,
      workspace: formData.workspace,
      linkedItem: formData.linkedItem,
      availableBindings: formData.availableBindings
    };
  } catch (err) {
    console.error('Error loading public form:', err);
    throw error(404, 'Form not found or inactive');
  }
};
