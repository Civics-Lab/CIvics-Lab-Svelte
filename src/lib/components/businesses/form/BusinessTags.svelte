<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { BusinessFormErrors } from './types';
  
  export let tags: Writable<string[]>;
  export let tagInput: Writable<string>;
  export let existingTags: Writable<string[]>;
  export let filteredTags: Writable<string[]>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
  
  function addTag() {
    if ($tagInput.trim()) {
      if (!$tags.includes($tagInput.trim())) {
        tags.update(items => [...items, $tagInput.trim()]);
      }
      tagInput.set('');
      filteredTags.set([]);
    }
  }
  
  function removeTag(tag: string) {
    tags.update(items => items.filter(item => item !== tag));
  }
  
  function selectTag(tag: string) {
    if (!$tags.includes(tag)) {
      tags.update(items => [...items, tag]);
    }
    tagInput.set('');
    filteredTags.set([]);
  }
</script>

<div class="mt-8">
  <h2 class="text-lg font-medium text-gray-900 mb-4">Tags</h2>
  <div class="mb-4">
    <div class="flex items-center">
      <div class="flex-grow mr-2 relative">
        <input
          type="text"
          placeholder="Add a tag..."
          bind:value={$tagInput}
          class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
          disabled={$isSubmitting}
          on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          aria-label="Tag input"
        />
        
        <!-- Tag suggestions dropdown -->
        {#if $filteredTags.length > 0}
          <div class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {#each $filteredTags as tag}
              <button
                type="button"
                class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                on:click={() => selectTag(tag)}
                aria-label="Select tag {tag}"
              >
                {tag}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <button
        type="button"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        on:click={addTag}
        disabled={$isSubmitting || !$tagInput.trim()}
        aria-label="Add tag"
      >
        Add
      </button>
    </div>
    
    <p class="mt-2 text-sm text-gray-500">
      Add tags to categorize this business. Press Enter or click Add to create a tag.
    </p>
  </div>
  
  {#if $tags.length > 0}
    <div class="flex flex-wrap gap-2 mt-2">
      {#each $tags as tag}
        <div class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          {tag}
          <button
            type="button"
            class="ml-1 rounded-full text-green-600 hover:text-green-800 focus:outline-none"
            on:click={() => removeTag(tag)}
            aria-label="Remove tag {tag}"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
