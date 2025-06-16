<!-- src/lib/components/businesses/BusinessDetailsSheet.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { fly } from 'svelte/transition';
    import DetailsSheetOverlay from '$lib/components/DetailsSheetOverlay.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    import { fetchBusiness, updateBusiness } from '$lib/services/businessService';
    import { fetchStateOptions, fetchContactOptions } from '$lib/services/formOptionsService';
    import { X, AlertTriangle } from '@lucide/svelte';
    
    // Import entity-specific subcomponents
    import BusinessBasicInfo from './BusinessDetailsSheet/BusinessBasicInfo.svelte';
    import BusinessEmployees from './form/BusinessEmployees.svelte';
    import BusinessDonations from './BusinessDetailsSheet/BusinessDonations.svelte';
    
    // Import generic shared components
    import GenericPhones from '$lib/components/shared/GenericPhones.svelte';
    import GenericAddresses from '$lib/components/shared/GenericAddresses.svelte';
    import GenericSocialMedia from '$lib/components/shared/GenericSocialMedia.svelte';
    import GenericTags from '$lib/components/shared/GenericTags.svelte';
    import InteractionStream from '$lib/components/shared/InteractionStream.svelte';
    
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
    const isLoadingContacts = writable(false);
    
    // Create a compatible errors store for the form component
    const formErrors = writable<Record<string, string>>({});
    
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
    const contactOptions = writable<{id: string, name: string}[]>([]);
    
    // Fetch options
    async function fetchOptions() {
      try {
        // Fetch state options using the form options service
        const states = await fetchStateOptions();
        stateOptions.set(states);
        console.log("Fetched states for business details:", states.length);
      } catch (err) {
        console.error('Error fetching options:', err);
        error.set('Failed to load form options');
      }
    }
    
    // Function to fetch contacts based on search term
    async function searchContacts(searchTerm: string, workspaceId: string) {
      try {
        if (!workspaceId) {
          console.error('Missing workspace ID for contacts search');
          isLoadingContacts.set(false);
          return;
        }

        if (searchTerm.trim().length > 1) {
          isLoadingContacts.set(true);
          console.log('Searching contacts with term:', searchTerm, 'in workspace:', workspaceId);
          const contacts = await fetchContactOptions(workspaceId, searchTerm);
          contactOptions.set(contacts);
          console.log("Fetched contacts for search:", searchTerm, contacts.length);
          isLoadingContacts.set(false);
        } else {
          contactOptions.set([]);
          isLoadingContacts.set(false);
        }
      } catch (error) {
        console.error('Error searching contacts:', error);
        toastStore.error('Failed to search contacts');
        isLoadingContacts.set(false);
      }
    }
    
    async function fetchBusinessDetails() {
      if (!businessId) return;
      
      isLoading.set(true);
      error.set(null);
      
      try {
        // Use the business service to fetch business details via API endpoint
        const businessData = await fetchBusiness(businessId);
        console.log('Fetched business data:', businessData);
        
        if (businessData) {
          // Set basic info
          formData.set({
            business_name: businessData.businessName,
            status: businessData.status || 'active'
          });
          
          // Store original data for comparison
          originalData.set({
            ...JSON.parse(JSON.stringify($formData)),
            tags: businessData.tags ? [...businessData.tags.map(t => typeof t === 'string' ? t : t.tag)] : [],
            workspaceId: businessData.workspaceId // Store workspace ID for later use
          });
          
          // Convert API data format to component format
          
          // Set phone numbers
          if (businessData.phoneNumbers) {
            phoneNumbers.set(Array.isArray(businessData.phoneNumbers) ? 
              businessData.phoneNumbers.map(phone => ({
                id: phone.id,
                phone_number: phone.phoneNumber,
                status: phone.status || 'active'
              })) : []);
          } else {
            phoneNumbers.set([]);
          }
          
          // Set addresses
          if (businessData.addresses) {
            addresses.set(Array.isArray(businessData.addresses) ? 
              businessData.addresses.map(address => ({
                id: address.id,
                street_address: address.streetAddress || '',
                secondary_street_address: address.secondaryStreetAddress || '',
                city: address.city || '',
                state_id: address.stateId || '',
                zip_code: address.zipCode || '',
                status: address.status || 'active'
              })) : []);
          } else {
            addresses.set([]);
          }
          
          // Set social media
          if (businessData.socialMediaAccounts) {
            socialMedia.set(Array.isArray(businessData.socialMediaAccounts) ? 
              businessData.socialMediaAccounts.map(account => ({
                id: account.id,
                social_media_account: account.socialMediaAccount,
                service_type: account.serviceType,
                status: account.status || 'active'
              })) : []);
          } else {
            socialMedia.set([]);
          }
          
          // Set tags
          if (businessData.tags) {
            tags.set(Array.isArray(businessData.tags) ? 
              businessData.tags.map(tag => typeof tag === 'string' ? tag : tag.tag) : []);
          } else {
            tags.set([]);
          }
          
          // Set employees
          if (businessData.employees) {
            employees.set(Array.isArray(businessData.employees) ? 
              businessData.employees.map(employee => ({
                id: employee.id,
                contact_id: employee.contactId,
                status: employee.status || 'active',
                contact_name: employee.contactName || 'Unknown Contact',
                role: employee.role || '' // Map the role field from API
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
        // Prepare update data for API call
        const updateData: any = {};
        
        // Add basic info if changed
        if (JSON.stringify($formData) !== JSON.stringify($originalData)) {
          updateData.businessData = {
            business_name: $formData.business_name,
            status: $formData.status
          };
        }
        
        // Add phone numbers with flags for modification
        const phonesToUpdate = $phoneNumbers.map(phone => ({
          ...phone,
          isNew: phone.isNew || (!phone.id && phone.phone_number), // Mark as new if it's a new entry
          isModified: phone.isModified, // Keep modified flag
          isDeleted: phone.isDeleted // Keep deleted flag
        })).filter(phone => phone.isNew || phone.isModified || phone.isDeleted);
        
        if (phonesToUpdate.length > 0) {
          updateData.phoneNumbers = phonesToUpdate;
        }
        
        // Add addresses with flags for modification
        const addressesToUpdate = $addresses.map(address => ({
          ...address,
          isNew: address.isNew || (!address.id && address.street_address), // Mark as new if it's a new entry
          isModified: address.isModified, // Keep modified flag
          isDeleted: address.isDeleted // Keep deleted flag
        })).filter(address => address.isNew || address.isModified || address.isDeleted);
        
        if (addressesToUpdate.length > 0) {
          updateData.addresses = addressesToUpdate;
        }
        
        // Add social media with flags for modification
        const socialMediaToUpdate = $socialMedia.map(social => ({
          ...social,
          isNew: social.isNew || (!social.id && social.social_media_account), // Mark as new if it's a new entry
          isModified: social.isModified, // Keep modified flag
          isDeleted: social.isDeleted // Keep deleted flag
        })).filter(social => social.isNew || social.isModified || social.isDeleted);
        
        if (socialMediaToUpdate.length > 0) {
          updateData.socialMedia = socialMediaToUpdate;
        }
        
        // Add employees with flags for modification
        const employeesToUpdate = $employees.map(employee => ({
          ...employee,
          isNew: employee.isNew || (!employee.id && employee.contact_id), // Mark as new if it's a new entry
          isModified: employee.isModified, // Keep modified flag
          isDeleted: employee.isDeleted // Keep deleted flag
        })).filter(employee => employee.isNew || employee.isModified || employee.isDeleted);
        
        if (employeesToUpdate.length > 0) {
          updateData.employees = employeesToUpdate;
        }
        
        // Add tags if changed
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
        
        if (hasTagChanges) {
          updateData.tags = $tags;
        }
        
        console.log('Sending update data via API:', updateData);
        
        // Use the business service to update via API endpoint
        if (Object.keys(updateData).length > 0) {
          try {
            const updatedBusiness = await updateBusiness(businessId, updateData);
            console.log('API update response:', updatedBusiness);
            
            // Success notification
            toastStore.success('Business updated successfully');
            
            // Refresh business data
            await fetchBusinessDetails();
            
            // Reset has changes flag
            hasChanges.set(false);
            
            // Notify parent about changes
            dispatch('updated');
          } catch (updateError) {
            console.error('Error during API update:', updateError);
            error.set('Failed to save changes: ' + (updateError.message || 'API error'));
            toastStore.error('Failed to save changes: ' + (updateError.message || 'API error'));
          }
        } else {
          console.log('No changes to update');
          toastStore.info('No changes to update');
        }
        
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
      
      // Compare with original tags
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

    // Watch for contact option changes to update loading state
    $: if (contactOptions) {
      isLoadingContacts.set(false);
    }
  </script>
  
  {#if isOpen}
    <DetailsSheetOverlay {isOpen} on:close={handleClose} zIndex={9998}>
      <div class="fixed inset-0 z-[9999] overflow-hidden" on:click|stopPropagation={() => {}}>
        <!-- Sheet panel - prevent click events from reaching the backdrop -->
        <div 
          class="absolute inset-y-0 right-0 max-w-5xl w-full flex"
          transition:fly={{ duration: 300, x: '100%' }}
          on:click|stopPropagation={() => {}}
        >
          <div class="h-full w-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <!-- Header -->
            <div class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-semibold text-slate-900">
                  {#if $isLoading}
                    Loading...
                  {:else if $error}
                    Error Loading Business
                  {:else}
                    {$formData.business_name}
                  {/if}
                </h2>
                <p class="text-sm text-slate-500 mt-1">
                  {#if $hasChanges}
                    <span class="text-amber-600 font-medium">You have unsaved changes</span>
                  {:else}
                    Business details
                  {/if}
                </p>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors"
                on:click|stopPropagation={handleClose}
              >
                <span class="sr-only">Close panel</span>
                <X size={20} />
              </button>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto">
              {#if $isLoading}
                <div class="flex h-32 items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              {:else if $error}
                <div class="rounded-md border border-red-200 bg-red-50 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <AlertTriangle class="h-5 w-5 text-red-400" />
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
                <!-- Two Column Layout: Stream on Left, Details on Right -->
                <div class="flex h-full" on:click|stopPropagation={() => {}}>
                  <!-- Left Column: Interaction Stream -->
                  <div class="w-96 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
                    <div class="p-6">
                      {#if businessId}
                        <InteractionStream
                          entityType="business"
                          entityId={businessId}
                          isSaving={$isSaving}
                          on:change={handleMultiItemChange}
                        />
                      {/if}
                    </div>
                  </div>
                  
                  <!-- Right Column: Business Details -->
                  <div class="flex-1 overflow-y-auto">
                    <div class="p-6 space-y-8">
                      <!-- Basic Information Section -->
                      <BusinessBasicInfo 
                        {formData}
                        isSaving={$isSaving}
                        on:change={handleFormDataChange}
                      />
                      
                      <!-- Phone Numbers Section -->
                      <GenericPhones 
                        {phoneNumbers}
                        isSaving={$isSaving}
                        entityType="business"
                        on:change={handleMultiItemChange}
                      />
                      
                      <!-- Addresses Section -->
                      <GenericAddresses 
                        {addresses}
                        {stateOptions}
                        isSaving={$isSaving}
                        entityType="business"
                        on:change={handleMultiItemChange}
                      />
                      
                      <!-- Social Media Section -->
                      <GenericSocialMedia 
                        {socialMedia}
                        isSaving={$isSaving}
                        entityType="business"
                        on:change={handleMultiItemChange}
                      />
                      
                      <!-- Employees Section -->
                      <BusinessEmployees 
                        {employees}
                        {contactOptions}
                        errors={formErrors}
                        isSubmitting={isSaving}
                        isLoadingContacts={$isLoadingContacts}
                        on:change={handleMultiItemChange}
                        on:searchContacts={(e) => searchContacts(e.detail, $originalData?.workspaceId)}
                      />
                      
                      <!-- Tags Section -->
                      <GenericTags 
                        {tags}
                        isSaving={$isSaving}
                        entityType="business"
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
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Footer with action buttons -->
            <div class="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
              {#if $hasChanges}
                <button
                  type="button"
                  class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                  on:click|stopPropagation={cancelChanges}
                  disabled={$isSaving}
                >
                  Discard Changes
                </button>
                
                <button
                  type="button"
                  class="inline-flex h-9 items-center justify-center rounded-md bg-green-600 px-3 text-sm font-medium text-white shadow transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600 disabled:pointer-events-none disabled:opacity-50"
                  on:click|stopPropagation={saveChanges}
                  disabled={$isSaving}
                >
                  {#if $isSaving}
                    <div class="flex items-center gap-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>Saving...</span>
                    </div>
                  {:else}
                    Save Changes
                  {/if}
                </button>
              {:else}
                <button
                  type="button"
                  class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  on:click|stopPropagation={handleClose}
                >
                  Close
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
  
      <!-- Unsaved changes confirmation dialog -->
      {#if $showUnsavedChangesDialog}
        <div class="fixed inset-0 z-[10000] flex min-h-full items-center justify-center p-4 bg-black/50">
          <div 
            class="relative w-full max-w-lg transform overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-lg transition-all"
            transition:fly={{ duration: 200, y: 10 }}
            on:click|stopPropagation={() => {}}
          >
            <div class="px-6 pb-4 pt-6">
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle class="h-5 w-5 text-amber-600" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-base font-semibold text-slate-900">Unsaved Changes</h3>
                  <div class="mt-2">
                    <p class="text-sm text-slate-500">
                      You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button 
                type="button" 
                class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                on:click|stopPropagation={() => showUnsavedChangesDialog.set(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                on:click|stopPropagation={discardChangesAndClose}
              >
                Discard
              </button>
              <button 
                type="button" 
                class="inline-flex h-9 items-center justify-center rounded-md bg-green-600 px-3 text-sm font-medium text-white shadow transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-600"
                on:click|stopPropagation={saveChangesAndClose}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      {/if}
    </DetailsSheetOverlay>
  {/if}