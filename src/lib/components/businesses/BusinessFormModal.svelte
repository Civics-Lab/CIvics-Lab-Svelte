<!-- src/lib/components/businesses/BusinessFormModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { writable } from 'svelte/store';
    import Modal from '$lib/components/Modal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
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
        // Fetch state options
        const { data: stateData, error: stateError } = await supabase
          .from('states')
          .select('id, name, abbreviation')
          .order('name');
        
        if (stateError) throw stateError;
        stateOptions.set(stateData || []);
        
        // Fetch existing business tags
        const { data: tagData, error: tagError } = await supabase
          .from('business_tags')
          .select('tag')
          .order('tag');
        
        if (tagError) throw tagError;
        const uniqueTags = [...new Set(tagData?.map(t => t.tag) || [])];
        existingTags.set(uniqueTags);
        
        // Fetch contacts for employees
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .eq('status', 'active')
          .order('last_name');
        
        if (contactError) throw contactError;
        contactOptions.set((contactData || []).map(c => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`
        })));
        
      } catch (error) {
        console.error('Error fetching options:', error);
        toastStore.error('Failed to load form options');
      }
    }
    
    async function handleSubmit() {
        if (!validateForm()) return;
        
        isSubmitting.set(true);
        errors.set({});
        
        try {
            // Log what we're sending to check data structure
            console.log('Submitting form data:', {
                business: {
                    business_name: $formData.business_name,
                    status: $formData.status,
                    workspace_id: $workspaceStore.currentWorkspace?.id
                },
                phones: $formData.phones.filter(p => p.phone_number.trim()),
                addresses: $formData.addresses.filter(addr => addr.street_address && addr.city && addr.state_id && addr.zip_code),
                socialMedia: $formData.socialMedia.filter(s => s.social_media_account.trim()),
                employees: $employees.filter(e => e.contact_id),
                tags: $tags
            });
            
            // Ensure we have the workspace_id for all operations
            if (!$workspaceStore.currentWorkspace?.id) {
                toastStore.error('No workspace selected. Please select a workspace first.');
                throw new Error('No workspace selected');
            }
            
            // Create business
            const { data: business, error: businessError } = await supabase
                .from('businesses')
                .insert({
                    business_name: $formData.business_name,
                    status: $formData.status,
                    workspace_id: $workspaceStore.currentWorkspace?.id
                })
                .select()
                .single();
            
            if (businessError) throw businessError;
            
            console.log('Business created:', business);
            
            // Arrays to track created relationships
            const createdRelationships = {
                phones: [],
                addresses: [],
                socialMedia: [],
                employees: [],
                tags: []
            };
            
            // Handle phone numbers (multiple)
            const phonePromises = $formData.phones
                .filter(phone => phone.phone_number.trim())
                .map(async phone => {
                    const { data, error } = await supabase
                        .from('business_phone_numbers')
                        .insert({
                          business_id: business.id,
                          phone_number: phone.phone_number,
                          status: phone.status || 'active'
                        })
                        .select();
                    
                    if (error) {
                        console.error('Error saving phone number:', error);
                        return { success: false, error };
                    }
                    
                    createdRelationships.phones.push(data[0]);
                    return { success: true, data };
                });
            
            // Handle addresses (multiple)
            const addressPromises = [];
            for (const addr of $formData.addresses.filter(addr => addr.street_address && addr.city && addr.state_id && addr.zip_code)) {
                try {
                    // First, look up the zip code ID or create it if needed
                    let zipCodeId;
                    
                    try {
                        // Check if the zip code exists
                        const { data: existingZip, error: zipLookupError } = await supabase
                            .from('zip_codes')
                            .select('id')
                            .eq('name', addr.zip_code)
                            .maybeSingle();
                        
                        if (!zipLookupError && existingZip) {
                            zipCodeId = existingZip.id;
                        } else {
                            // Zip code doesn't exist, create it
                            console.log(`Creating new zip code for: ${addr.zip_code}`);
                            const { data: newZip, error: createZipError } = await supabase
                                .from('zip_codes')
                                .insert({ name: addr.zip_code })
                                .select()
                                .single();
                                
                            if (createZipError) {
                                console.error('Error creating zip code:', createZipError);
                                continue; // Skip this address
                            }
                            
                            zipCodeId = newZip.id;
                        }
                    } catch (zipError) {
                        console.error('Exception in zip code lookup/creation:', zipError);
                        continue; // Skip this address
                    }
                    
                    // Now create the address with the proper zip_code_id
                    const { data, error } = await supabase
                        .from('business_addresses')
                        .insert({
                          business_id: business.id,
                          street_address: addr.street_address,
                          secondary_street_address: addr.secondary_street_address || null,
                          city: addr.city,
                          state_id: addr.state_id,
                          zip_code_id: zipCodeId,
                          status: addr.status || 'active'
                        })
                        .select();
                    
                    if (error) {
                        console.error('Error saving address:', error);
                    } else if (data) {
                        createdRelationships.addresses.push(data[0]);
                    }
                } catch (err) {
                    console.error('Exception while creating address:', err);
                }
            }
            
            // Handle social media (multiple)
            const socialMediaPromises = $formData.socialMedia
                .filter(social => social.social_media_account.trim())
                .map(async social => {
                    const { data, error } = await supabase
                        .from('business_social_media_accounts')
                        .insert({
                          business_id: business.id,
                          social_media_account: social.social_media_account,
                          service_type: social.service_type,
                          status: social.status || 'active'
                        })
                        .select();
                    
                    if (error) {
                        console.error('Error saving social media account:', error);
                        return { success: false, error };
                    }
                    
                    createdRelationships.socialMedia.push(data[0]);
                    return { success: true, data };
                });
                
            // Handle employees (multiple)
            const employeePromises = $employees
                .filter(employee => employee.contact_id)
                .map(async employee => {
                    const { data, error } = await supabase
                        .from('business_employees')
                        .insert({
                          business_id: business.id,
                          contact_id: employee.contact_id,
                          status: employee.status || 'active'
                        })
                        .select();
                    
                    if (error) {
                        console.error('Error saving employee:', error);
                        return { success: false, error };
                    }
                    
                    createdRelationships.employees.push(data[0]);
                    return { success: true, data };
                });
            
            // Handle tags
            const tagPromises = $tags.length > 0
                ? $tags.map(async tag => {
                    const { data, error } = await supabase
                        .from('business_tags')
                        .insert({
                          business_id: business.id,
                          tag
                        })
                        .select();
                    
                    if (error) {
                        console.error('Error saving tag:', error);
                        return { success: false, error };
                    }
                    
                    createdRelationships.tags.push(data[0]);
                    return { success: true, data };
                })
                : [];
            
            // Execute all promises
            const phoneResults = await Promise.allSettled(phonePromises);
            // addressPromises is already handled with await in the loop
            const socialMediaResults = await Promise.allSettled(socialMediaPromises);
            const employeeResults = await Promise.allSettled(employeePromises);
            const tagResults = await Promise.allSettled(tagPromises);
            
            // Log the results to see what happened
            console.log('Created relationships:', {
                phones: createdRelationships.phones,
                addresses: createdRelationships.addresses,
                socialMedia: createdRelationships.socialMedia,
                employees: createdRelationships.employees,
                tags: createdRelationships.tags
            });
            
            // Check for any errors
            const allResults = [
                ...phoneResults,
                ...socialMediaResults,
                ...employeeResults,
                ...tagResults
            ];
            
            const errors = allResults
                .filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
                .map(result => {
                    if (result.status === 'rejected') {
                        return result.reason;
                    } else {
                        return (result.value as any).error;
                    }
                });
            
            if (errors.length > 0) {
                console.error('Some operations failed:', errors);
                toastStore.warning('Business created but some details could not be saved');
            } else {
                // Success toast and reset form
                toastStore.success('Business created successfully!');
                resetForm();
            }
            
            // Emit success event with created business and relationships
            dispatch('success', {
                business,
                relationships: createdRelationships
            });
            
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
