<!-- src/lib/components/businesses/BusinessFormModal.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import Modal from '$lib/components/Modal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    import { createBusiness } from '$lib/services/businessService';
    import { fetchStateOptions, fetchContactOptions } from '$lib/services/formOptionsService';
    
    // Import modular form components
    import BusinessBasicInfo from './form/BusinessBasicInfo.svelte';
    import BusinessPhones from './form/BusinessPhones.svelte';
    import BusinessAddresses from './form/BusinessAddresses.svelte';
    import BusinessSocialMedia from './form/BusinessSocialMedia.svelte';
    import BusinessEmployees from './form/BusinessEmployees.svelte';
    import BusinessTags from './form/BusinessTags.svelte';
    
    export let isOpen = false;
    export let supabase: TypedSupabaseClient;
    
    const dispatch = createEventDispatcher();
    
    // Form state
    const formData = writable({
        business_name: '',
        status: 'active',
        phones: [{ phone_number: '', status: 'active' }],
        addresses: [{
          street_address: '',
          secondary_street_address: '',
          city: '',
          state_id: '',
          zip_code: '',
          status: 'active'
        }],
        socialMedia: [{ 
          social_media_account: '', 
          service_type: 'facebook', 
          status: 'active' 
        }]
    });
    
    // Employees state
    const employees = writable([]);
    
    // Tags state
    const tags = writable([]);
    const tagInput = writable('');
    const existingTags = writable<string[]>([]);
    const filteredTags = writable<string[]>([]);
    
    // Loading and errors
    const isSubmitting = writable(false);
    const errors = writable<Record<string, string>>({});
    
    // Options for dropdowns
    const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
    const contactOptions = writable<{id: string, name: string}[]>([]);
    
    function validateForm() {
        let valid = true;
        let formErrors: Record<string, string> = {};
        
        // Required fields
        if (!$formData.business_name.trim()) {
            formErrors.business_name = 'Business name is required';
            valid = false;
        }
        
        // Validate addresses that have any data
        $formData.addresses.forEach((address, index) => {
            const hasAnyAddressField = address.street_address || address.city || address.state_id || address.zip_code;
            
            if (hasAnyAddressField) {
              if (!address.street_address.trim()) {
                formErrors[`address_${index}_street`] = 'Street address is required';
                valid = false;
              }
            
              if (!address.city.trim()) {
                formErrors[`address_${index}_city`] = 'City is required';
                valid = false;
              }
            
              if (!address.state_id) {
                formErrors[`address_${index}_state`] = 'State is required';
                valid = false;
              }
            
              if (!address.zip_code.trim()) {
                  formErrors[`address_${index}_zip`] = 'ZIP code is required';
                  valid = false;
              }
              
              // Ensure zip codes are in a valid format
              if (address.zip_code.trim() && !/^\d{5}(-\d{4})?$/.test(address.zip_code.trim())) {
                  formErrors[`address_${index}_zip_format`] = 'ZIP code should be in 5-digit or 5+4 format';
                  valid = false;
              }
            }
        });
      
        // Ensure at least one phone has content if any phone field is filled
        const hasAnyPhoneData = $formData.phones.some(p => p.phone_number.trim());
        if (hasAnyPhoneData) {
            // Check if any phones are incomplete
            const allPhonesValid = $formData.phones.every(p => p.phone_number.trim() || p.phone_number === '');
            if (!allPhonesValid) {
              formErrors.phone_general = 'Please complete or remove partial phone entries';
              valid = false;
            }
            
            // Check phone number formats
            $formData.phones.forEach((phone, index) => {
              if (phone.phone_number.trim() && !/^\+?[1-9]\d{1,14}$/.test(phone.phone_number.trim())) {
                formErrors[`phone_${index}_format`] = 'Phone should be in international format (e.g., +12345678901)';
                valid = false;
              }
            });
        }
        
        // Ensure we have workspace_id
        if (!$workspaceStore.currentWorkspace?.id) {
            formErrors.workspace = 'No workspace selected. Please select a workspace first.';
            valid = false;
        }
      
        errors.set(formErrors);
        return valid;
    }
    
    async function fetchOptions() {
      try {
        console.log("Fetching options for business form");
        
        // Use the form options service to fetch states
        const states = await fetchStateOptions();
        stateOptions.set(states);
        console.log("Fetched states:", states.length);
        
        // Sample tags (we can implement a tag API endpoint later)
        const hardcodedTags = ["retail", "tech", "healthcare", "education", "nonprofit", "local", "national"];
        existingTags.set(hardcodedTags);
        
        // For contacts, we'll fetch them when the user starts typing in the employee field
        // Instead of prefetching all contacts
        
      } catch (error) {
        console.error('Error fetching form options:', error);
        toastStore.error('Failed to load form options');
      }
    }
    
    // Function to fetch contacts based on search term
    async function searchContacts(searchTerm: string) {
      if (!$workspaceStore.currentWorkspace?.id) {
        console.error('No workspace selected');
        return;
      }
      
      try {
        if (searchTerm.trim().length > 1) {
          const contacts = await fetchContactOptions($workspaceStore.currentWorkspace.id, searchTerm);
          contactOptions.set(contacts);
          console.log("Fetched contacts for search:", searchTerm, contacts.length);
        } else {
          contactOptions.set([]);
        }
      } catch (error) {
        console.error('Error searching contacts:', error);
      }
    }
    
    async function handleSubmit() {
        if (!validateForm()) return;
        
        isSubmitting.set(true);
        errors.set({});
        
        try {
            // Prepare the business data for the API
            const businessData = {
                workspaceId: $workspaceStore.currentWorkspace?.id,
                business: {
                    business_name: $formData.business_name,
                    status: $formData.status
                },
                phoneNumbers: $formData.phones
                    .filter(p => p.phone_number.trim())
                    .map(phone => ({
                        phone_number: phone.phone_number,
                        status: phone.status || 'active'
                    })),
                addresses: $formData.addresses
                    .filter(addr => addr.street_address && addr.city && addr.state_id && addr.zip_code)
                    .map(address => ({
                        street_address: address.street_address,
                        secondary_street_address: address.secondary_street_address || '',
                        city: address.city,
                        state_id: address.state_id,
                        zip_code: address.zip_code,
                        status: address.status || 'active'
                    })),
                socialMedia: $formData.socialMedia
                    .filter(s => s.social_media_account.trim())
                    .map(social => ({
                        social_media_account: social.social_media_account,
                        service_type: social.service_type,
                        status: social.status || 'active'
                    })),
                employees: $employees
                    .filter(e => e.contact_id)
                    .map(employee => ({
                        contact_id: employee.contact_id,
                        status: employee.status || 'active'
                    })),
                tags: $tags
            };
            
            console.log('Submitting business data:', businessData);
            
            // Use the business service to create the business
            const newBusiness = await createBusiness(businessData);
            
            // Success toast and reset form
            toastStore.success('Business created successfully!');
            resetForm();
            
            // Emit success event with created business
            dispatch('success', newBusiness);
            
            // Close modal
            handleClose();
            
        } catch (error) {
            console.error('Error creating business:', error);
            toastStore.error('Failed to create business');
        } finally {
            isSubmitting.set(false);
        }
    }
    
    function handleClose() {
      dispatch('close');
    }
    
    function resetForm() {
        formData.set({
            business_name: '',
            status: 'active',
            phones: [{ phone_number: '', status: 'active' }],
            addresses: [{
              street_address: '',
              secondary_street_address: '',
              city: '',
              state_id: '',
              zip_code: '',
              status: 'active'
            }],
            socialMedia: [{ 
              social_media_account: '', 
              service_type: 'facebook', 
              status: 'active' 
            }]
        });
        employees.set([]);
        tags.set([]);
        tagInput.set('');
        filteredTags.set([]);
        errors.set({});
    }
    
    // Tag input change handler to filter existing tags
    function handleTagInputChange() {
      if ($tagInput.trim()) {
        filteredTags.set(
          $existingTags.filter(tag => 
            tag.toLowerCase().includes($tagInput.toLowerCase()) && 
            !$tags.includes(tag)
          ).slice(0, 5)
        );
      } else {
        filteredTags.set([]);
      }
    }
    
    // Fetch options when the component mounts and modal opens
    $: if (isOpen) {
      fetchOptions();
      resetForm();
    }
    
    // Watch for tag input changes
    $: if ($tagInput !== undefined) {
      handleTagInputChange();
    }
    
    // Make sure we fetch options on mount too
    onMount(() => {
      if (isOpen) {
        fetchOptions();
      }
    });
</script>

<Modal {isOpen} title="Add New Business" on:close={handleClose}>
  <form>
    <BusinessBasicInfo
      {formData}
      {errors}
      {isSubmitting}
    />
    
    {#if $errors.workspace}
      <div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        <p>{$errors.workspace}</p>
      </div>
    {/if}
    
    <BusinessPhones
      {formData}
      {errors}
      {isSubmitting}
    />
    
    <BusinessAddresses
      {formData}
      {errors}
      {isSubmitting}
      {stateOptions}
    />
    
    <BusinessSocialMedia
      {formData}
      {errors}
      {isSubmitting}
    />
    
    <BusinessEmployees
      {employees}
      {errors}
      {isSubmitting}
      {contactOptions}
      on:searchContacts={(e) => searchContacts(e.detail)}
    />
    
    <BusinessTags
      {tags}
      {tagInput}
      {existingTags}
      {filteredTags}
      {errors}
      {isSubmitting}
    />
  </form>
  
  <svelte:fragment slot="footer">
    <button
      type="button"
      class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      on:click={handleClose}
      disabled={$isSubmitting}
    >
      Cancel
    </button>
    <button
      type="button"
      class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      on:click={handleSubmit}
      disabled={$isSubmitting}
    >
      {#if $isSubmitting}
        <div class="flex items-center">
          <LoadingSpinner size="sm" color="white" />
          <span class="ml-2">Saving...</span>
        </div>
      {:else}
        Save Business
      {/if}
    </button>
  </svelte:fragment>
</Modal>
