<!--  src/lib/components/contacts/ContactDetailsSheet/ContactTags.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Props
  export let tags;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  const tagInput = writable('');
  
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

<div>
  <h2 class="text-lg font-medium text-gray-900 mb-4">Tags</h2>
  
  <div class="mb-4">
    <div class="flex items-center">
      <div class="flex-grow mr-2">
        <input
          type="text"
          placeholder="Add a tag..."
          bind:value={$tagInput}
          class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          disabled={isSaving}
          on:keydown={handleKeydown}
        />
      </div>
      
      <button
        type="button"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={addTag}
        disabled={isSaving || !$tagInput.trim()}
      >
        Add
      </button>
    </div>
    
    <p class="mt-2 text-sm text-gray-500">
      Add tags to categorize this contact. Press Enter or click Add to create a tag.
    </p>
  </div>
  
  {#if $tags.length > 0}
    <div class="flex flex-wrap gap-2 mt-2">
      {#each $tags as tag}
        <div class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {tag}
          <button
            type="button"
            class="ml-1 rounded-full text-blue-600 hover:text-blue-800 focus:outline-none"
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