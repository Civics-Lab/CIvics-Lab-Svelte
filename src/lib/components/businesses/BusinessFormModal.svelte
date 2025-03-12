<!-- src/lib/components/businesses/BusinessFormModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { writable } from 'svelte/store';
    import Modal from '$lib/components/Modal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    export let isOpen = false;
    export let supabase: TypedSupabaseClient;
    
    const dispatch = createEventDispatcher();
    
    // Form state
    const formData = writable({
      business_name: '',
      phone: '',
      street_address: '',
      secondary_street_address: '',
      city: '',
      state_id: '',
      zip_code: '',
      tags: ''
    });
    
    // Loading and errors
    const isSubmitting = writable(false);
    const errors = writable<Record<string, string>>({});
    
    // Options for dropdowns
    const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
    
    function validateForm() {
      let valid = true;
      let formErrors: Record<string, string> = {};
      
      // Required fields
      if (!$formData.business_name.trim()) {
        formErrors.business_name = 'Business name is required';
        valid = false;
      }
      
      // If address is partially filled, require all fields
      if ($formData.street_address || $formData.city || $formData.state_id || $formData.zip_code) {
        if (!$formData.street_address.trim()) {
          formErrors.street_address = 'Street address is required';
          valid = false;
        }
        
        if (!$formData.city.trim()) {
          formErrors.city = 'City is required';
          valid = false;
        }
        
        if (!$formData.state_id) {
          formErrors.state_id = 'State is required';
          valid = false;
        }
        
        if (!$formData.zip_code.trim()) {
          formErrors.zip_code = 'ZIP code is required';
          valid = false;
        }
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
        // Create business
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .insert({
            business_name: $formData.business_name,
            status: 'active'
          })
          .select()
          .single();
        
        if (businessError) throw businessError;
        
        // If phone is provided, add it to business_phone_numbers
        if ($formData.phone.trim()) {
          const { error: phoneError } = await supabase
            .from('business_phone_numbers')
            .insert({
              business_id: business.id,
              phone_number: $formData.phone,
              status: 'active'
            });
          
          if (phoneError) throw phoneError;
        }
        
        // If address is provided, add it to business_addresses
        if ($formData.street_address && $formData.city && $formData.state_id) {
          const { error: addressError } = await supabase
            .from('business_addresses')
            .insert({
              business_id: business.id,
              street_address: $formData.street_address,
              secondary_street_address: $formData.secondary_street_address || null,
              city: $formData.city,
              state_id: $formData.state_id,
              zip_code_id: $formData.zip_code,
              status: 'active'
            });
          
          if (addressError) throw addressError;
        }
        
        // If tags are provided, add them to business_tags
        if ($formData.tags.trim()) {
          const tags = $formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
          const tagPromises = tags.map(tag => {
            return supabase
              .from('business_tags')
              .insert({
                business_id: business.id,
                tag
              });
          });
          
          await Promise.all(tagPromises);
        }
        
        // Success toast and reset form
        toastStore.success('Business created successfully!');
        resetForm();
        
        // Emit success event
        dispatch('success', business);
        
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
        phone: '',
        street_address: '',
        secondary_street_address: '',
        city: '',
        state_id: '',
        zip_code: '',
        tags: ''
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
    title="Add New Business" 
    on:close={handleClose}
    maxWidth="max-w-3xl"
  >
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Business Information Section -->
      <div class="mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-6">
            <label for="business_name" class="block text-sm font-medium text-gray-700">Business Name*</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="business_name" 
                bind:value={$formData.business_name}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.business_name ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.business_name}
              <p class="mt-1 text-sm text-red-600">{$errors.business_name}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-3">
            <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
            <div class="mt-1">
              <input 
                type="tel" 
                id="phone" 
                bind:value={$formData.phone}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Address Section -->
      <div class="mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Business Address</h2>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-6">
            <label for="street_address" class="block text-sm font-medium text-gray-700">Street Address</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="street_address" 
                bind:value={$formData.street_address}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.street_address ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.street_address}
              <p class="mt-1 text-sm text-red-600">{$errors.street_address}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-6">
            <label for="secondary_street_address" class="block text-sm font-medium text-gray-700">
              Secondary Address Line (Optional)
            </label>
            <div class="mt-1">
              <input 
                type="text" 
                id="secondary_street_address" 
                bind:value={$formData.secondary_street_address}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              />
            </div>
          </div>
          
          <div class="sm:col-span-2">
            <label for="city" class="block text-sm font-medium text-gray-700">City</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="city" 
                bind:value={$formData.city}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.city ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.city}
              <p class="mt-1 text-sm text-red-600">{$errors.city}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-2">
            <label for="state" class="block text-sm font-medium text-gray-700">State</label>
            <div class="mt-1">
              <select 
                id="state" 
                bind:value={$formData.state_id}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.state_id ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              >
                <option value="">Select State</option>
                {#each $stateOptions as option}
                  <option value={option.id}>{option.name}</option>
                {/each}
              </select>
            </div>
            {#if $errors.state_id}
              <p class="mt-1 text-sm text-red-600">{$errors.state_id}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-2">
            <label for="zip_code" class="block text-sm font-medium text-gray-700">ZIP Code</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="zip_code" 
                bind:value={$formData.zip_code}
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.zip_code ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.zip_code}
              <p class="mt-1 text-sm text-red-600">{$errors.zip_code}</p>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Tags Section -->
      <div>
        <h2 class="text-lg font-medium text-gray-900 mb-4">Tags</h2>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-6">
            <label for="tags" class="block text-sm font-medium text-gray-700">
              Tags (comma separated)
            </label>
            <div class="mt-1">
              <input 
                type="text" 
                id="tags" 
                bind:value={$formData.tags}
                placeholder="restaurant, downtown, minority-owned"
                class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              />
            </div>
            <p class="mt-2 text-sm text-gray-500">
              Add tags to categorize this business. Separate tags with commas.
            </p>
          </div>
        </div>
      </div>
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