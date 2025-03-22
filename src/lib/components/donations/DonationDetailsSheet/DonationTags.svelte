<!-- src/lib/components/donations/DonationDetailsSheet/DonationTags.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  
  export let tags = [];
  export let isSaving = false;
  export let supabase;
  
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
      // Fetch tags from donation_tags table
      const { data: donationTags, error: donationTagsError } = await supabase
        .from('donation_tags')
        .select('tag')
        .ilike('tag', `%${query}%`)
        .order('tag')
        .limit(10);
      
      if (donationTagsError) throw donationTagsError;
      
      // Remove duplicates and filter out already selected tags
      const uniqueTags = [...new Set(donationTags.map(t => t.tag))];
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

<div>
  <h2 class="text-lg font-medium text-gray-900 mb-4">Tags</h2>
  
  <div class="mb-4">
    <div class="relative">
      <div class="flex items-center">
        <div class="flex-grow mr-2 relative">
          <input
            type="text"
            placeholder="Add a tag..."
            bind:value={$tagInput}
            class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
            on:keydown={handleKeydown}
            on:focus={handleInputFocus}
            on:click|stopPropagation={() => {}}
          />
          
          {#if $isLoadingSuggestions}
            <div class="absolute right-2 top-2">
              <svg class="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          {/if}
          
          {#if $showSuggestions && $suggestedTags.length > 0}
            <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm">
              {#each $suggestedTags as tag}
                <button
                  type="button"
                  class="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-purple-100"
                  on:click|stopPropagation={() => selectTag(tag)}
                >
                  {tag}
                </button>
              {/each}
            </div>
          {/if}
        </div>
        
        <button
          type="button"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          on:click={addTag}
          disabled={isSaving || !$tagInput.trim()}
        >
          Add
        </button>
      </div>
      
      <p class="mt-2 text-sm text-gray-500">
        Add tags to categorize this donation. Type to see suggestions or create a new tag.
      </p>
    </div>
  </div>
  
  {#if $tags.length > 0}
    <div class="flex flex-wrap gap-2 mt-2">
      {#each $tags as tag}
        <div class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          {tag}
          <button
            type="button"
            class="ml-1 rounded-full text-purple-600 hover:text-purple-800 focus:outline-none"
            on:click={() => removeTag(tag)}
            disabled={isSaving}
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="border border-dashed rounded-md p-6 text-center text-gray-500">
      <p>No tags added yet.</p>
    </div>
  {/if}
</div>
