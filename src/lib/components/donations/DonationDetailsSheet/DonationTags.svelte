<!-- src/lib/components/donations/DonationDetailsSheet/DonationTags.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { Plus, X, Tag, Loader2 } from '@lucide/svelte';
  
  export let tags = [];
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  const tagInput = writable('');
  const suggestedTags = writable<string[]>([]);
  const isLoadingSuggestions = writable(false);
  const showSuggestions = writable(false);
  
  // Load existing tags for suggestions
  async function loadTagSuggestions(query: string) {
    if (!query.trim() || query.length < 2) {
      suggestedTags.set([]);
      showSuggestions.set(false);
      return;
    }
    
    isLoadingSuggestions.set(true);
    showSuggestions.set(true);
    
    try {
      // Use the API endpoint to get tag suggestions
      const response = await fetch(`/api/donation-tags?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch tag suggestions');
      }
      
      const data = await response.json();
      const suggestions = data.suggestions || [];
      
      // Extract tag values and filter out already selected tags
      const uniqueTags = [...new Set(suggestions.map(s => s.tag))];
      const filteredTags = uniqueTags.filter(tag => !$tags.includes(tag));
      
      suggestedTags.set(filteredTags);
    } catch (error) {
      console.error('Error loading tag suggestions:', error);
      suggestedTags.set([]);
    } finally {
      isLoadingSuggestions.set(false);
    }
  }
  
  function handleChange() {
    dispatch('change');
  }
  
  function selectTag(tag: string) {
    if (!$tags.includes(tag)) {
      tags.update(items => [...items, tag]);
      handleChange();
    }
    
    // Reset input and suggestions
    tagInput.set('');
    suggestedTags.set([]);
    showSuggestions.set(false);
  }
  
  function addTag() {
    if ($tagInput.trim()) {
      selectTag($tagInput.trim());
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
    } else if (event.key === 'Escape') {
      tagInput.set('');
      suggestedTags.set([]);
      showSuggestions.set(false);
    } else {
      // Delay to avoid excessive API calls while typing
      setTimeout(() => {
        loadTagSuggestions($tagInput);
      }, 300);
    }
  }
  
  function handleInputFocus() {
    if ($tagInput.trim().length >= 2) {
      loadTagSuggestions($tagInput);
    }
  }
  
  function handleClickOutside() {
    // Use setTimeout to avoid closing suggestions before a click on a suggestion can be processed
    setTimeout(() => {
      showSuggestions.set(false);
    }, 200);
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900">Tags</h3>
    <p class="mt-1 text-sm text-slate-600">Organize and categorize this donation with relevant tags.</p>
  </div>
  
  <div class="space-y-4">
    <!-- Add tag input with suggestions -->
    <div class="relative">
      <div class="flex items-end gap-3">
        <div class="flex-1 space-y-2">
          <label for="tag-input" class="block text-sm font-medium text-slate-700">
            <Tag class="inline h-4 w-4 mr-1" />
            Add Tag
          </label>
          <div class="relative">
            <input
              id="tag-input"
              type="text"
              placeholder="Type to search or create a tag..."
              bind:value={$tagInput}
              class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              on:keydown={handleKeydown}
              on:focus={handleInputFocus}
              on:click|stopPropagation={() => {}}
            />
            
            {#if $isLoadingSuggestions}
              <div class="absolute right-2 top-2">
                <Loader2 class="h-4 w-4 text-slate-500 animate-spin" />
              </div>
            {/if}
            
            {#if $showSuggestions && $suggestedTags.length > 0}
              <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm border border-slate-200">
                {#each $suggestedTags as tag}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-100 transition-colors"
                    on:click|stopPropagation={() => selectTag(tag)}
                  >
                    <Tag class="inline h-3 w-3 mr-2 text-slate-500" />
                    {tag}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
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
    </div>
    
    <!-- Tags display -->
    {#if $tags.length > 0}
      <div class="space-y-3">
        <h4 class="text-sm font-medium text-slate-900">Current Tags</h4>
        <div class="flex flex-wrap gap-2">
          {#each $tags as tag}
            <div class="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100">
              <Tag class="h-3 w-3" />
              {tag}
              <button
                type="button"
                class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-purple-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <h3 class="text-sm font-medium text-slate-900 mb-1">No tags added</h3>
        <p class="text-sm text-slate-600">Start organizing by adding your first tag.</p>
      </div>
    {/if}
  </div>
</div>