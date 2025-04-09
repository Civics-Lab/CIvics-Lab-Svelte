<!--  src/lib/components/contacts/ContactDetailsSheet/ContactSocialMedia.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let socialMedia;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  // Social media service options
  const socialMediaServices = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'threads', label: 'Threads' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'bluesky', label: 'Bluesky' },
    { value: 'youtube', label: 'YouTube' }
  ];
  
  function handleChange() {
    dispatch('change');
  }
  
  function addSocialMedia() {
    socialMedia.update(items => [...items, { 
      social_media_account: '', 
      service_type: 'facebook', 
      status: 'active',
      isNew: true  // This flag will ensure it's treated as a new entry for the API
    }]);
    console.log('Added new social media entry');
    handleChange();
  }
  
  function removeSocialMedia(index) {
    socialMedia.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      if (item.id) {
        // For existing items, mark as deleted
        item.isDeleted = true;
      } else {
        // For new items, just remove from array
        updatedItems.splice(index, 1);
      }
      
      return updatedItems;
    });
    handleChange();
  }
  
  function updateSocialMedia(index, field, value) {
    socialMedia.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      if (item.id && !item.isNew) {
        // Mark as modified for existing items
        item.isModified = true;
      }
      
      // For social_media_account field, ensure it's not null
      if (field === 'social_media_account') {
        // Trim the value and store it, or empty string if null/undefined
        item[field] = value ? value.trim() : '';
      } else {
        item[field] = value;
      }
      
      return updatedItems;
    });
    handleChange();
  }
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-medium text-gray-900">Social Media Accounts</h2>
    <button
      type="button"
      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      on:click={addSocialMedia}
      disabled={isSaving}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Account
    </button>
  </div>
  
  {#each $socialMedia.filter(item => !item.isDeleted) as social, i}
    <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
      <button 
        type="button" 
        class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
        on:click={() => removeSocialMedia(i)}
        disabled={isSaving}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-2">
          <label for="social_service_{i}" class="block text-sm font-medium text-gray-700">Platform</label>
          <div class="mt-1">
            <select
              id="social_service_{i}"
              value={social.service_type}
              on:change={(e) => updateSocialMedia(i, 'service_type', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            >
              {#each socialMediaServices as service}
                <option value={service.value}>{service.label}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="social_account_{i}" class="block text-sm font-medium text-gray-700">Username/Handle</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="social_account_{i}" 
              value={social.social_media_account}
              on:input={(e) => updateSocialMedia(i, 'social_media_account', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="social_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select
              id="social_status_{i}"
              value={social.status}
              on:change={(e) => updateSocialMedia(i, 'status', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  {/each}
  
  {#if $socialMedia.filter(item => !item.isDeleted).length === 0}
    <div class="border border-dashed rounded-md p-6 text-center text-gray-500">
      <p>No social media accounts added yet.</p>
      <button
        type="button"
        class="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        on:click={addSocialMedia}
        disabled={isSaving}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Social Media Account
      </button>
    </div>
  {/if}
</div>