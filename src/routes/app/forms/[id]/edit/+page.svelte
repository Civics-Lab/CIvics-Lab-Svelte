<script lang="ts">
  import { goto } from '$app/navigation';
  import FormBuilder from '$lib/components/forms/FormBuilder.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  async function handleSave(formData: any) {
    try {
      const response = await fetch(`/api/forms/${data.form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update form');
      }

      // Navigate back to forms list
      goto('/app/forms');
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  }

  function handleCancel() {
    goto('/app/forms');
  }
</script>

<FormBuilder
  form={data.form}
  workspaceId={data.currentWorkspace.id}
  availableBindings={data.availableBindings}
  onSave={handleSave}
  onCancel={handleCancel}
/>
