<!-- Stream component for displaying and managing interaction history -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    fetchInteractionStreams, 
    createInteractionStream, 
    updateInteractionStream, 
    deleteInteractionStream,
    type InteractionStream,
    type CreateInteractionStreamData 
  } from '$lib/services/interactionStreamService';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { 
    MessageCircle, 
    Phone, 
    Mail, 
    Users, 
    StickyNote, 
    Plus, 
    Edit3, 
    Trash2, 
    Save, 
    X 
  } from '@lucide/svelte';
  // Using simple date formatting since date-fns is not available

  // Props
  export let entityType: 'contact' | 'business' = 'contact';
  export let entityId: string;
  export let isSaving = false;

  const dispatch = createEventDispatcher();

  // State
  const streams = writable<InteractionStream[]>([]);
  const isLoading = writable(true);
  const error = writable<string | null>(null);
  const isAddingNew = writable(false);
  const editingStreamId = writable<string | null>(null);

  // Form state for new interaction
  const newInteraction = writable({
    type: 'note' as 'note' | 'call' | 'email' | 'in_person',
    title: '',
    content: '',
    date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM format
    metadata: {}
  });

  // Edit form state
  const editForm = writable({
    title: '',
    content: '',
    date: '',
    metadata: {}
  });

  // Interaction type options
  const interactionTypes = [
    { value: 'note', label: 'Note', icon: StickyNote, color: 'bg-blue-100 text-blue-600' },
    { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-green-100 text-green-600' },
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-purple-100 text-purple-600' },
    { value: 'in_person', label: 'In Person', icon: Users, color: 'bg-orange-100 text-orange-600' }
  ];

  // Helper functions
  function getInteractionTypeInfo(type: string) {
    return interactionTypes.find(t => t.value === type) || interactionTypes[0];
  }

  function formatDate(date: string | Date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return then.toLocaleDateString();
  }

  function formatFullDate(date: string | Date) {
    return new Date(date).toLocaleString();
  }

  // Load interaction streams
  async function loadStreams() {
    if (!$workspaceStore.currentWorkspace || !entityId) return;

    isLoading.set(true);
    error.set(null);

    try {
      const options = entityType === 'contact' 
        ? { contactId: entityId }
        : { businessId: entityId };

      const fetchedStreams = await fetchInteractionStreams(
        $workspaceStore.currentWorkspace.id,
        options
      );

      streams.set(fetchedStreams);
    } catch (err) {
      console.error('Error loading interaction streams:', err);
      error.set('Failed to load interaction history');
    } finally {
      isLoading.set(false);
    }
  }

  // Add new interaction
  async function handleSubmitNew() {
    if (!$workspaceStore.currentWorkspace || !entityId) return;

    const form = $newInteraction;
    if (!form.title.trim() || !form.content.trim()) {
      toastStore.error('Please fill in both title and content');
      return;
    }

    try {
      const data: CreateInteractionStreamData = {
        workspaceId: $workspaceStore.currentWorkspace.id,
        [entityType + 'Id']: entityId,
        interactionType: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
        interactionDate: new Date(form.date),
        metadata: form.metadata
      };

      await createInteractionStream(data);
      
      // Reset form
      newInteraction.set({
        type: 'note',
        title: '',
        content: '',
        date: new Date().toISOString().slice(0, 16),
        metadata: {}
      });
      
      isAddingNew.set(false);
      toastStore.success('Interaction added successfully');
      
      // Reload streams
      await loadStreams();
      
      // Notify parent of changes
      dispatch('change');
    } catch (err) {
      console.error('Error creating interaction:', err);
      toastStore.error('Failed to add interaction');
    }
  }

  // Start editing
  function startEdit(stream: InteractionStream) {
    editingStreamId.set(stream.id!);
    editForm.set({
      title: stream.title,
      content: stream.content,
      date: new Date(stream.interactionDate).toISOString().slice(0, 16),
      metadata: stream.metadata || {}
    });
  }

  // Save edit
  async function handleSaveEdit(streamId: string) {
    const form = $editForm;
    if (!form.title.trim() || !form.content.trim()) {
      toastStore.error('Please fill in both title and content');
      return;
    }

    try {
      await updateInteractionStream(streamId, {
        title: form.title.trim(),
        content: form.content.trim(),
        interactionDate: new Date(form.date),
        metadata: form.metadata
      });

      editingStreamId.set(null);
      toastStore.success('Interaction updated successfully');
      
      // Reload streams
      await loadStreams();
      
      // Notify parent of changes
      dispatch('change');
    } catch (err) {
      console.error('Error updating interaction:', err);
      toastStore.error('Failed to update interaction');
    }
  }

  // Cancel edit
  function cancelEdit() {
    editingStreamId.set(null);
  }

  // Delete interaction
  async function handleDelete(streamId: string) {
    console.log('Attempting to delete interaction with ID:', streamId);
    
    if (!confirm('Are you sure you want to delete this interaction?')) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('Calling deleteInteractionStream service...');
      await deleteInteractionStream(streamId);
      console.log('Delete successful, showing success message');
      toastStore.success('Interaction deleted successfully');
      
      // Reload streams
      console.log('Reloading streams...');
      await loadStreams();
      
      // Notify parent of changes
      dispatch('change');
    } catch (err) {
      console.error('Error deleting interaction:', err);
      toastStore.error('Failed to delete interaction');
    }
  }

  // Initialize
  onMount(() => {
    loadStreams();
  });

  // Reload when entity changes
  $: if (entityId) {
    loadStreams();
  }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-medium text-gray-900">Interaction History</h3>
    <button
      type="button"
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
      on:click={() => isAddingNew.set(true)}
      disabled={$isAddingNew}
    >
      <Plus size={16} />
      Add Interaction
    </button>
  </div>

  <!-- Add New Interaction Form -->
  {#if $isAddingNew}
    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div class="space-y-4">
        <!-- Type and Date -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="interaction-type" class="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="interaction-type"
              bind:value={$newInteraction.type}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {#each interactionTypes as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="interaction-date" class="block text-sm font-medium text-gray-700 mb-1">
              Date & Time
            </label>
            <input
              id="interaction-date"
              type="datetime-local"
              bind:value={$newInteraction.date}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Title -->
        <div>
          <label for="interaction-title" class="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="interaction-title"
            type="text"
            bind:value={$newInteraction.title}
            placeholder="Brief summary of the interaction..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Content -->
        <div>
          <label for="interaction-content" class="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="interaction-content"
            bind:value={$newInteraction.content}
            placeholder="Detailed notes about the interaction..."
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            on:click={() => isAddingNew.set(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            on:click={handleSubmitNew}
            disabled={isSaving}
          >
            {#if isSaving}
              <LoadingSpinner size="sm" color="white" />
            {:else}
              <Save size={16} />
            {/if}
            Save
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Stream Content -->
  {#if $isLoading}
    <div class="flex justify-center py-8">
      <LoadingSpinner size="md" />
    </div>
  {:else if $error}
    <div class="text-center py-8">
      <p class="text-red-600">{$error}</p>
      <button
        type="button"
        class="mt-2 text-sm text-blue-600 hover:text-blue-700"
        on:click={loadStreams}
      >
        Try again
      </button>
    </div>
  {:else if $streams.length === 0}
    <div class="text-center py-8 text-gray-500">
      <MessageCircle size={48} class="mx-auto mb-4 text-gray-400" />
      <p class="text-lg">No interactions yet</p>
      <p class="text-sm">Add your first interaction to start tracking your communications.</p>
    </div>
  {:else}
    <!-- Stream Items -->
    <div class="space-y-3">
      {#each $streams as stream (stream.id)}
        <div class="border border-gray-200 rounded-lg p-4 bg-white">
          {#if $editingStreamId === stream.id}
            <!-- Edit Mode -->
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
              <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input
              type="datetime-local"
              bind:value={$editForm.date}
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              </div>
              <div>
              <!-- Type is shown but not editable for now -->
              <div class="flex items-center gap-2 pt-6">
              {#if stream.interactionType}
                {@const typeInfo = getInteractionTypeInfo(stream.interactionType)}
              <div class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium {typeInfo.color}">
                <svelte:component this={typeInfo.icon} size={14} />
                  {typeInfo.label}
                  </div>
                  {/if}
                  </div>
                  </div>
                </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  bind:value={$editForm.title}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  bind:value={$editForm.content}
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  on:click={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  on:click={() => handleSaveEdit(stream.id!)}
                >
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          {:else}
            <!-- Display Mode -->
            <div class="space-y-3">
              <!-- Header -->
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  {#if stream.interactionType}
                    {@const typeInfo = getInteractionTypeInfo(stream.interactionType)}
                    <div class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium {typeInfo.color}">
                      <svelte:component this={typeInfo.icon} size={14} />
                      {typeInfo.label}
                    </div>
                  {/if}
                  <span class="text-sm text-gray-500" title={formatFullDate(stream.interactionDate)}>
                    {formatDate(stream.interactionDate)}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-gray-600 rounded"
                    on:click={() => startEdit(stream)}
                    title="Edit interaction"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-red-600 rounded"
                    on:click={() => handleDelete(stream.id!)}
                    title="Delete interaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <!-- Title -->
              <h4 class="font-medium text-gray-900">{stream.title}</h4>

              <!-- Content -->
              <div class="text-sm text-gray-700 whitespace-pre-wrap">
                {stream.content}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>