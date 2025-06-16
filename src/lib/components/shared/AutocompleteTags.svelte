<!-- src/lib/components/shared/AutocompleteTags.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { Plus, X, Tag, ChevronDown } from '@lucide/svelte';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  
  // Props
  export let tags: any; // Svelte store for current tags
  export let isSaving = false;
  export let entityType: 'contact' | 'business' | 'donation' = 'business';
  export let entityId: string | null = null; // For detail sheets (existing entities)
  
  const dispatch = createEventDispatcher();
  const tagInput = writable('');
  const suggestions = writable<string[]>([]);
  const showSuggestions = writable(false);
  const isLoadingSuggestions = writable(false);
  
  // Entity-specific labels and API endpoints
  const config = {
    contact: {
      title: 'Contact Tags',
      description: 'Organize and categorize this contact with relevant tags.',
      addLabel: 'Add Tag',
      emptyTitle: 'No tags added',
      emptyDescription: 'Start organizing by adding your first tag.',
      tagColorClass: 'border-blue-200 bg-blue-50 text-blue-700',
      apiEndpoint: '/api/contact-tags'
    },
    business: {
      title: 'Tags',
      description: 'Organize and categorize this business with relevant tags.',
      addLabel: 'Add Tag',
      emptyTitle: 'No tags added',
      emptyDescription: 'Start organizing by adding your first tag.',
      tagColorClass: 'border-slate-200 bg-slate-50 text-slate-700',
      apiEndpoint: '/api/business-tags'
    },
    donation: {
      title: 'Donation Tags',
      description: 'Organize and categorize this donation with relevant tags.',
      addLabel: 'Add Tag',
      emptyTitle: 'No tags added',
      emptyDescription: 'Start organizing by adding your first tag.',
      tagColorClass: 'border-green-200 bg-green-50 text-green-700',
      apiEndpoint: '/api/donation-tags'
    }
  };
  
  const currentConfig = config[entityType];
  
  let debounceTimer: number;
  
  function handleChange() {
    dispatch('change');
  }
  
  async function fetchSuggestions(query: string) {
    if (!$workspaceStore.currentWorkspace?.id) {
      console.error('No workspace selected for tag suggestions');
      suggestions.set([]);
      showSuggestions.set(false);
      return;
    }
    
    isLoadingSuggestions.set(true);
    
    try {
      const url = new URL(currentConfig.apiEndpoint, window.location.origin);
      url.searchParams.set('workspace_id', $workspaceStore.currentWorkspace.id);
      
      // If no query or very short query, get all tags, otherwise filter by query
      if (query.trim() && query.length >= 1) {
        url.searchParams.set('query', query);
      } else {
        // For empty/short queries, we still want to get suggestions but without filtering
        // The API will return more results this way
        url.searchParams.set('query', '');
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const suggestionList = data.suggestions || [];
      
      // Filter out already selected tags
      const filteredSuggestions = suggestionList.filter(
        (suggestion: string) => !$tags.includes(suggestion)
      );
      
      // If we have a query, filter on the frontend as well for better UX
      let finalSuggestions = filteredSuggestions;
      if (query.trim() && query.length >= 1) {
        finalSuggestions = filteredSuggestions.filter(
          (suggestion: string) => suggestion.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      suggestions.set(finalSuggestions);
      // Don't automatically set showSuggestions here - let the caller control it
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
      suggestions.set([]);
      showSuggestions.set(false);
    } finally {
      isLoadingSuggestions.set(false);
    }
  }
  
  function handleInputChange() {
    const query = $tagInput;
    
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    // Only fetch suggestions if the field is focused and we want to show them
    if ($showSuggestions) {
      // Debounce the search - now we search even for empty queries when focused
      debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    }
  }
  
  function addTag(tagToAdd?: string) {
    const newTag = tagToAdd || $tagInput.trim();
    
    if (newTag) {
      if (!$tags.includes(newTag)) {
        tags.update(items => [...items, newTag]);
        handleChange();
      }
      tagInput.set('');
      suggestions.set([]);
      showSuggestions.set(false); // Hide suggestions after adding a tag
    }
  }
  
  function selectSuggestion(suggestion: string) {
    addTag(suggestion); // addTag handles hiding suggestions
  }
  
  function removeTag(tag: string) {
    tags.update(items => items.filter(item => item !== tag));
    handleChange();
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if ($suggestions.length > 0 && $showSuggestions) {
        // Select first suggestion
        selectSuggestion($suggestions[0]);
      } else {
        addTag();
      }
    } else if (event.key === 'Escape') {
      suggestions.set([]);
      showSuggestions.set(false);
    } else if (event.key === 'ArrowDown' && $suggestions.length > 0) {
      event.preventDefault();
      // Could implement keyboard navigation here
    }
  }
  
  function handleBlur() {
    // Delay hiding suggestions to allow for click events on suggestions
    setTimeout(() => {
      showSuggestions.set(false);
    }, 200);
  }
  
  function handleFocus() {
    // Show suggestions and fetch them when the field is focused
    showSuggestions.set(true);
    fetchSuggestions($tagInput);
  }
  
  // Watch for input changes - only when user is actively typing
  // Don't trigger on initial mount or programmatic changes
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900">{currentConfig.title}</h3>
    <p class="mt-1 text-sm text-slate-600">{currentConfig.description}</p>
  </div>
  
  <div class="space-y-4">
    <!-- Add tag input with autocomplete -->
    <div class="flex items-end gap-3">
      <div class="flex-1 space-y-2 relative">
        <label for="tag-input" class="block text-sm font-medium text-slate-700">
          {currentConfig.addLabel}
        </label>
        <div class="relative">
          <input
            id="tag-input"
            type="text"
            placeholder="Enter a tag name..."
            bind:value={$tagInput}
            class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            on:keydown={handleKeydown}
            on:blur={handleBlur}
            on:focus={handleFocus}
            on:input={handleInputChange}
          />
          
          <!-- Loading indicator -->
          {#if $isLoadingSuggestions}
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
            </div>
          {/if}
          
          <!-- Suggestions dropdown -->
          {#if $showSuggestions && $suggestions.length > 0}
            <div class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {#each $suggestions as suggestion}
                <button
                  type="button"
                  class="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition-colors focus:outline-none focus:bg-slate-100"
                  on:click={() => selectSuggestion(suggestion)}
                >
                  <div class="flex items-center gap-2">
                    <Tag class="h-3 w-3 text-slate-400" />
                    {suggestion}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
      
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
        on:click={() => {
          addTag(); // addTag already hides suggestions
        }}
        disabled={isSaving || !$tagInput.trim()}
      >
        <Plus class="h-4 w-4" />
        Add
      </button>
    </div>
    
    <!-- Help text -->
    <div class="text-xs text-slate-500">
      Click the field to see all available tags, or start typing to filter them.
    </div>
    
    <!-- Tags display -->
    {#if $tags.length > 0}
      <div class="space-y-3">
        <h4 class="text-sm font-medium text-slate-900">Current Tags</h4>
        <div class="flex flex-wrap gap-2">
          {#each $tags as tag}
            <div class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-slate-100 {currentConfig.tagColorClass}">
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
        <h3 class="text-sm font-medium text-slate-900 mb-1">{currentConfig.emptyTitle}</h3>
        <p class="text-sm text-slate-600">{currentConfig.emptyDescription}</p>
      </div>
    {/if}
  </div>
</div>
