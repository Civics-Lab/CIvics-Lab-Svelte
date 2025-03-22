<!-- src/lib/components/donations/DonationDetailsSheet.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { TypedSupabaseClient } from '$lib/types/supabase';
  
  // Import subcomponents
  import DonationBasicInfo from './DonationDetailsSheet/DonationBasicInfo.svelte';
  import DonationTags from './DonationDetailsSheet/DonationTags.svelte';
  
  // Props
  export let isOpen = false;
  export let donationId: string | null = null;
  export let supabase: TypedSupabaseClient;
  
  const dispatch = createEventDispatcher();
  
  // State
  const isLoading = writable(true);
  const isSaving = writable(false);
  const hasChanges = writable(false);
  const error = writable<string | null>(null);
  
  // State for unsaved changes confirmation dialog
  const showUnsavedChangesDialog = writable(false);
  
  // Donation data
  const originalData = writable<any>(null);
  const formData = writable<any>({
    amount: 0,
    status: 'promise',
    payment_type: '',
    notes: '',
    donation_date: new Date().toISOString().split('T')[0],
    contact_id: null,
    business_id: null
  });
  
  // Related entities
  const donor = writable<any>(null);
  
  // Multi-item sections
  const tags = writable<string[]>([]);
  
  // Options for dropdowns
  const statusOptions = [
    { value: 'promise', label: 'Promise' },
    { value: 'donated', label: 'Donated' },
    { value: 'processing', label: 'Processing' },
    { value: 'cleared', label: 'Cleared' }
  ];
  
  const paymentTypeOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' }
  ];
  
  async function fetchDonationDetails() {
    if (!donationId) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      // Fetch donation details
      const { data, error: fetchError } = await supabase
      .from('donations')
      .select(`
          *,
          contacts:contact_id (id, first_name, last_name),
          businesses:business_id (id, business_name),
          donation_tags (id, tag)
      `)
      .eq('id', donationId)
      .single();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // Format date from timestamp
        let donationDate = data.donation_date || data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
        
        // Set basic form data
        formData.set({
          amount: Number(data.amount) || 0,
          status: data.status || 'promise',
          payment_type: data.payment_type || '',
          notes: data.notes || '',
          donation_date: donationDate,
          contact_id: data.contact_id || null,
          business_id: data.business_id || null
        });
        
        // Store original data for comparison
        originalData.set({
          ...JSON.parse(JSON.stringify($formData)),
          tags: data.donation_tags ? [...data.donation_tags.map(t => t.tag)] : []
        });
        
        // Set donor info
        if (data.contact_id && data.contacts) {
          donor.set({
            type: 'contact',
            id: data.contact_id,
            name: `${data.contacts.first_name} ${data.contacts.last_name || ''}`.trim()
          });
        } else if (data.business_id && data.businesses) {
          donor.set({
            type: 'business',
            id: data.business_id,
            name: data.businesses.business_name
          });
        } else {
          donor.set(null);
        }
        
        // Set tags
        if (data.donation_tags) {
          tags.set(Array.isArray(data.donation_tags) ? data.donation_tags.map(tag => tag.tag) : []);
        } else {
          tags.set([]);
        }
      } else {
        error.set('Donation not found');
      }
      
    } catch (err) {
      console.error('Error fetching donation details:', err);
      error.set('Failed to load donation details: ' + (err.message || 'Unknown error'));
    } finally {
      isLoading.set(false);
    }
  }
  
  // Save changes
  async function saveChanges() {
    if (!donationId) return;
    
    isSaving.set(true);
    error.set(null);
    
    try {
      // Update donation basic info if changed
      if (JSON.stringify($formData) !== JSON.stringify($originalData)) {
        const { error: updateError } = await supabase
          .from('donations')
          .update($formData)
          .eq('id', donationId);
        
        if (updateError) throw updateError;
      }
      
      // Handle tags updates
      // First get existing tags
      const { data: existingTags, error: existingTagsError } = await supabase
        .from('donation_tags')
        .select('id, tag')
        .eq('donation_id', donationId);
      
      if (existingTagsError) throw existingTagsError;
      
      // Delete tags that are no longer in the current tags list
      for (const existingTag of existingTags || []) {
        if (!$tags.includes(existingTag.tag)) {
          await supabase
            .from('donation_tags')
            .delete()
            .eq('id', existingTag.id);
        }
      }
      
      // Add new tags
      const existingTagValues = (existingTags || []).map(t => t.tag);
      const newTags = $tags.filter(tag => !existingTagValues.includes(tag));
      
      for (const newTag of newTags) {
        await supabase
          .from('donation_tags')
          .insert({
            donation_id: donationId,
            tag: newTag
          });
      }
      
      // Success notification
      toastStore.success('Donation updated successfully');
      
      // Refresh donation data
      fetchDonationDetails();
      
      // Reset has changes flag
      hasChanges.set(false);
      
      // Notify parent about changes
      dispatch('updated');
      
    } catch (err) {
      console.error('Error saving donation changes:', err);
      error.set('Failed to save changes');
      toastStore.error('Failed to save changes');
    } finally {
      isSaving.set(false);
    }
  }
  
  // Cancel changes
  function cancelChanges() {
    // Reset to original data
    if ($originalData) {
      formData.set(JSON.parse(JSON.stringify($originalData)));
    }
    
    // Refetch everything
    fetchDonationDetails();
    
    // Reset has changes flag
    hasChanges.set(false);
  }
  
  // Close the sheet
  function handleClose() {
    if ($hasChanges) {
      // Show the custom dialog instead of using browser confirm
      showUnsavedChangesDialog.set(true);
    } else {
      dispatch('close');
    }
  }
  
  // Discard changes and close
  function discardChangesAndClose() {
    showUnsavedChangesDialog.set(false);
    dispatch('close');
  }
  
  // Save changes and close
  async function saveChangesAndClose() {
    showUnsavedChangesDialog.set(false);
    await saveChanges();
    dispatch('close');
  }
  
  // Event handlers for child components
  function handleFormDataChange() {
    // Check if form data has changed
    if ($originalData) {
      const changed = Object.keys($formData).some(key => {
        // Handle empty strings vs nulls
        const origValue = $originalData[key] === null ? '' : $originalData[key];
        const newValue = $formData[key] === null ? '' : $formData[key];
        return String(newValue) !== String(origValue);
      });
      
      hasChanges.set(changed);
    }
  }
  
  function handleMultiItemChange() {
    // Original tags is an array of strings, we need to compare differently
    let originalTags = [];
    try {
      if ($originalData && $originalData.tags) {
        originalTags = $originalData.tags;
      }
    } catch (err) {
      console.log('Error getting original tags:', err);
    }
    
    // Compare current tags with original ones
    let hasTagChanges = false;
    if ($tags.length !== originalTags.length) {
      hasTagChanges = true;
    } else {
      // Check if any tags were added or removed
      hasTagChanges = $tags.some(tag => !originalTags.includes(tag)) || 
                       originalTags.some(tag => !$tags.includes(tag));
    }
    
    hasChanges.set(hasTagChanges);
  }
  
  // Key event handler for escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      handleClose();
    }
  }
  
  // Add/remove event listeners
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
  
  // Watch for donation ID changes
  $: if (donationId && isOpen) {
    fetchDonationDetails();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop - stop propagation to prevent clicks from closing when clicking form elements -->
    <div 
      class="absolute inset-0 bg-opacity-25 transition-opacity" 
      on:click|stopPropagation={handleClose}
      transition:fly={{ duration: 200, opacity: 0 }}
    ></div>
    
    <!-- Sheet panel - prevent click events from reaching the backdrop -->
    <div 
      class="absolute inset-y-0 right-0 max-w-2xl w-full flex"
      transition:fly={{ duration: 300, x: '100%' }}
      on:click|stopPropagation={() => {}}
    >
      <div class="h-full w-full flex flex-col bg-white shadow-xl overflow-y-scroll">
        <!-- Header -->
        <div class="px-4 py-6 bg-gray-50 sm:px-6 sticky top-0 z-10 border-b">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-medium text-gray-900">
                {#if $isLoading}
                  Loading...
                {:else if $error}
                  Error Loading Donation
                {:else}
                  {#if $donor}
                    Donation from {$donor.name}
                  {:else}
                    Donation Details
                  {/if}
                {/if}
              </h2>
              <p class="mt-1 text-sm {$hasChanges ? 'text-orange-500 font-medium' : 'text-gray-500'}">
                {#if $hasChanges}
                  You have unsaved changes
                {:else}
                  Donation details
                {/if}
              </p>
            </div>
            <button
              type="button"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              on:click|stopPropagation={handleClose}
            >
              <span class="sr-only">Close panel</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="relative flex-1 px-4 py-6 sm:px-6">
          {#if $isLoading}
            <div class="flex items-center justify-center h-40">
              <LoadingSpinner size="lg" />
            </div>
          {:else if $error}
            <div class="bg-red-50 p-4 rounded-md mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">Error</h3>
                  <div class="mt-2 text-sm text-red-700">
                    <p>{$error}</p>
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <div class="space-y-8" on:click|stopPropagation={() => {}}>
              <!-- Basic Information Section -->
              <DonationBasicInfo 
                {formData}
                {donor}
                {statusOptions}
                {paymentTypeOptions}
                isSaving={$isSaving}
                on:change={handleFormDataChange}
              />
              
              <!-- Tags Section -->
              <DonationTags 
                {tags}
                {supabase}
                isSaving={$isSaving}
                on:change={handleMultiItemChange}
              />
            </div>
          {/if}
        </div>
        
        <!-- Footer with action buttons -->
        <div class="px-4 py-4 sm:px-6 bg-gray-50 border-t sticky bottom-0">
          <div class="flex justify-end space-x-3">
            {#if $hasChanges}
              <button
                type="button"
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                on:click|stopPropagation={cancelChanges}
                disabled={$isSaving}
              >
                Discard Changes
              </button>
              
              <button
                type="button"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                on:click|stopPropagation={saveChanges}
                disabled={$isSaving}
              >
                {#if $isSaving}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Saving...</span>
                  </div>
                {:else}
                  Save Changes
                {/if}
              </button>
            {:else}
              <button
                type="button"
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                on:click|stopPropagation={handleClose}
              >
                Close
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Unsaved changes confirmation dialog -->
  {#if $showUnsavedChangesDialog}
    <div class="fixed inset-0 z-[60] overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
          transition:fly={{ duration: 200, y: 10 }}
          on:click|stopPropagation={() => {}}
        >
          <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-gray-900">Unsaved Changes</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button 
              type="button" 
              class="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto"
              on:click|stopPropagation={saveChangesAndClose}
            >
              Save Changes
            </button>
            <button 
              type="button" 
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              on:click|stopPropagation={discardChangesAndClose}
            >
              Discard
            </button>
            <button 
              type="button" 
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto mr-auto"
              on:click|stopPropagation={() => showUnsavedChangesDialog.set(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}