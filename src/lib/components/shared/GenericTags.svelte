<!-- src/lib/components/shared/GenericTags.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { Plus, X, Tag } from '@lucide/svelte';
  
  // Props
  export let tags;
  export let isSaving = false;
  export let entityType: 'contact' | 'business' = 'contact';
  
  const dispatch = createEventDispatcher();
  const tagInput = writable('');
  
  // Entity-specific labels
  const labels = {
    contact: {
      title: 'Contact Tags',
      description: 'Organize and categorize this contact with relevant tags.',
      addLabel: 'Add Tag',
      emptyTitle: 'No tags added',
      emptyDescription: 'Start organizing by adding your first tag.',
      tagColorClass: 'border-blue-200 bg-blue-50 text-blue-700'
    },
    business: {
      title: 'Tags',
      description: 'Organize and categorize this business with relevant tags.',
      addLabel: 'Add Tag',
      emptyTitle: 'No tags added',
      emptyDescription: 'Start organizing by adding your first tag.',
      tagColorClass: 'border-slate-200 bg-slate-50 text-slate-700'
    }
  };
  
  const currentLabels = labels[entityType];
  
  function handleChange() {
    dispatch('change');
  }
  
  function addTag() {
    if ($tagInput.trim()) {
      if (!$tags.includes($tagInput.trim())) {
        tags.update(items => [...items, $tagInput.trim()]);
        handleChange();
      }
      tagInput.set('');
    }
  }
  
  function removeTag(tag) {
    tags.update(items => items.filter(item => item !== tag));
    handleChange();
  }
  
  function handleKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900">{currentLabels.title}</h3>
    <p class="mt-1 text-sm text-slate-600">{currentLabels.description}</p>
  </div>
  
  <div class="space-y-4">
    <!-- Add tag input -->
    <div class="flex items-end gap-3">
      <div class="flex-1 space-y-2">
        <label for="tag-input" class="block text-sm font-medium text-slate-700">
          {currentLabels.addLabel}
        </label>
        <input
          id="tag-input"
          type="text"
          placeholder="Enter a tag name..."
          bind:value={$tagInput}
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          on:keydown={handleKeydown}
        />
      </div>
      
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
        on:click={addTag}
        disabled={isSaving || !$tagInput.trim()}
      >
        <Plus class="h-4 w-4" />
        Add
      </button>
    </div>
    
    <!-- Tags display -->
    {#if $tags.length > 0}
      <div class="space-y-3">
        <h4 class="text-sm font-medium text-slate-900">Current Tags</h4>
        <div class="flex flex-wrap gap-2">
          {#each $tags as tag}
            <div class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-slate-100 {currentLabels.tagColorClass}">
              <Tag class="h-3 w-3" />
              {tag}
              <button
                type="button"
                class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                on:click={() => removeTag(tag)}
                disabled={isSaving}
              >
                <X class="h-3 w-3" />
                <span class="sr-only">Remove {tag} tag</span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Tag class="h-8 w-8 text-slate-400 mb-3" />
        <h3 class="text-sm font-medium text-slate-900 mb-1">{currentLabels.emptyTitle}</h3>
        <p class="text-sm text-slate-600">{currentLabels.emptyDescription}</p>
      </div>
    {/if}
  </div>
</div>