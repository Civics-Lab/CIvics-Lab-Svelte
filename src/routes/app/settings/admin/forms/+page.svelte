<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import BlockEditor from '$lib/components/forms/BlockEditor.svelte';
  import FieldBindingPicker from '$lib/components/forms/FieldBindingPicker.svelte';
  import type { PageData } from './$types';
  import type { EditorJsData } from '$lib/types/form';

  export let data: PageData;

  let defaultFooterContent: EditorJsData = data.settings?.defaultFooterTemplate || {
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: 'By contributing, you agree that your contribution is made voluntarily and not in exchange for goods or services.'
        }
      }
    ]
  };

  let footerEditor: BlockEditor;
  let isSaving = false;
  let showBindingPicker = false;

  function insertBinding(key: string, value: string) {
    // Insert binding into editor
    // This is a placeholder - actual implementation would need editor focus tracking
    alert(`Insert {{${key}}} into your content`);
    showBindingPicker = false;
  }

  async function handleSave() {
    isSaving = true;

    try {
      // Save the editor content
      const content = await footerEditor.save();

      const method = data.settings ? 'PUT' : 'POST';
      const url = data.settings
        ? `/api/forms/settings?workspace_id=${data.currentWorkspace.id}`
        : '/api/forms/settings';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          workspaceId: data.currentWorkspace.id,
          defaultFooterTemplate: content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save form settings');
      }

      alert('Form settings saved successfully!');
      goto('/app/settings');
    } catch (error) {
      console.error('Error saving form settings:', error);
      alert('Failed to save form settings. Please try again.');
    } finally {
      isSaving = false;
    }
  }

  function handleCancel() {
    goto('/app/settings');
  }
</script>

<svelte:head>
  <title>Form Settings - Settings</title>
</svelte:head>

<div class="p-6">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h1 class="text-2xl font-bold text-gray-900">Form Settings</h1>
    </div>
    <p class="text-sm text-gray-600">
      Configure default templates for your donation forms
    </p>
  </div>

  <!-- Info Banner -->
  <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p class="text-sm font-medium text-blue-900">About Form Templates</p>
        <p class="text-xs text-blue-700 mt-1">
          The default footer template will be pre-filled when creating new forms. You can customize it for each individual form later.
        </p>
      </div>
    </div>
  </div>

  <!-- Settings Form -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Default Footer Template</h2>
        <button
          type="button"
          on:click={() => (showBindingPicker = true)}
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          Insert Field Binding
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1">
        This content will appear at the bottom of all forms, typically for contribution rules and legal disclaimers
      </p>
    </div>

    <div class="p-6">
      <BlockEditor
        bind:this={footerEditor}
        initialData={defaultFooterContent}
        placeholder="Enter your default footer content..."
      />
    </div>

    <!-- Available Bindings Reference -->
    <div class="px-6 pb-6">
      <div class="p-4 bg-gray-50 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Available Field Bindings</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {#each Object.entries(data.availableBindings) as [key, value]}
            <div class="font-mono text-gray-600">
              <code class="bg-gray-200 px-1 py-0.5 rounded">{`{{${key}}}`}</code>
              <span class="text-gray-500 ml-1">→ {value}</span>
            </div>
          {/each}
        </div>
        <p class="text-xs text-gray-500 mt-3">
          These fields will be automatically replaced with your organization's information when the form is displayed
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
      <button
        type="button"
        on:click={handleCancel}
        class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="button"
        on:click={handleSave}
        disabled={isSaving}
        class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if isSaving}
          Saving...
        {:else}
          {data.settings ? 'Update Settings' : 'Save Settings'}
        {/if}
      </button>
    </div>
  </div>

  <!-- Example Output -->
  <div class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Common Footer Examples</h3>
    <div class="space-y-4 text-sm text-gray-600">
      <div class="p-3 bg-gray-50 rounded">
        <p class="font-medium text-gray-900 mb-1">Political Campaign Example:</p>
        <p class="text-xs">
          "Contributions to {{org_name}} are not tax deductible. Federal law requires us to use our best efforts to collect and report the name, mailing address, occupation, and employer of individuals whose contributions exceed $200 in an election cycle. By contributing, you certify that you are a U.S. citizen or lawfully admitted permanent resident."
        </p>
      </div>
      <div class="p-3 bg-gray-50 rounded">
        <p class="font-medium text-gray-900 mb-1">501(c)(3) Non-Profit Example:</p>
        <p class="text-xs">
          "{{org_name}} is a 501(c)(3) tax-exempt organization (EIN: {{ein}}). Your contribution is tax-deductible to the extent allowed by law. No goods or services were provided in exchange for your contribution."
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Field Binding Picker Modal -->
{#if showBindingPicker}
  <FieldBindingPicker
    bindings={data.availableBindings}
    onInsert={insertBinding}
    onClose={() => (showBindingPicker = false)}
  />
{/if}
