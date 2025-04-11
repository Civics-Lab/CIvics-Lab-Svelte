<!-- src/lib/components/donations/DonationDetailsSheet.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import DetailsSheetOverlay from '$lib/components/DetailsSheetOverlay.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
  // Import subcomponents
  import DonationBasicInfo from './DonationDetailsSheet/DonationBasicInfo.svelte';
  import DonationTags from './DonationDetailsSheet/DonationTags.svelte';
  
  // Props
  export let isOpen = false;
  export let donationId: string | null = null;
  
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
      // Fetch donation details from the API
      const response = await fetch(`/api/donations/${donationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch donation');
      }
      
      const responseData = await response.json();
      const data = responseData.donation;
      
      if (data) {
        // Format date from timestamp
        let donationDate = data.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
        
        // Set basic form data
        formData.set({
          amount: Number(data.amount) || 0,
          status: data.status || 'promise',
          payment_type: data.paymentType || '',
          notes: data.notes || '',
          donation_date: donationDate,
          contact_id: data.contactId || null,
          business_id: data.businessId || null
        });
        
        // Fetch donation tags using the API
        let donationTags = [];
        try {
          const tagsResponse = await fetch(`/api/donation-tags?donation_id=${donationId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!tagsResponse.ok) {
            const tagsErrorData = await tagsResponse.json();
            console.warn('Failed to fetch donation tags:', tagsErrorData.message || 'Unknown error');
            // Continue with empty tags instead of throwing
          } else {
            const tagsResponseData = await tagsResponse.json();
            donationTags = tagsResponseData.tags || [];
          }
        } catch (tagsError) {
          console.warn('Error fetching donation tags:', tagsError);
          // Continue with empty tags instead of throwing
        }
        
        // Store original data for comparison
        originalData.set({
          ...JSON.parse(JSON.stringify($formData)),
          tags: donationTags ? [...donationTags.map(t => t.tag)] : []
        });
        
        // Set donor info
        if (data.contactId && data.contact) {
          donor.set({
            type: 'contact',
            id: data.contactId,
            name: `${data.contact.firstName} ${data.contact.lastName || ''}`.trim()
          });
        } else if (data.businessId && data.business) {
          donor.set({
            type: 'business',
            id: data.businessId,
            name: data.business.businessName
          });
        } else {
          donor.set(null);
        }
        
        // Set tags
        tags.set(donationTags ? donationTags.map(tag => tag.tag) : []);
        
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
        // Prepare the update data in the format the API expects
        const donationData = {
          amount: Number($formData.amount) || 0,
          status: $formData.status || 'promise',
          paymentType: $formData.payment_type || '',
          notes: $formData.notes || ''
        };
        
        // Call the API to update the donation
        const response = await fetch(`/api/donations/${donationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ donationData })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update donation');
        }
      }
      
      // Handle tags updates using API endpoints
      try {
        // First get existing tags
        const tagsResponse = await fetch(`/api/donation-tags?donation_id=${donationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        let existingTags = [];
        if (!tagsResponse.ok) {
          console.warn('Failed to fetch existing tags, will continue with tag updates anyway');
        } else {
          const tagsData = await tagsResponse.json();
          existingTags = tagsData.tags || [];
          
          // Delete tags that are no longer in the current tags list
          for (const existingTag of existingTags) {
            if (!$tags.includes(existingTag.tag)) {
              try {
                const deleteResponse = await fetch(`/api/donation-tags/${existingTag.id}`, {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                if (!deleteResponse.ok) {
                  console.warn('Failed to delete tag:', existingTag.tag);
                }
              } catch (deleteErr) {
                console.warn('Error deleting tag:', existingTag.tag, deleteErr);
              }
            }
          }
        }
        
        // Add new tags
        const existingTagValues = existingTags.map(t => t.tag);
        const newTags = $tags.filter(tag => !existingTagValues.includes(tag));
        
        for (const newTag of newTags) {
          try {
            const createResponse = await fetch('/api/donation-tags', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                donationId: donationId,
                tag: newTag
              })
            });
            
            if (!createResponse.ok) {
              console.warn('Failed to create tag:', newTag);
            }
          } catch (createErr) {
            console.warn('Error creating tag:', newTag, createErr);
          }
        }
      } catch (tagsErr) {
        console.warn('Error handling tags:', tagsErr);
        // Continue with the save operation even if tag updates fail
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
      error.set('Failed to save changes: ' + (err.message || 'Unknown error'));
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
  <DetailsSheetOverlay {isOpen} on:close={handleClose} zIndex={50}>
    <div class="fixed inset-0 z-50 overflow-hidden" on:click|stopPropagation={() => {}}>
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
  </DetailsSheetOverlay>
{/if}