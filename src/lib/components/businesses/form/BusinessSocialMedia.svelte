<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { FormData, BusinessFormErrors, SocialMedia } from './types';
  
  export let formData: Writable<FormData>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
  
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
  
  function addSocialMedia() {
    $formData.socialMedia = [...$formData.socialMedia, { 
      social_media_account: '', 
      service_type: 'facebook', 
      status: 'active' 
    }];
  }
  
  function removeSocialMedia(index: number) {
    $formData.socialMedia = $formData.socialMedia.filter((_, i) => i !== index);
  }
</script>

<div class="mt-8">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-medium text-gray-900">Social Media Accounts</h2>
    <button
      type="button"
      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      on:click={addSocialMedia}
      disabled={$isSubmitting}
      aria-label="Add social media account"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Account
    </button>
  </div>
  
  {#each $formData.socialMedia as social, i}
    <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
      {#if i > 0}
        <button 
          type="button" 
          class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
          on:click={() => removeSocialMedia(i)}
          disabled={$isSubmitting}
          aria-label="Remove social media account"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      
      <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-2">
          <label for="social_service_{i}" class="block text-sm font-medium text-gray-700">Platform</label>
          <div class="mt-1">
            <select
              id="social_service_{i}"
              bind:value={social.service_type}
              class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
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
              bind:value={social.social_media_account}
              class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="social_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select
              id="social_status_{i}"
              bind:value={social.status}
              class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
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
</div>
