<!-- src/lib/components/ContactFormModal.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { writable } from 'svelte/store';
    import Modal from './Modal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    export let isOpen = false;
    export let supabase: TypedSupabaseClient;
    
    const dispatch = createEventDispatcher();
    
    // Form state
    const formData = writable({
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender_id: '',
      race_id: '',
      pronouns: ''
    });
    
    // Loading and errors
    const isSubmitting = writable(false);
    const errors = writable<Record<string, string>>({});
    
    // Options for dropdowns
    const genderOptions = writable<{id: string, gender: string}[]>([]);
    const raceOptions = writable<{id: string, race: string}[]>([]);
    
    function validateForm() {
      let valid = true;
      let formErrors: Record<string, string> = {};
      
      // Required fields
      if (!$formData.first_name.trim()) {
        formErrors.first_name = 'First name is required';
        valid = false;
      }
      
      if (!$formData.last_name.trim()) {
        formErrors.last_name = 'Last name is required';
        valid = false;
      }
      
      // Email validation (if provided)
      if ($formData.email.trim() && !isValidEmail($formData.email)) {
        formErrors.email = 'Please enter a valid email address';
        valid = false;
      }
      
      errors.set(formErrors);
      return valid;
    }
    
    function isValidEmail(email: string) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    async function fetchOptions() {
      try {
        // Fetch gender options
        const { data: genderData, error: genderError } = await supabase
          .from('genders')
          .select('id, gender');
        
        if (genderError) throw genderError;
        genderOptions.set(genderData || []);
        
        // Fetch race options
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id, race');
        
        if (raceError) throw raceError;
        raceOptions.set(raceData || []);
        
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
        // Create contact
        const contactData = {
          ...$formData,
          workspace_id: $workspaceStore.currentWorkspace?.id
        };
        
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select()
          .single();
        
        if (contactError) throw contactError;
        
        // If email is provided, add it to contact_emails
        if ($formData.email.trim()) {
          const { error: emailError } = await supabase
            .from('contact_emails')
            .insert({
              contact_id: contact.id,
              email: $formData.email,
              status: 'active'
            });
          
          if (emailError) throw emailError;
        }
        
        // If phone is provided, add it to contact_phone_numbers
        if ($formData.phone.trim()) {
          const { error: phoneError } = await supabase
            .from('contact_phone_numbers')
            .insert({
              contact_id: contact.id,
              phone_number: $formData.phone,
              status: 'active'
            });
          
          if (phoneError) throw phoneError;
        }
        
        // Success toast and reset form
        toastStore.success('Contact created successfully!');
        resetForm();
        
        // Emit success event
        dispatch('success', contact);
        
        // Close modal
        handleClose();
        
      } catch (error) {
        console.error('Error creating contact:', error);
        toastStore.error('Failed to create contact');
      } finally {
        isSubmitting.set(false);
      }
    }
    
    function handleClose() {
      dispatch('close');
    }
    
    function resetForm() {
      formData.set({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender_id: '',
        race_id: '',
        pronouns: ''
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
    title="Add New Contact" 
    on:close={handleClose}
    maxWidth="max-w-3xl"
  >
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Contact Information Section -->
      <div class="mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-2">
            <label for="first_name" class="block text-sm font-medium text-gray-700">First Name*</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="first_name" 
                bind:value={$formData.first_name}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.first_name ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.first_name}
              <p class="mt-1 text-sm text-red-600">{$errors.first_name}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-2">
            <label for="middle_name" class="block text-sm font-medium text-gray-700">Middle Name</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="middle_name" 
                bind:value={$formData.middle_name}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              />
            </div>
          </div>
          
          <div class="sm:col-span-2">
            <label for="last_name" class="block text-sm font-medium text-gray-700">Last Name*</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="last_name" 
                bind:value={$formData.last_name}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.last_name ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.last_name}
              <p class="mt-1 text-sm text-red-600">{$errors.last_name}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-3">
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <div class="mt-1">
              <input 
                type="email" 
                id="email" 
                bind:value={$formData.email}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.email ? 'border-red-300' : ''}"
                disabled={$isSubmitting}
              />
            </div>
            {#if $errors.email}
              <p class="mt-1 text-sm text-red-600">{$errors.email}</p>
            {/if}
          </div>
          
          <div class="sm:col-span-3">
            <label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
            <div class="mt-1">
              <input 
                type="tel" 
                id="phone" 
                bind:value={$formData.phone}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Additional Information Section -->
      <div>
        <h2 class="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div class="sm:col-span-2">
            <label for="gender" class="block text-sm font-medium text-gray-700">Gender</label>
            <div class="mt-1">
              <select 
                id="gender" 
                bind:value={$formData.gender_id}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              >
                <option value="">Select Gender</option>
                {#each $genderOptions as option}
                  <option value={option.id}>{option.gender}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="sm:col-span-2">
            <label for="race" class="block text-sm font-medium text-gray-700">Race</label>
            <div class="mt-1">
              <select 
                id="race" 
                bind:value={$formData.race_id}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              >
                <option value="">Select Race</option>
                {#each $raceOptions as option}
                  <option value={option.id}>{option.race}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="sm:col-span-2">
            <label for="pronouns" class="block text-sm font-medium text-gray-700">Pronouns</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="pronouns" 
                bind:value={$formData.pronouns}
                class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={$isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
    
    <svelte:fragment slot="footer">
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={handleClose}
        disabled={$isSubmitting}
      >
        Cancel
      </button>
      <button
        type="button"
        class="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        on:click={handleSubmit}
        disabled={$isSubmitting}
      >
        {#if $isSubmitting}
          <div class="flex items-center">
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">Saving...</span>
          </div>
        {:else}
          Save Contact
        {/if}
      </button>
    </svelte:fragment>
  </Modal>