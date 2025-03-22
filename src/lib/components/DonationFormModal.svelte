<!-- src/lib/components/DonationFormModal.svelte -->
<script lang="ts">
    import { writable } from 'svelte/store';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    import type { Business, Contact } from '$lib/types/supabase';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import BusinessFormModal from './BusinessFormModal.svelte';
    import ContactFormModal from './ContactFormModal.svelte';
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    
    export let supabase: TypedSupabaseClient;
    export let isOpen = false;
    export let onClose = () => {};
    
    const dispatch = createEventDispatcher();
    
    // Form data
    const formData = writable({
        amount: '',
        donorType: 'person', // 'person' or 'business'
        contactId: '',
        businessId: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'promise' // Default status
    });
    
    // UI state
    const isSubmitting = writable(false);
    const error = writable<string | null>(null);
    const isBusinessFormOpen = writable(false);
    const isContactFormOpen = writable(false);
    
    // Data stores
    const businesses = writable<Business[]>([]);
    const contacts = writable<Contact[]>([]);
    const isLoadingData = writable(false);
    
    // Load businesses and contacts on mount
    onMount(async () => {
        if (isOpen) {
            await loadData();
        }
    });
    
    // Watch for changes to isOpen and load data when it becomes true
    $: if (isOpen) {
        loadData();
    }
    
    async function loadData() {
        isLoadingData.set(true);
        
        try {
            // Load businesses
            const { data: businessesData, error: businessesError } = await supabase
                .from('businesses')
                .select('*')
                .eq('workspace_id', $workspaceStore.currentWorkspace?.id)
                .eq('status', 'active');
                
            if (businessesError) throw businessesError;
            businesses.set(businessesData || []);
            
            // Load contacts
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select('*')
                .eq('workspace_id', $workspaceStore.currentWorkspace?.id)
                .eq('status', 'active');
                
            if (contactsError) throw contactsError;
            contacts.set(contactsData || []);
            
        } catch (err) {
            console.error('Error loading data:', err);
            error.set(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            isLoadingData.set(false);
        }
    }
    
    // Format contact name for display
    function formatContactName(contact: Contact): string {
        return `${contact.first_name} ${contact.middle_name ? contact.middle_name + ' ' : ''}${contact.last_name}`.trim();
    }
    
    async function handleSubmit() {
        // Validate form
        if (!$formData.amount) {
            error.set('Amount is required');
            return;
        }
        
        if ($formData.donorType === 'person' && !$formData.contactId) {
            error.set('Please select a contact');
            return;
        }
        
        if ($formData.donorType === 'business' && !$formData.businessId) {
            error.set('Please select a business');
            return;
        }
        
        isSubmitting.set(true);
        error.set(null);
        
        try {
            // Prepare donation data with the dedicated donation_date field
            const donationData = {
                workspace_id: $workspaceStore.currentWorkspace?.id,
                amount: parseFloat($formData.amount),
                notes: $formData.notes || null,
                status: $formData.status,
                contact_id: $formData.donorType === 'person' ? $formData.contactId : null,
                business_id: $formData.donorType === 'business' ? $formData.businessId : null,
                donation_date: $formData.date // Using the new column
            };
            
            // Insert donation
            const { data: donation, error: donationError } = await supabase
                .from('donations')
                .insert(donationData)
                .select()
                .single();
            
            if (donationError) throw donationError;
            
            // Reset form and close modal
            resetForm();
            
            // Dispatch success event
            dispatch('success', donation);
            
            // Close modal
            dispatch('close');
            onClose();
            
        } catch (err) {
            console.error('Error creating donation:', err);
            error.set(err instanceof Error ? err.message : 'Failed to create donation');
        } finally {
            isSubmitting.set(false);
        }
    }
    
    function resetForm() {
        formData.set({
            amount: '',
            donorType: 'person',
            contactId: '',
            businessId: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            status: 'promise'
        });
        error.set(null);
    }
    
    function handleClose() {
        resetForm();
        dispatch('close');
        onClose();
    }
    
    // Open business form
    function openBusinessForm() {
        isBusinessFormOpen.set(true);
    }
    
    // Open contact form
    function openContactForm() {
        isContactFormOpen.set(true);
    }
    
    // Handle business created
    async function handleBusinessCreated() {
        isBusinessFormOpen.set(false);
        
        // Reload businesses
        try {
            const { data: businessesData, error: businessesError } = await supabase
                .from('businesses')
                .select('*')
                .eq('workspace_id', $workspaceStore.currentWorkspace?.id)
                .eq('status', 'active');
                
            if (businessesError) throw businessesError;
            
            businesses.set(businessesData || []);
            
            // Select newly created business (should be the last one)
            if (businessesData && businessesData.length > 0) {
                $formData.businessId = businessesData[businessesData.length - 1].id;
            }
            
        } catch (err) {
            console.error('Error reloading businesses:', err);
        }
    }
    
    // Handle contact created
    async function handleContactCreated() {
        isContactFormOpen.set(false);
        
        // Reload contacts
        try {
            const { data: contactsData, error: contactsError } = await supabase
                .from('contacts')
                .select('*')
                .eq('workspace_id', $workspaceStore.currentWorkspace?.id)
                .eq('status', 'active');
                
            if (contactsError) throw contactsError;
            
            contacts.set(contactsData || []);
            
            // Select newly created contact (should be the last one)
            if (contactsData && contactsData.length > 0) {
                $formData.contactId = contactsData[contactsData.length - 1].id;
            }
            
        } catch (err) {
            console.error('Error reloading contacts:', err);
        }
    }
    
    // Handle business form close
    function handleBusinessFormClose() {
        isBusinessFormOpen.set(false);
    }
    
    // Handle contact form close
    function handleContactFormClose() {
        isContactFormOpen.set(false);
    }
    
    // Close modal when Escape key is pressed
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && isOpen) {
            handleClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
            class="bg-white rounded-lg shadow-xl max-w-md w-full"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="dialog"
            tabindex="-1"
            aria-labelledby="donation-modal-title"
            aria-modal="true"
        >
            <div class="flex justify-between items-center p-4 border-b">
                <h2 id="donation-modal-title" class="text-xl font-semibold">Record Donation</h2>
                <button
                    type="button"
                    class="text-gray-400 hover:text-gray-500 focus:outline-none"
                    on:click={handleClose}
                    disabled={$isSubmitting}
                >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="p-6">
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="space-y-4">
                        <div>
                            <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
                                Amount ($) <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                bind:value={$formData.amount}
                                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                                disabled={$isSubmitting}
                                required
                            />
                        </div>
                        
                        <div>
                            <fieldset class="mt-4">
                                <legend class="block text-sm font-medium text-gray-700 mb-1">Donor Type</legend>
                                <div class="flex items-center space-x-4">
                                    <div class="flex items-center">
                                        <input
                                            id="person"
                                            type="radio"
                                            value="person"
                                            bind:group={$formData.donorType}
                                            class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            disabled={$isSubmitting}
                                        />
                                        <label for="person" class="ml-2 block text-sm text-gray-700">
                                            Person
                                        </label>
                                    </div>
                                    <div class="flex items-center">
                                        <input
                                            id="business"
                                            type="radio"
                                            value="business"
                                            bind:group={$formData.donorType}
                                            class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            disabled={$isSubmitting}
                                        />
                                        <label for="business" class="ml-2 block text-sm text-gray-700">
                                            Business
                                        </label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                        
                        {#if $formData.donorType === 'person'}
                            <div>
                                <label for="contact-select" class="block text-sm font-medium text-gray-700 mb-1">
                                    Select Contact <span class="text-red-500">*</span>
                                </label>
                                <div class="flex items-center space-x-2">
                                    <select
                                        id="contact-select"
                                        bind:value={$formData.contactId}
                                        class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        disabled={$isSubmitting || $isLoadingData}
                                    >
                                        <option value="">Select a contact</option>
                                        {#each $contacts as contact}
                                            <option value={contact.id}>{formatContactName(contact)}</option>
                                        {/each}
                                    </select>
                                    <button
                                        type="button"
                                        class="p-2 border rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        on:click={openContactForm}
                                        disabled={$isSubmitting}
                                    >
                                        +
                                    </button>
                                </div>
                                {#if $isLoadingData}
                                    <p class="text-sm text-gray-500 mt-1">Loading contacts...</p>
                                {/if}
                            </div>
                        {:else}
                            <div>
                                <label for="business-select" class="block text-sm font-medium text-gray-700 mb-1">
                                    Select Business <span class="text-red-500">*</span>
                                </label>
                                <div class="flex items-center space-x-2">
                                    <select
                                        id="business-select"
                                        bind:value={$formData.businessId}
                                        class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        disabled={$isSubmitting || $isLoadingData}
                                    >
                                        <option value="">Select a business</option>
                                        {#each $businesses as business}
                                            <option value={business.id}>{business.business_name}</option>
                                        {/each}
                                    </select>
                                    <button
                                        type="button"
                                        class="p-2 border rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                        on:click={openBusinessForm}
                                        disabled={$isSubmitting}
                                    >
                                        +
                                    </button>
                                </div>
                                {#if $isLoadingData}
                                    <p class="text-sm text-gray-500 mt-1">Loading businesses...</p>
                                {/if}
                            </div>
                        {/if}
                        
                        <div>
                            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                id="status"
                                bind:value={$formData.status}
                                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                disabled={$isSubmitting}
                            >
                                <option value="promise">Promise</option>
                                <option value="donated">Donated</option>
                                <option value="processing">Processing</option>
                                <option value="cleared">Cleared</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="date" class="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                id="date"
                                type="date"
                                bind:value={$formData.date}
                                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                disabled={$isSubmitting}
                            />
                        </div>
                        
                        <div>
                            <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                bind:value={$formData.notes}
                                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                                placeholder="Add any additional notes..."
                                disabled={$isSubmitting}
                            ></textarea>
                        </div>
                        
                        {#if $error}
                            <p class="text-sm text-red-600">{$error}</p>
                        {/if}
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                            on:click={handleClose}
                            disabled={$isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={$isSubmitting}
                        >
                            {#if $isSubmitting}
                                <div class="flex items-center">
                                    <LoadingSpinner size="sm" color="white" />
                                    <span class="ml-2">Saving...</span>
                                </div>
                            {:else}
                                Save Donation
                            {/if}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
{/if}

<!-- Business Form Modal -->
<BusinessFormModal 
    isOpen={$isBusinessFormOpen} 
    supabase={supabase} 
    on:close={handleBusinessFormClose}
    on:success={handleBusinessCreated}
/>

<!-- Contact Form Modal -->
<ContactFormModal 
    isOpen={$isContactFormOpen} 
    supabase={supabase} 
    on:close={handleContactFormClose}
    on:success={handleContactCreated}
/>
