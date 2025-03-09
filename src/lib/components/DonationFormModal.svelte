<!-- src/lib/components/DonationFormModal.svelte -->
<script lang="ts">
    import { writable } from 'svelte/store';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    import LoadingSpinner from './LoadingSpinner.svelte';
    
    export let supabase: TypedSupabaseClient;
    export let isOpen = false;
    export let onClose = () => {};
    
    const formData = writable({
        amount: '',
        donorName: '',
        email: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    
    const isSubmitting = writable(false);
    const error = writable<string | null>(null);
    
    async function handleSubmit() {
        if (!$formData.amount || !$formData.donorName) {
            error.set('Amount and donor name are required');
            return;
        }
        
        isSubmitting.set(true);
        error.set(null);
        
        try {
            const { data: donation, error: donationError } = await supabase
                .from('donations')
                .insert({
                    workspace_id: $workspaceStore.currentWorkspace?.id,
                    amount: parseFloat($formData.amount),
                    donor_name: $formData.donorName,
                    email: $formData.email || null,
                    date: $formData.date,
                    notes: $formData.notes || null
                })
                .select()
                .single();
            
            if (donationError) throw donationError;
            
            // Reset form and close modal
            formData.set({
                amount: '',
                donorName: '',
                email: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            onClose();
            
        } catch (err) {
            console.error('Error creating donation:', err);
            error.set(err instanceof Error ? err.message : 'Failed to create donation');
        } finally {
            isSubmitting.set(false);
        }
    }
    
    function handleClose() {
        formData.set({
            amount: '',
            donorName: '',
            email: '',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        error.set(null);
        onClose();
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
            <div class="p-6">
                <h2 id="donation-modal-title" class="text-xl font-semibold mb-4">Record Donation</h2>
                
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
                            <label for="donor-name" class="block text-sm font-medium text-gray-700 mb-1">
                                Donor Name <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="donor-name"
                                type="text"
                                bind:value={$formData.donorName}
                                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter donor name"
                                disabled={$isSubmitting}
                                required
                            />
                        </div>
                        
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                bind:value={$formData.email}
                                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                placeholder="donor@example.com"
                                disabled={$isSubmitting}
                            />
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