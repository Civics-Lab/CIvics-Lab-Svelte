<script lang="ts">
  import { goto } from '$app/navigation';
  import FormCard from '$lib/components/forms/FormCard.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let searchQuery = '';
  let showArchived = false;

  $: filteredForms = data.forms.filter((form) => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         form.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived || form.isActive;
    return matchesSearch && matchesArchived;
  });

  async function handleEdit(id: string) {
    goto(`/app/forms/${id}/edit`);
  }

  async function handleDuplicate(id: string) {
    if (!confirm('Duplicate this form?')) return;

    try {
      const response = await fetch(`/api/forms/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Reload page to show new form
        window.location.reload();
      } else {
        alert('Failed to duplicate form');
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      alert('Failed to duplicate form');
    }
  }

  async function handleArchive(id: string) {
    try {
      const response = await fetch(`/api/forms/${id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to archive form');
      }
    } catch (error) {
      console.error('Error archiving form:', error);
      alert('Failed to archive form');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form');
    }
  }

  function createNewForm() {
    goto('/app/forms/new');
  }
</script>

<div class="p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Forms</h1>
      <p class="text-sm text-gray-600 mt-1">
        Create and manage donation forms for your organization
      </p>
    </div>

    <button
      type="button"
      on:click={createNewForm}
      class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Create Form
    </button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-sm text-gray-600">Total Forms</p>
      <p class="text-2xl font-bold text-gray-900">{data.forms.length}</p>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-sm text-gray-600">Active Forms</p>
      <p class="text-2xl font-bold text-green-600">
        {data.forms.filter((f) => f.isActive).length}
      </p>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-sm text-gray-600">Total Submissions</p>
      <p class="text-2xl font-bold text-gray-900">0</p>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <p class="text-sm text-gray-600">Total Raised</p>
      <p class="text-2xl font-bold text-gray-900">$0</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
    <div class="flex items-center gap-4">
      <div class="flex-1 relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search forms..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          bind:checked={showArchived}
          class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span class="text-sm font-medium text-gray-700">Show archived</span>
      </label>
    </div>
  </div>

  <!-- Forms Grid -->
  {#if filteredForms.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredForms as form (form.id)}
        <FormCard
          {form}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      {/each}
    </div>
  {:else}
    <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
      {#if searchQuery}
        <p class="text-gray-600">No forms match your search</p>
      {:else if data.forms.length === 0}
        <div class="max-w-md mx-auto">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No forms yet</h3>
          <p class="text-gray-600 mb-6">
            Create your first donation form to start accepting contributions online
          </p>
          <button
            type="button"
            on:click={createNewForm}
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Create Your First Form
          </button>
        </div>
      {:else}
        <p class="text-gray-600">All forms are archived. Enable "Show archived" to see them.</p>
      {/if}
    </div>
  {/if}
</div>
