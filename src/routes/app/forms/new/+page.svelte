<script lang="ts">
  import { goto } from '$app/navigation';
  import FormBuilder from '$lib/components/forms/FormBuilder.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  async function handleSave(formData: any) {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          workspaceId: data.currentWorkspace.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const result = await response.json();

      // Navigate to forms list
      goto('/app/forms');
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  }

  function handleCancel() {
    goto('/app/forms');
  }
</script>

<FormBuilder
  workspaceId={data.currentWorkspace.id}
  availableBindings={data.availableBindings}
  onSave={handleSave}
  onCancel={handleCancel}
/>
