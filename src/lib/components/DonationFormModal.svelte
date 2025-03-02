<!-- src/lib/components/DonationFormModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { writable } from 'svelte/store';
    import Modal from './Modal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    export let isOpen = false;
    export let supabase: TypedSupabaseClient;
    
    const dispatch = createEventDispatcher();
    
    // Form state
    const formData = writable({
      donor_type: 'contact',
      contact_id: '',
      business_id: '',
      amount: '',
      status: 'donated',
      notes: ''
    });
    
    // Loading and errors
    const isSubmitting = writable(false);
    const errors = writable<Record<string, string>>({});
    
    // Options for dropdowns
    const contactOptions = writable<{id: string, full_name: string}[]>([]);
    const businessOptions = writable<{id: string, business_name: string}[]>([]);
    
    $: donorType = $formData.donor_type;
    
    function validateForm() {
      let valid = true;
      let formErrors: Record<string, string> = {};
      
      // Check donor selection
      if (donorType === 'contact' && !$formData.contact_id) {
        formErrors.donor = 'Please select a contact';
        valid = false;
      } else if (donorType === 'business' && !$formData.business_id) {
        formErrors.donor = 'Please select a business';
        valid = false;
      }
      
      // Check amount
      if (!$formData.amount) {
        formErrors.amount = 'Amount is required';
        valid = false;
      } else if (isNaN(Number($formData.amount)) || Number($formData.amount) <= 0) {
        formErrors.amount = 'Please enter a valid amount greater than zero';
        valid = false;
      }
      
      errors.set(formErrors);
      return valid;
    }
    
    async function fetchOptions() {
      try {
        // Fetch contacts
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .order('last_name');
        
        if (contactError) throw contactError;
        
        if (contactData) {
          contactOptions.set(contactData.map(contact => ({
            id: contact.id,
            full_name: `${contact.first_name} ${contact.last_name}`
          })));
        }
        
        // Fetch businesses
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('id, business_name')
          .order('business_name');
        
        if (businessError) throw businessError;
        businessOptions.set(businessData || []);
        
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
        // Create donation record
        const donationData = {
          amount: Number($formData.amount),
          status: $formData.status,
          ...(donorType === 'contact' 
            ? { contact_id: $formData.contact_id, business_id: null } 
            : { business_id: $formData.business_id, contact_id: null })
        };
        
        const { data: donation, error: donationError } = await supabase
          .from('donations')
          .insert(donationData)
          .select()
          .single();
        
        if (donationError) throw donationError;
        
        // Success toast and reset form
        toastStore.success('Donation recorded successfully!');
        resetForm();
        
        // Emit success event
        dispatch('success', donation);
        
        // Close modal
        handleClose();
        
      } catch (error) {
        console.error('Error recording donation:', error);
        toastStore.error('Failed to record donation');
      } finally {
        isSubmitting.set(false);
      }
    }
    
    function handleClose() {
      dispatch('close');
    }
    
    function resetForm() {
      formData.set({
        donor_type: 'contact',
        contact_id: '',
        business_id: '',
        amount: '',
        status: 'donated',
        notes: ''
      });
      errors.set({});
    }
    
    // Fetch options when the component mounts and modal opens
    $: if (isOpen) {
      fetchOptions();
      resetForm();
    }
  </script>
  
  <Modal 
    isOpen={isOpen} 
    title="Record New Donation" 
    on:close={handleClose}
    maxWidth="max-w-2xl"
  >
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Donor Selection Section -->
      <div class="mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Donor Information</h2>
        
        <!-- Donor Type Toggle -->
        <div class="flex items-center space-x-4 mb-6">
          <span class="text-sm font-medium text-gray-700">Donor Type:</span>
          <div class="flex items-center space-x-2">
            <input 
              id="donor-type-contact" 
              name="donor_type" 
              type="radio" 
              value="contact" 
              bind:group={$formData.donor_type}
              class="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
              disabled={$isSubmitting}
            />
            <label for="donor-type-contact" class="text-sm text-gray-700">
              Individual
            </label>
          </div>
          <div class="flex items-center space-x-2">
            <input 
              id="donor-type-business" 
              name="donor_type" 
              type="radio" 
              value="business" 
              bind:group={$formData.donor_type}
              class="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
              disabled={$isSubmitting}
            />
            <label for="donor-type-business" class="text-sm text-gray-700">
              Business
            </label>
          </div>
        </div>
        
        <!-- Donor Selection -->
        <div>
          <label for="donor" class="block text-sm font-medium text-gray-700">
            {donorType === 'contact' ? 'Select Contact' : 'Select Business'}
          </label>
          <div class="mt-1">
            <select 
              id="donor" 
              bind:value={donorType === 'contact' ? $formData.contact_id : $formData.business_id}
              class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.donor ? 'border-red-300' : ''}"
              disabled={$isSubmitting}
            >
              <option value="">
                {donorType === 'contact' ? '-- Select a Contact --' : '-- Select a Business --'}
              </option>
              {#if donorType === 'contact'}
                {#each $contactOptions as option}
                  <option value={option.id}>{option.full_name}</option>
                {/each}
              {:else}
                {#each $businessOptions as option}
                  <option value={option.id}>{option.business_name}</option>
                {/each}
              {/if}
            </select>
          </div>
          {#if $errors.donor}
            <p class="mt-1 text-sm text-red-600">{$errors.donor}</p>
          {/if}
        </div>
      </div>
      
      <!-- Donation Details Section -->
      <div>
        <h2 class="text-lg font-medium text-gray-900 mb-4">Donation Details</h2>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-3">
            <label for="amount" class="block text-sm font-medium text-gray-700">Amount*</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">$</span>
              </div>
              <input 
                type="number" 
                name="amount" 
                id="amount" 
                bind:value={$formData.amount}
                step="0.01" 
                min="0" 
                class="focus:ring-purple-500 focus:border-purple-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md {$errors.amount ? 'border-red-300' : ''}"
                placeholder="0.00"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.amount}
              <p class="mt-1 text-sm text-red-600">{$errors.amount}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-3">
            <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
            <div class="mt-1">
              <select 
                id="status" 
                bind:value={$formData.status}
                class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              >
                <option value="promise">Promise</option>
                <option value="donated">Donated</option>
                <option value="processing">Processing</option>
                <option value="cleared">Cleared</option>
              </select>
            </div>
          </div>
          
          <div class="sm:col-span-6">
            <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
            <div class="mt-1">
              <textarea 
                id="notes" 
                bind:value={$formData.notes}
                rows={3}
                class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              ></textarea>
            </div>
            <p class="mt-2 text-sm text-gray-500">
              Any additional information about this donation.
            </p>
          </div>
        </div>
      </div>
    </form>
    
    <svelte:fragment slot="footer">
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        on:click={handleClose}
        disabled={$isSubmitting}
      >
        Cancel
      </button>
      <button
        type="button"
        class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        on:click={handleSubmit}
        disabled={$isSubmitting}
      >
        {#if $isSubmitting}
          <div class="flex items-center">
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">Saving...</span>
          </div>
        {:else}
          Record Donation
        {/if}
      </button>
    </svelte:fragment>
  </Modal>