<!-- src/lib/components/businesses/BusinessDetailsSheet.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { fly } from 'svelte/transition';
    import DetailsSheetOverlay from '$lib/components/DetailsSheetOverlay.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    // Import subcomponents
    import BusinessBasicInfo from './BusinessDetailsSheet/BusinessBasicInfo.svelte';
    import BusinessPhones from './BusinessDetailsSheet/BusinessPhones.svelte';
    import BusinessAddresses from './BusinessDetailsSheet/BusinessAddresses.svelte';
    import BusinessSocialMedia from './BusinessDetailsSheet/BusinessSocialMedia.svelte';
    import BusinessTags from './BusinessDetailsSheet/BusinessTags.svelte';
    import BusinessEmployees from './BusinessDetailsSheet/BusinessEmployees.svelte';
    import BusinessDonations from './BusinessDetailsSheet/BusinessDonations.svelte';
    
    // Props
    export let isOpen = false;
    export let businessId: string | null = null;
    export let supabase: TypedSupabaseClient;
    
    const dispatch = createEventDispatcher();
    
    // State
    const isLoading = writable(true);
    const isSaving = writable(false);
    const hasChanges = writable(false);
    const error = writable<string | null>(null);
    
    // State for unsaved changes confirmation dialog
    const showUnsavedChangesDialog = writable(false);
    
    // Business data
    const originalData = writable<any>(null);
    const formData = writable<any>({
      business_name: '',
      status: 'active'
    });
    
    // Multi-item sections
    const phoneNumbers = writable<any[]>([]);
    const addresses = writable<any[]>([]);
    const socialMedia = writable<any[]>([]);
    const tags = writable<string[]>([]);
    const employees = writable<any[]>([]);
    
    // Options for dropdowns
    const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
    
    // Fetch options
    async function fetchOptions() {
      try {
        // Fetch state options
        const { data: stateData, error: stateError } = await supabase
          .from('states')
          .select('id, name, abbreviation')
          .order('name');
        
        if (stateError) throw stateError;
        stateOptions.set(stateData || []);
        
      } catch (err) {
        console.error('Error fetching options:', err);
        error.set('Failed to load form options');
      }
    }
    
    async function fetchBusinessDetails() {
      if (!businessId) return;
      
      isLoading.set(true);
      error.set(null);
      
      try {
        // Fetch business details using the RPC function
        const { data, error: fetchError } = await supabase
          .rpc('get_business_details', { business_uuid: businessId });
        
        if (fetchError) throw fetchError;
        
        if (data && data.length > 0) {
          const businessData = data[0];
          
          // Set basic info
          formData.set({
            business_name: businessData.business_name,
            status: businessData.status || 'active'
          });
          
          // Store original data for comparison
          originalData.set({
            ...JSON.parse(JSON.stringify($formData)),
            tags: businessData.tags ? [...businessData.tags.map(t => t.tag)] : []
          });
          
          // Set phone numbers
          if (businessData.phone_numbers) {
            phoneNumbers.set(Array.isArray(businessData.phone_numbers) ? businessData.phone_numbers : []);
          } else {
            phoneNumbers.set([]);
          }
          
          // Set addresses
          if (businessData.addresses) {
            addresses.set(Array.isArray(businessData.addresses) ? businessData.addresses.map(address => ({
              id: address.id,
              street_address: address.street_address || '',
              secondary_street_address: address.secondary_street_address || '',
              city: address.city || '',
              state_id: address.state_id || '',
              zip_code: address.zip_code || '',
              zip_code_id: address.zip_code_id || '',
              status: address.status || 'active'
            })) : []);
          } else {
            addresses.set([]);
          }
          
          // Set social media
          if (businessData.social_media) {
            socialMedia.set(Array.isArray(businessData.social_media) ? businessData.social_media : []);
          } else {
            socialMedia.set([]);
          }
          
          // Set tags
          if (businessData.tags) {
            tags.set(Array.isArray(businessData.tags) ? businessData.tags.map(tag => tag.tag) : []);
          } else {
            tags.set([]);
          }
          
          // Set employees
          if (businessData.employees) {
            employees.set(Array.isArray(businessData.employees) ? businessData.employees.map(employee => ({
              id: employee.id,
              contact_id: employee.employee_id,
              status: employee.status || 'active',
              role: employee.role || '',
              contact: {
                id: employee.employee_id,
                first_name: employee.employee_name ? employee.employee_name.split(' ')[0] : 'Unknown',
                last_name: employee.employee_name ? employee.employee_name.split(' ').slice(1).join(' ') : 'Contact'
              }
            })) : []);
          } else {
            employees.set([]);
          }
        } else {
          error.set('Business not found');
        }
        
      } catch (err) {
        console.error('Error fetching business details:', err);
        error.set('Failed to load business details: ' + (err.message || 'Unknown error'));
      } finally {
        isLoading.set(false);
      }
    }
    
    // Save changes
    async function saveChanges() {
      if (!businessId) return;
      
      isSaving.set(true);
      error.set(null);
      
      try {
        // Update business basic info if changed
        if (JSON.stringify($formData) !== JSON.stringify($originalData)) {
          const { error: updateError } = await supabase
            .from('businesses')
            .update($formData)
            .eq('id', businessId);
          
          if (updateError) throw updateError;
        }
        
        // Handle phone updates
        for (const phone of $phoneNumbers) {
          if (phone.isNew) {
            // Insert new phone
            await supabase
              .from('business_phone_numbers')
              .insert({
                business_id: businessId,
                phone_number: phone.phone_number,
                status: phone.status
              });
          } else if (phone.isDeleted) {
            // Delete phone
            await supabase
              .from('business_phone_numbers')
              .delete()
              .eq('id', phone.id);
          } else if (phone.isModified) {
            // Update phone
            await supabase
              .from('business_phone_numbers')
              .update({
                phone_number: phone.phone_number,
                status: phone.status
              })
              .eq('id', phone.id);
          }
        }
        
        // Handle address updates
        for (const address of $addresses) {
          // Sanitize address data - convert empty state_id to null
          if (address.state_id === '') {
            address.state_id = null;
          }
          
          if (address.isNew) {
            // Handle the zip code first - get or create it
            let zip_code_id = null;
            if (address.zip_code && address.zip_code.trim()) {
              // Try to find the zip code first
              const { data: zipData, error: zipError } = await supabase
                .from('zip_codes')
                .select('id')
                .eq('name', address.zip_code.trim())
                .maybeSingle();
              
              if (!zipError && zipData) {
                // Use existing zip code
                zip_code_id = zipData.id;
              } else {
                // Create a new zip code record
                try {
                  const { data: newZipCode, error: zipCreateError } = await supabase
                    .from('zip_codes')
                    .insert({
                      name: address.zip_code.trim(),
                      state_id: address.state_id || null
                    })
                    .select('id')
                    .single();
                  
                  if (zipCreateError) {
                    console.error('Error creating zip code:', zipCreateError);
                  } else {
                    zip_code_id = newZipCode.id;
                  }
                } catch (err) {
                  console.error('Error in zip code creation process:', err);
                }
              }
            }
            
            // Insert new address with the zip code
            await supabase
              .from('business_addresses')
              .insert({
                business_id: businessId,
                street_address: address.street_address,
                secondary_street_address: address.secondary_street_address || null,
                city: address.city,
                state_id: address.state_id, // Now null if it was empty string
                zip_code_id: zip_code_id,
                status: address.status
              });
          } else if (address.isDeleted) {
            // Delete address
            await supabase
              .from('business_addresses')
              .delete()
              .eq('id', address.id);
          } else if (address.isModified) {
            // Handle the zip code first - get or create it
            let zip_code_id = null;
            if (address.zip_code && address.zip_code.trim()) {
              // Try to find the zip code first
              const { data: zipData, error: zipError } = await supabase
                .from('zip_codes')
                .select('id')
                .eq('name', address.zip_code.trim())
                .maybeSingle();
              
              if (!zipError && zipData) {
                // Use existing zip code
                zip_code_id = zipData.id;
              } else {
                // Create a new zip code record
                try {
                  const { data: newZipCode, error: zipCreateError } = await supabase
                    .from('zip_codes')
                    .insert({
                      name: address.zip_code.trim(),
                      state_id: address.state_id || null
                    })
                    .select('id')
                    .single();
                  
                  if (zipCreateError) {
                    console.error('Error creating zip code:', zipCreateError);
                  } else {
                    zip_code_id = newZipCode.id;
                  }
                } catch (err) {
                  console.error('Error in zip code creation process:', err);
                }
              }
            }
            
            // Update address with the zip code
            await supabase
              .from('business_addresses')
              .update({
                street_address: address.street_address,
                secondary_street_address: address.secondary_street_address || null,
                city: address.city,
                state_id: address.state_id, // Now null if it was empty string
                zip_code_id: zip_code_id,
                status: address.status
              })
              .eq('id', address.id);
          }
        }
        
        // Handle social media updates
        for (const social of $socialMedia) {
          if (social.isNew) {
            // Insert new social media
            await supabase
              .from('business_social_media_accounts')
              .insert({
                business_id: businessId,
                social_media_account: social.social_media_account,
                service_type: social.service_type,
                status: social.status
              });
          } else if (social.isDeleted) {
            // Delete social media
            await supabase
              .from('business_social_media_accounts')
              .delete()
              .eq('id', social.id);
          } else if (social.isModified) {
            // Update social media
            await supabase
              .from('business_social_media_accounts')
              .update({
                social_media_account: social.social_media_account,
                service_type: social.service_type,
                status: social.status
              })
              .eq('id', social.id);
          }
        }
        
        // Handle tags updates
        // First get existing tags
        const { data: existingTags, error: existingTagsError } = await supabase
          .from('business_tags')
          .select('id, tag')
          .eq('business_id', businessId);
        
        if (existingTagsError) throw existingTagsError;
        
        // Delete tags that are no longer in the current tags list
        for (const existingTag of existingTags || []) {
          if (!$tags.includes(existingTag.tag)) {
            await supabase
              .from('business_tags')
              .delete()
              .eq('id', existingTag.id);
          }
        }
        
        // Add new tags
        const existingTagValues = (existingTags || []).map(t => t.tag);
        const newTags = $tags.filter(tag => !existingTagValues.includes(tag));
        
        for (const newTag of newTags) {
          await supabase
            .from('business_tags')
            .insert({
              business_id: businessId,
              tag: newTag
            });
        }
        
        // Success notification
        toastStore.success('Business updated successfully');
        
        // Refresh business data
        fetchBusinessDetails();
        
        // Reset has changes flag
        hasChanges.set(false);
        
        // Notify parent about changes
        dispatch('updated');
        
      } catch (err) {
        console.error('Error saving business changes:', err);
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
      fetchBusinessDetails();
      
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
      // Check if any multi-item sections have changes
      const hasPhoneChanges = $phoneNumbers.some(phone => phone.isNew || phone.isDeleted || phone.isModified);
      const hasAddressChanges = $addresses.some(address => address.isNew || address.isDeleted || address.isModified);
      const hasSocialChanges = $socialMedia.some(social => social.isNew || social.isDeleted || social.isModified);
      const hasEmployeeChanges = $employees.some(employee => employee.isNew || employee.isDeleted || employee.isModified);
      
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
      
      const anyChanges = hasPhoneChanges || hasAddressChanges || hasSocialChanges || 
                       hasTagChanges || hasEmployeeChanges;
      
      hasChanges.set(anyChanges);
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
    
    // Watch for business ID changes
    $: if (businessId && isOpen) {
      fetchBusinessDetails();
      fetchOptions();
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
                      Error Loading Business
                    {:else}
                      {$formData.business_name}
                    {/if}
                  </h2>
                  <p class="mt-1 text-sm {$hasChanges ? 'text-orange-500 font-medium' : 'text-gray-500'}">
                    {#if $hasChanges}
                      You have unsaved changes
                    {:else}
                      Business details
                    {/if}
                  </p>
                </div>
                <button
                  type="button"
                  class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <form class="space-y-6" on:click|stopPropagation={() => {}}>
                  <!-- Basic Information Section -->
                  <BusinessBasicInfo 
                    {formData}
                    isSaving={$isSaving}
                    on:change={handleFormDataChange}
                  />
                  
                  <!-- Phone Numbers Section -->
                  <BusinessPhones 
                    phoneNumbers={phoneNumbers}
                    isSaving={$isSaving}
                    on:change={handleMultiItemChange}
                  />
                  
                  <!-- Addresses Section -->
                  <BusinessAddresses 
                    {addresses}
                    {stateOptions}
                    isSaving={$isSaving}
                    on:change={handleMultiItemChange}
                  />
                  
                  <!-- Social Media Section -->
                  <BusinessSocialMedia 
                    socialMedia={socialMedia}
                    isSaving={$isSaving}
                    on:change={handleMultiItemChange}
                  />
                  
                  <!-- Employees Section -->
                  <BusinessEmployees 
                    {employees}
                    {supabase}
                    isSaving={$isSaving}
                    on:change={handleMultiItemChange}
                  />
                  
                  <!-- Tags Section -->
                  <BusinessTags 
                    {tags}
                    isSaving={$isSaving}
                    on:change={handleMultiItemChange}
                  />
                  
                  <!-- Donations Section -->
                  {#if businessId}
                    <BusinessDonations
                      {businessId}
                      {supabase}
                      isSaving={$isSaving}
                    />
                  {/if}
                </form>
              {/if}
            </div>
            
            <!-- Footer with action buttons -->
            <div class="px-4 py-4 sm:px-6 bg-gray-50 border-t sticky bottom-0">
              <div class="flex justify-end space-x-3">
                {#if $hasChanges}
                  <button
                    type="button"
                    class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    on:click|stopPropagation={cancelChanges}
                    disabled={$isSaving}
                  >
                    Discard Changes
                  </button>
                  
                  <button
                    type="button"
                    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                    class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  class="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
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