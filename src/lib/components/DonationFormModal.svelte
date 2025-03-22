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
    
    // For tag input and suggestions
    let newTagInput = '';
    const suggestedTags = writable<string[]>([]);
    const isLoadingSuggestions = writable(false);
    const showSuggestions = writable(false);
    
    // Form data
    const formData = writable({
        amount: '',
        donorType: 'person', // 'person' or 'business'
        contactId: '',
        businessId: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'promise', // Default status
        tags: [] as string[] // Tag array
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
    
    // Load existing tags for suggestions
    async function loadTagSuggestions(query: string) {
        if (!query.trim() || query.length < 2) {
            suggestedTags.set([]);
            showSuggestions.set(false);
            return;
        }
        
        isLoadingSuggestions.set(true);
        showSuggestions.set(true);
        
        try {
            // Fetch tags from donation_tags table
            const { data: donationTags, error: donationTagsError } = await supabase
                .from('donation_tags')
                .select('tag')
                .ilike('tag', `%${query}%`)
                .order('tag')
                .limit(10);
            
            if (donationTagsError) throw donationTagsError;
            
            // Remove duplicates and filter out already selected tags
            const uniqueTags = [...new Set(donationTags.map(t => t.tag))];
            const filteredTags = uniqueTags.filter(tag => !$formData.tags.includes(tag));
            
            suggestedTags.set(filteredTags);
        } catch (error) {
            console.error('Error loading tag suggestions:', error);
            suggestedTags.set([]);
        } finally {
            isLoadingSuggestions.set(false);
        }
    }
    
    function selectTag(tag: string) {
        if (!$formData.tags.includes(tag)) {
            formData.update(fd => ({
                ...fd,
                tags: [...fd.tags, tag]
            }));
        }
        
        // Reset input and suggestions
        newTagInput = '';
        suggestedTags.set([]);
        showSuggestions.set(false);
    }
    
    function addTag(event?: Event) {
        if (event) event.preventDefault();
        
        if (newTagInput.trim()) {
            selectTag(newTagInput.trim());
        }
    }
    
    function handleTagKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addTag();
        } else if (event.key === 'Escape') {
            newTagInput = '';
            suggestedTags.set([]);
            showSuggestions.set(false);
        } else {
            // Delay to avoid excessive API calls while typing
            setTimeout(() => {
                loadTagSuggestions(newTagInput);
            }, 300);
        }
    }
    
    function handleInputFocus() {
        if (newTagInput.trim().length >= 2) {
            loadTagSuggestions(newTagInput);
        }
    }
    
    function handleClickOutside() {
        // Use setTimeout to avoid closing suggestions before a click on a suggestion can be processed
        setTimeout(() => {
            showSuggestions.set(false);
        }, 200);
    }
    
    // Load businesses and contacts on mount
    onMount(async () => {
        if (isOpen) {
            await loadData();
        }
        
        document.addEventListener('click', handleClickOutside);
        
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
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
            
            // Insert tags if any
            if ($formData.tags && $formData.tags.length > 0) {
                const tagObjects = $formData.tags.map(tag => ({
                    donation_id: donation.id,
                    tag: tag
                }));
                
                const { error: tagsError } = await supabase
                    .from('donation_tags')
                    .insert(tagObjects);
                
                if (tagsError) {
                    console.error('Error saving tags:', tagsError);
                    // Continue with the process even if tags fail
                }
            }
            
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
            status: 'promise',
            tags: []
        });
        newTagInput = '';
        suggestedTags.set([]);
        showSuggestions.set(false);
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
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                                class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
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
                                            class="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
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
                                            class="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
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
                                        class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
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
                                        class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
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
                                class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
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
                                class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
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
                                class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
                                rows="3"
                                placeholder="Add any additional notes..."
                                disabled={$isSubmitting}
                            ></textarea>
                        </div>
                        
                        <!-- Tags Section -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <div class="relative mb-4">
                                <div class="flex items-center">
                                    <div class="flex-grow mr-2 relative">
                                        <input
                                            type="text"
                                            placeholder="Add a tag..."
                                            bind:value={newTagInput}
                                            class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            disabled={$isSubmitting}
                                            on:keydown={handleTagKeydown}
                                            on:focus={handleInputFocus}
                                            on:click|stopPropagation={() => {}}
                                        />
                                        
                                        {#if $isLoadingSuggestions}
                                            <div class="absolute right-2 top-2">
                                                <svg class="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        {/if}
                                        
                                        {#if $showSuggestions && $suggestedTags.length > 0}
                                            <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm">
                                                {#each $suggestedTags as tag}
                                                    <button
                                                        type="button"
                                                        class="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-purple-100"
                                                        on:click|stopPropagation={() => selectTag(tag)}
                                                    >
                                                        {tag}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                    
                                    <button
                                        type="button"
                                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                        on:click={addTag}
                                        disabled={$isSubmitting || !newTagInput.trim()}
                                    >
                                        Add
                                    </button>
                                </div>
                                
                                <p class="mt-2 text-sm text-gray-500">
                                    Add tags to categorize this donation. Type to see suggestions or create a new tag.
                                </p>
                            </div>
                            
                            <div class="flex flex-wrap gap-2 mt-2">
                                {#if $formData.tags && $formData.tags.length > 0}
                                    {#each $formData.tags as tag}
                                        <div class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            {tag}
                                            <button
                                                type="button"
                                                class="ml-1 rounded-full text-purple-600 hover:text-purple-800 focus:outline-none"
                                                on:click={() => {
                                                    formData.update(fd => ({
                                                        ...fd,
                                                        tags: fd.tags.filter(t => t !== tag)
                                                    }));
                                                }}
                                                disabled={$isSubmitting}
                                            >
                                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    {/each}
                                {:else}
                                    <div class="border border-dashed rounded-md p-3 text-center text-gray-500 w-full">
                                        <p>No tags added yet.</p>
                                    </div>
                                {/if}
                            </div>
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
                            class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
