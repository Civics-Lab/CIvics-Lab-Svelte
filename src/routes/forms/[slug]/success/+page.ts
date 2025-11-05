import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, url, fetch }) => {
  const submissionId = url.searchParams.get('submission');

  if (!submissionId) {
    throw error(400, 'Missing submission ID');
  }

  try {
    // Fetch form data
    const formResponse = await fetch(`/api/forms/public/${params.slug}`);

    if (!formResponse.ok) {
      throw error(404, 'Form not found');
    }

    const formData = await formResponse.json();

    // Fetch submission details
    const submissionResponse = await fetch(`/api/forms/submissions/${submissionId}/public`);

    if (!submissionResponse.ok) {
      throw error(404, 'Submission not found');
    }

    const submissionData = await submissionResponse.json();

    return {
      form: formData.form,
      workspace: formData.workspace,
      submission: submissionData.submission
    };
  } catch (err) {
    console.error('Error loading success page:', err);
    throw error(404, 'Page not found');
  }
};
