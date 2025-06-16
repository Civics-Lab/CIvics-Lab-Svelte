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
    import { fetchFormOptions } from '$lib/services/optionsService';
    import { fetchContactOptions } from '$lib/services/formOptionsService';
    
    // Import entity-specific components
    import BusinessBasicInfo from './BusinessDetailsSheet/BusinessBasicInfo.svelte';
    import BusinessEmployees from './form/BusinessEmployees.svelte';
    
    // Import generic shared components
    import GenericPhones from '$lib/components/shared/GenericPhones.svelte';
    import GenericAddresses from '$lib/components/shared/GenericAddresses.svelte';
    import GenericSocialMedia from '$lib/components/shared/GenericSocialMedia.svelte';
    import AutocompleteTags from '$lib/components/shared/AutocompleteTags.svelte';
    
    export let isOpen = false;
    export let supabase: TypedSupabaseClient;
    
    const dispatch = createEventDispatcher();
    
    // Form state for basic info
    const formData = writable({
        business_name: '',
        status: 'active'
    });
    
    // Multi-item sections - using same structure as detail sheet
    const phoneNumbers = writable([{ phone_number: '', status: 'active', isNew: true, isModified: false, isDeleted: false }]);
    const addresses = writable([{ 
        street_address: '', 
        secondary_street_address: '', 
        city: '', 
        state_id: '', 
        zip_code: '', 
        status: 'active',
        isNew: true,
        isModified: false,
        isDeleted: false
    }]);
    const socialMedia = writable([{ 
        social_media_account: '', 
        service_type: 'facebook', 
        status: 'active',
        isNew: true,
        isModified: false,
        isDeleted: false
    }]);
    const tags = writable([]);
    const employees = writable([]);
    
    // Loading and errors
    const isSubmitting = writable(false);
    const errors = writable<Record<string, string>>({});
    
    // Options for dropdowns
    const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
    const contactOptions = writable<{id: string, name: string}[]>([]);
    const isLoadingContacts = writable(false);
    
    function validateForm() {
        let valid = true;
        let formErrors: Record<string, string> = {};
        
        // Required fields
        if (!$formData.business_name.trim()) {
            formErrors.business_name = 'Business name is required';
            valid = false;
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
            if (!$workspaceStore.currentWorkspace) {
                throw new Error('No workspace selected');
            }
            
            // Fetch all form options at once
            console.log('Fetching all form options...');
            const options = await fetchFormOptions($workspaceStore.currentWorkspace.id);
            
            console.log('Form options fetched:', options);
            
            // Set options in stores
            stateOptions.set(options.states || []);
        } catch (error) {
            console.error('Error in fetchOptions:', error);
            toastStore.error('Failed to load form options. Some dropdowns may not be populated.');
        }
    }
    
    // Function to fetch contacts based on search term
    async function searchContacts(searchTerm: string) {
        if (!$workspaceStore.currentWorkspace?.id) {
            console.error('No workspace selected');
            isLoadingContacts.set(false);
            return;
        }
        
        try {
            if (searchTerm.trim().length > 1) {
                isLoadingContacts.set(true);
                const contacts = await fetchContactOptions($workspaceStore.currentWorkspace.id, searchTerm);
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
    
    async function handleSubmit() {
        if (!validateForm()) return;
        
        isSubmitting.set(true);
        errors.set({});
        
        console.log('Form data being submitted:', {
            formData: $formData,
            phoneNumbers: $phoneNumbers,
            addresses: $addresses,
            socialMedia: $socialMedia,
            tags: $tags,
            employees: $employees
        });
        
        try {
            if (!$workspaceStore.currentWorkspace?.id) {
                throw new Error('No workspace selected');
            }
            
            // Prepare business data for the API
            const businessData = {
                workspaceId: $workspaceStore.currentWorkspace.id,
                business: {
                    business_name: $formData.business_name,
                    status: $formData.status
                },
                phoneNumbers: $phoneNumbers
                    .filter(item => !item.isDeleted && item.phone_number && item.phone_number.trim())
                    .map(item => ({
                        phone_number: item.phone_number.trim(),
                        status: item.status || 'active'
                    })),
                addresses: $addresses
                    .filter(addr => !addr.isDeleted && addr.street_address && addr.street_address.trim() && addr.city && addr.city.trim())
                    .map(addr => ({
                        street_address: addr.street_address.trim(),
                        secondary_street_address: addr.secondary_street_address?.trim() || '',
                        city: addr.city.trim(),
                        state_id: addr.state_id,
                        zip_code: addr.zip_code?.trim() || '',
                        status: addr.status || 'active'
                    })),
                socialMedia: $socialMedia
                    .filter(item => !item.isDeleted && item.social_media_account && item.social_media_account.trim())
                    .map(item => ({
                        social_media_account: item.social_media_account.trim(),
                        service_type: item.service_type,
                        status: item.status || 'active'
                    })),
                employees: $employees
                    .filter(item => !item.isDeleted && item.contact_id)
                    .map(item => ({
                        contact_id: item.contact_id,
                        status: item.status || 'active',
                        role: item.role || ''
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
            status: 'active'
        });
        
        phoneNumbers.set([{ phone_number: '', status: 'active', isNew: true, isModified: false, isDeleted: false }]);
        addresses.set([{ 
            street_address: '', 
            secondary_street_address: '', 
            city: '', 
            state_id: '', 
            zip_code: '', 
            status: 'active',
            isNew: true,
            isModified: false,
            isDeleted: false
        }]);
        socialMedia.set([{ 
            social_media_account: '', 
            service_type: 'facebook', 
            status: 'active',
            isNew: true,
            isModified: false,
            isDeleted: false
        }]);
        tags.set([]);
        employees.set([]);
        errors.set({});
    }
    
    // Event handlers for child components
    function handleFormDataChange() {
        // Form data change handling if needed
    }
    
    function handleMultiItemChange() {
        // Multi-item change handling if needed
    }
    
    // Fetch options when the component mounts and modal opens
    $: if (isOpen) {
        fetchOptions();
        resetForm();
    }
    
    // Make sure we fetch options on mount too
    onMount(() => {
        if (isOpen) {
            fetchOptions();
        }
    });
</script>

<Modal 
    {isOpen} 
    title="Add New Business" 
    on:close={handleClose}
    maxWidth="max-w-4xl"
>
    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
        <!-- Basic Information Section -->
        <BusinessBasicInfo 
            {formData}
            isSaving={$isSubmitting}
            on:change={handleFormDataChange}
        />
        
        {#if $errors.workspace}
            <div class="rounded-md border border-red-200 bg-red-50 p-4">
                <p class="text-sm text-red-700">{$errors.workspace}</p>
            </div>
        {/if}
        
        <!-- Phone Numbers Section -->
        <GenericPhones 
            {phoneNumbers}
            isSaving={$isSubmitting}
            entityType="business"
            on:change={handleMultiItemChange}
        />
        
        <!-- Addresses Section -->
        <GenericAddresses 
            {addresses}
            {stateOptions}
            isSaving={$isSubmitting}
            entityType="business"
            on:change={handleMultiItemChange}
        />
        
        <!-- Social Media Section -->
        <GenericSocialMedia 
            {socialMedia}
            isSaving={$isSubmitting}
            entityType="business"
            on:change={handleMultiItemChange}
        />
        
        <!-- Employees Section -->
        <BusinessEmployees 
            {employees}
            {contactOptions}
            errors={errors}
            isSubmitting={isSubmitting}
            {isLoadingContacts}
            on:change={handleMultiItemChange}
            on:searchContacts={(e) => searchContacts(e.detail)}
        />
        
        <!-- Tags Section -->
        <AutocompleteTags 
            {tags}
            isSaving={$isSubmitting}
            entityType="business"
            on:change={handleMultiItemChange}
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