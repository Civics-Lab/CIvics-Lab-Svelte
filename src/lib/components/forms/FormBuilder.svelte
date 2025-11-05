<script lang="ts">
  import BlockEditor from './BlockEditor.svelte';
  import LogoUploader from './LogoUploader.svelte';
  import FieldBindingPicker from './FieldBindingPicker.svelte';
  import FormPreview from './FormPreview.svelte';
  import type { Form, FormType, EditorJsData } from '$lib/types/form';

  export let form: Partial<Form> | undefined = undefined;
  export let workspaceId: string;
  export let availableBindings: Record<string, string> = {};
  export let onSave: (data: any) => Promise<void>;
  export let onCancel: () => void;

  // Form state
  let name = form?.name || '';
  let slug = form?.slug || '';
  let logoUrl = form?.logoUrl || '';
  let leftContent: EditorJsData | undefined = form?.leftContent;
  let type: FormType = form?.type || 'donation';
  let linkedItemId = form?.linkedItemId || '';
  let footerContent: EditorJsData | undefined = form?.footerContent;
  let isActive = form?.isActive ?? true;

  // UI state
  let saving = false;
  let showBindingPicker = false;
  let showPreview = false;
  let activeEditor: 'left' | 'footer' = 'left';

  // Editor references
  let leftEditor: BlockEditor;
  let footerEditor: BlockEditor;

  // Available items based on type
  let availableItems: any[] = [];
  let loadingItems = false;

  $: if (type) {
    loadAvailableItems();
  }

  async function loadAvailableItems() {
    loadingItems = true;
    try {
      const endpoint =
        type === 'donation'
          ? '/api/donations'
          : type === 'product'
            ? '/api/products'
            : '/api/subscriptions';

      const response = await fetch(`${endpoint}?workspace_id=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        availableItems = Array.isArray(data) ? data : data.products || data.subscriptions || [];
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      loadingItems = false;
    }
  }

  function handleLogoUpload(url: string) {
    logoUrl = url;
  }

  function handleLeftContentChange(data: EditorJsData) {
    leftContent = data;
  }

  function handleFooterContentChange(data: EditorJsData) {
    footerContent = data;
  }

  function openBindingPicker(editor: 'left' | 'footer') {
    activeEditor = editor;
    showBindingPicker = true;
  }

  function insertBinding(binding: string) {
    // TODO: Insert binding at cursor position in active editor
    console.log('Insert binding:', binding, 'in', activeEditor);
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Please enter a form name');
      return;
    }

    if (!linkedItemId) {
      alert(`Please select a ${type}`);
      return;
    }

    saving = true;

    try {
      // Save current editor content
      const savedLeftContent = await leftEditor?.save();
      const savedFooterContent = await footerEditor?.save();

      await onSave({
        name,
        slug: slug || undefined,
        logoUrl: logoUrl || undefined,
        leftContent: savedLeftContent || leftContent,
        type,
        linkedItemId,
        footerContent: savedFooterContent || footerContent,
        isActive
      });
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    } finally {
      saving = false;
    }
  }

  function handlePreview() {
    showPreview = true;
  }
</script>

<div class="form-builder h-full flex flex-col bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h2 class="text-xl font-semibold">
        {form?.id ? 'Edit Form' : 'Create New Form'}
      </h2>
      {#if !isActive}
        <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
          Archived
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        on:click={handlePreview}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Preview
      </button>
      <button
        type="button"
        on:click={onCancel}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="button"
        on:click={handleSave}
        disabled={saving}
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        {saving ? 'Saving...' : 'Save Form'}
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold mb-4">Basic Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="form-name" class="block text-sm font-medium text-gray-700 mb-1">
              Form Name *
            </label>
            <input
              id="form-name"
              type="text"
              bind:value={name}
              placeholder="e.g., General Donation Form"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for="form-slug" class="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">/forms/</span>
              <input
                id="form-slug"
                type="text"
                bind:value={slug}
                placeholder="auto-generated"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Form Logo</label>
          <LogoUploader
            currentUrl={logoUrl}
            onUpload={handleLogoUpload}
            {workspaceId}
          />
        </div>
      </div>

      <!-- Linked Item -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold mb-4">Linked Item</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="form-type" class="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="form-type"
              bind:value={type}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="donation">Donation</option>
              <option value="product">Product</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>

          <div>
            <label for="linked-item" class="block text-sm font-medium text-gray-700 mb-1">
              Select {type === 'donation' ? 'Donation' : type === 'product' ? 'Product' : 'Subscription'} *
            </label>
            <select
              id="linked-item"
              bind:value={linkedItemId}
              disabled={loadingItems}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">
                {loadingItems ? 'Loading...' : `Select a ${type}`}
              </option>
              {#each availableItems as item}
                <option value={item.id}>{item.name}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- Content Editors -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Left Column Content</h3>
          <button
            type="button"
            on:click={() => openBindingPicker('left')}
            class="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Insert Field
          </button>
        </div>

        <BlockEditor
          bind:this={leftEditor}
          initialData={leftContent}
          onChange={handleLeftContentChange}
          editorId="left-editor"
        />
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Footer Content</h3>
          <button
            type="button"
            on:click={() => openBindingPicker('footer')}
            class="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Insert Field
          </button>
        </div>

        <BlockEditor
          bind:this={footerEditor}
          initialData={footerContent}
          onChange={handleFooterContentChange}
          editorId="footer-editor"
        />
      </div>

      <!-- Status -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold mb-4">Status</h3>

        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={isActive}
            class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-sm font-medium text-gray-700">Form is active</span>
        </label>
        <p class="text-sm text-gray-500 mt-2">
          Inactive forms are not accessible via their public URL
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Modals -->
<FieldBindingPicker
  bind:isOpen={showBindingPicker}
  {availableBindings}
  onSelect={insertBinding}
/>

{#if showPreview && form}
  <FormPreview
    bind:isOpen={showPreview}
    form={{
      ...form,
      name,
      slug,
      logoUrl,
      leftContent: leftContent || { blocks: [] },
      type,
      linkedItemId,
      footerContent: footerContent || { blocks: [] },
      isActive
    }}
    bindings={availableBindings}
  />
{/if}
