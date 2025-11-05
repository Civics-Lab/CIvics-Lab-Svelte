<script lang="ts">
  import type { Form } from '$lib/types/form';

  export let form: Form;
  export let onEdit: (id: string) => void = () => {};
  export let onDuplicate: (id: string) => void = () => {};
  export let onArchive: (id: string) => void = () => {};
  export let onDelete: (id: string) => void = () => {};

  let showActions = false;

  function getTypeLabel(type: string): string {
    switch (type) {
      case 'donation':
        return 'Donation';
      case 'product':
        return 'Product';
      case 'subscription':
        return 'Subscription';
      default:
        return type;
    }
  }

  function getTypeColor(type: string): string {
    switch (type) {
      case 'donation':
        return 'bg-green-100 text-green-800';
      case 'product':
        return 'bg-blue-100 text-blue-800';
      case 'subscription':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function copyPublicUrl() {
    const url = `${window.location.origin}/forms/${form.slug}`;
    navigator.clipboard.writeText(url);
    // TODO: Show toast notification
    alert('Public URL copied to clipboard!');
  }
</script>

<div class="form-card bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
  <!-- Header -->
  <div class="flex items-start justify-between mb-4">
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-2">
        <h3 class="text-lg font-semibold text-gray-900">{form.name}</h3>
        {#if !form.isActive}
          <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            Archived
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-1 text-xs font-medium rounded {getTypeColor(form.type)}">
          {getTypeLabel(form.type)}
        </span>
        <span class="text-xs text-gray-500">/forms/{form.slug}</span>
      </div>
    </div>

    <!-- Actions Dropdown -->
    <div class="relative">
      <button
        type="button"
        on:click={() => (showActions = !showActions)}
        class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        aria-label="More actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {#if showActions}
        <div
          class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
          on:click={() => (showActions = false)}
          on:keydown={() => (showActions = false)}
        >
          <button
            type="button"
            on:click={() => onEdit(form.id)}
            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            type="button"
            on:click={copyPublicUrl}
            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Copy Public URL
          </button>
          <button
            type="button"
            on:click={() => onDuplicate(form.id)}
            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </button>
          <button
            type="button"
            on:click={() => onArchive(form.id)}
            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            {form.isActive ? 'Archive' : 'Unarchive'}
          </button>
          <button
            type="button"
            on:click={() => onDelete(form.id)}
            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Stats -->
  <div class="flex items-center gap-4 text-sm text-gray-600">
    <div>
      <span class="font-medium">0</span> submissions
    </div>
    <div>
      <span class="font-medium">$0</span> raised
    </div>
    <div class="text-xs">
      Created {new Date(form.createdAt).toLocaleDateString()}
    </div>
  </div>

  <!-- Actions -->
  <div class="mt-4 pt-4 border-t border-gray-100 flex gap-2">
    <button
      type="button"
      on:click={() => onEdit(form.id)}
      class="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
    >
      Edit Form
    </button>
    <button
      type="button"
      on:click={copyPublicUrl}
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>
  </div>
</div>
