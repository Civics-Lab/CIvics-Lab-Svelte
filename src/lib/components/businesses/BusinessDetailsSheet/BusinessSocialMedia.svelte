<!-- src/lib/components/businesses/BusinessDetailsSheet/BusinessSocialMedia.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Plus, X, Share2 } from '@lucide/svelte';
  
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
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' }
  ];
  
  function handleChange() {
    dispatch('change');
  }
  
  function addSocialMedia() {
    socialMedia.update(items => [...items, { 
      social_media_account: '', 
      service_type: 'facebook', 
      status: 'active',
      isNew: true 
    }]);
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
      
      item[field] = value;
      return updatedItems;
    });
    handleChange();
  }
  
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between border-b border-slate-200 pb-4">
    <div>
      <h3 class="text-lg font-semibold leading-6 text-slate-900">Social Media Accounts</h3>
      <p class="mt-1 text-sm text-slate-600">Manage business social media presence and handles.</p>
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-9 px-3"
      on:click={addSocialMedia}
      disabled={isSaving}
    >
      <Plus class="h-4 w-4" />
      Add Account
    </button>
  </div>
  
  <div class="space-y-4">
    {#each $socialMedia.filter(item => !item.isDeleted) as social, i}
      <div class="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button 
          type="button" 
          class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" 
          on:click={() => removeSocialMedia(i)}
          disabled={isSaving}
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Remove social media account</span>
        </button>
        
        <div class="space-y-4 pr-8">
          <!-- Platform and Account Row -->
          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <label for="social_service_{i}" class="block text-sm font-medium text-slate-700">
                Platform
              </label>
              <select
                id="social_service_{i}"
                value={social.service_type}
                on:change={(e) => updateSocialMedia(i, 'service_type', e.target.value)}
                class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
              >
                {#each socialMediaServices as service}
                  <option value={service.value}>{service.label}</option>
                {/each}
              </select>
            </div>
            
            <div class="space-y-2">
              <label for="social_account_{i}" class="block text-sm font-medium text-slate-700">
                Username/Handle
              </label>
              <input 
                type="text" 
                id="social_account_{i}" 
                value={social.social_media_account}
                on:input={(e) => updateSocialMedia(i, 'social_media_account', e.target.value)}
                class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                placeholder="@handle or username"
              />
            </div>
            
            <div class="space-y-2">
              <label for="social_status_{i}" class="block text-sm font-medium text-slate-700">Status</label>
              <select
                id="social_status_{i}"
                value={social.status}
                on:change={(e) => updateSocialMedia(i, 'status', e.target.value)}
                class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
          
          <!-- Status Badge -->
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusBadgeClass(social.status)}">
              {social.status.charAt(0).toUpperCase() + social.status.slice(1)}
            </span>
            {#if social.social_media_account && social.status === 'active'}
              <span class="text-sm text-slate-600">
                @{social.social_media_account}
              </span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
    
    {#if $socialMedia.filter(item => !item.isDeleted).length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Share2 class="h-8 w-8 text-slate-400 mb-3" />
        <h3 class="text-sm font-medium text-slate-900 mb-1">No social media accounts</h3>
        <p class="text-sm text-slate-600 mb-4">Connect business social media profiles and handles.</p>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
          on:click={addSocialMedia}
          disabled={isSaving}
        >
          <Plus class="h-4 w-4" />
          Add Social Media Account
        </button>
      </div>
    {/if}
  </div>
</div>