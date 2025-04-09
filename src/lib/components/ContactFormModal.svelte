<!-- src/lib/components/ContactFormModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import Modal from './Modal.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { createContact } from '$lib/services/contactService';
  import { fetchFormOptions } from '$lib/services/optionsService';
  
  export let isOpen = false;
  
  const dispatch = createEventDispatcher();
  
  // Form state for basic info
  const formData = writable({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender_id: '',
    race_id: '',
    pronouns: '',
    vanid: '',
    status: 'active' // Default to active
  });
  
  // Multi-item sections
  const emails = writable([{ email: '', status: 'active' }]);
  const phoneNumbers = writable([{ phone_number: '', status: 'active' }]);
  const addresses = writable([{ 
    street_address: '', 
    secondary_street_address: '', 
    city: '', 
    state_id: '', 
    zip_code: '', 
    status: 'active' 
  }]);
  const socialMedia = writable([{ 
    social_media_account: '', 
    service_type: 'facebook', 
    status: 'active' 
  }]);
  const tags = writable([]);
  const tagInput = writable('');
  
  // Loading and errors
  const isSubmitting = writable(false);
  const errors = writable<Record<string, string>>({});
  
  // Options for dropdowns
  const genderOptions = writable<{id: string, gender: string}[]>([]);
  const raceOptions = writable<{id: string, race: string}[]>([]);
  const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
  const existingTags = writable<string[]>([]);
  const filteredTags = writable<string[]>([]);
  
  // Social media service options
  const socialMediaServices = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'threads', label: 'Threads' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'bluesky', label: 'Bluesky' },
    { value: 'youtube', label: 'YouTube' }
  ];
  
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
    
    // Validate emails
    if ($emails.length > 0) {
      $emails.forEach((item, index) => {
        if (item.email && !isValidEmail(item.email)) {
          formErrors[`email_${index}`] = 'Please enter a valid email address';
          valid = false;
        }
      });
    }
    
    errors.set(formErrors);
    return valid;
  }
  
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  // Add field to multi-item sections
  function addEmail() {
    emails.update(items => [...items, { email: '', status: 'active' }]);
  }
  
  function addPhoneNumber() {
    phoneNumbers.update(items => [...items, { phone_number: '', status: 'active' }]);
  }
  
  function addAddress() {
    addresses.update(items => [...items, { 
      street_address: '', 
      secondary_street_address: '', 
      city: '', 
      state_id: '', 
      zip_code: '', 
      status: 'active' 
    }]);
  }
  
  function addSocialMedia() {
    socialMedia.update(items => [...items, { 
      social_media_account: '', 
      service_type: 'facebook', 
      status: 'active' 
    }]);
  }
  
  // Remove field from multi-item sections
  function removeEmail(index: number) {
    emails.update(items => items.filter((_, i) => i !== index));
  }
  
  function removePhoneNumber(index: number) {
    phoneNumbers.update(items => items.filter((_, i) => i !== index));
  }
  
  function removeAddress(index: number) {
    addresses.update(items => items.filter((_, i) => i !== index));
  }
  
  function removeSocialMedia(index: number) {
    socialMedia.update(items => items.filter((_, i) => i !== index));
  }
  
  // Tag management
  function addTag() {
    if ($tagInput.trim()) {
      if (!$tags.includes($tagInput.trim())) {
        tags.update(items => [...items, $tagInput.trim()]);
      }
      tagInput.set('');
      filteredTags.set([]);
    }
  }
  
  function removeTag(tag: string) {
    tags.update(items => items.filter(item => item !== tag));
  }
  
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
  
  function selectTag(tag: string) {
    if (!$tags.includes(tag)) {
      tags.update(items => [...items, tag]);
    }
    tagInput.set('');
    filteredTags.set([]);
  }
  
  async function fetchOptions() {
    try {
      if (!$workspaceStore.currentWorkspace) {
        throw new Error('No workspace selected');
      }
      
      // Fetch all options via API
      const options = await fetchFormOptions($workspaceStore.currentWorkspace.id);
      
      // Set options in stores
      genderOptions.set(options.genders || []);
      raceOptions.set(options.races || []);
      stateOptions.set(options.states || []);
      existingTags.set(options.tags || []);
    } catch (error) {
      console.error('Error fetching options:', error);
      toastStore.error('Failed to load form options');
    }
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    isSubmitting.set(true);
    errors.set({});
    
    console.log('Form data being submitted:', {
      formData: $formData,
      emails: $emails,
      phoneNumbers: $phoneNumbers,
      addresses: $addresses,
      socialMedia: $socialMedia,
      tags: $tags
    });
    
    try {
      if (!$workspaceStore.currentWorkspace?.id) {
        throw new Error('No workspace selected');
      }
      
      // Prepare contact data for the API
      const contactData = {
        workspaceId: $workspaceStore.currentWorkspace.id,
        contact: {
          firstName: $formData.first_name,
          lastName: $formData.last_name,
          middleName: $formData.middle_name,
          genderId: $formData.gender_id,
          raceId: $formData.race_id,
          pronouns: $formData.pronouns,
          vanid: $formData.vanid,
          status: $formData.status
        },
        emails: $emails
          .filter(item => item.email.trim())
          .map(item => ({
            email: item.email.trim(),
            status: item.status
          })),
        phoneNumbers: $phoneNumbers
          .filter(item => item.phone_number.trim())
          .map(item => ({
            phoneNumber: item.phone_number.trim(),
            status: item.status
          })),
        addresses: $addresses
          .filter(addr => addr.street_address.trim() && addr.city.trim())
          .map(addr => ({
            streetAddress: addr.street_address.trim(),
            secondaryStreetAddress: addr.secondary_street_address?.trim() || null,
            city: addr.city.trim(),
            stateId: addr.state_id || null,
            zipCode: addr.zip_code?.trim() || null,
            status: addr.status
          })),
        socialMedia: $socialMedia
          .filter(item => item.social_media_account.trim())
          .map(item => ({
            socialMediaAccount: item.social_media_account.trim(),
            serviceType: item.service_type,
            status: item.status
          })),
        tags: $tags
      };
      
      // Create contact using the API service
      const contact = await createContact(contactData);
      
      // Success toast
      toastStore.success(`Contact ${$formData.first_name} ${$formData.last_name} created successfully!`, 5000);
      
      resetForm();
      
      // Emit success event with the new contact
      dispatch('success', contact);
      
      // Close modal
      handleClose();
      
    } catch (error) {
      console.error('Error creating contact:', error);
      // Show a more specific error message if available
      if (error instanceof Error) {
        toastStore.error(`Failed to create contact: ${error.message}`);
      } else {
        toastStore.error('Failed to create contact');
      }
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
      gender_id: '',
      race_id: '',
      pronouns: '',
      vanid: '',
      status: 'active'
    });
    
    emails.set([{ email: '', status: 'active' }]);
    phoneNumbers.set([{ phone_number: '', status: 'active' }]);
    addresses.set([{ 
      street_address: '', 
      secondary_street_address: '', 
      city: '', 
      state_id: '', 
      zip_code: '', 
      status: 'active' 
    }]);
    socialMedia.set([{ 
      social_media_account: '', 
      service_type: 'facebook', 
      status: 'active' 
    }]);
    tags.set([]);
    tagInput.set('');
    filteredTags.set([]);
    errors.set({});
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

<Modal 
  isOpen={isOpen} 
  title="Add New Contact" 
  on:close={handleClose}
  maxWidth="max-w-4xl"
>
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Basic Information Section -->
    <div>
      <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
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
              placeholder="e.g., she/her, they/them"
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="vanid" class="block text-sm font-medium text-gray-700">VAN ID</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="vanid" 
              bind:value={$formData.vanid}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select 
              id="status" 
              bind:value={$formData.status}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deceased">Deceased</option>
              <option value="moved">Moved</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Email Addresses Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-gray-900">Email Addresses</h2>
        <button
          type="button"
          class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          on:click={addEmail}
          disabled={$isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Email
        </button>
      </div>
      
      {#each $emails as email, i}
        <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
          {#if i > 0}
            <button 
              type="button" 
              class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
              on:click={() => removeEmail(i)}
              disabled={$isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
          
          <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-4">
              <label for="email_{i}" class="block text-sm font-medium text-gray-700">Email Address</label>
              <div class="mt-1">
                <input 
                  type="email" 
                  id="email_{i}" 
                  bind:value={email.email}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors[`email_${i}`] ? 'border-red-300' : ''}"
                  disabled={$isSubmitting}
                />
              </div>
              {#if $errors[`email_${i}`]}
                <p class="mt-1 text-sm text-red-600">{$errors[`email_${i}`]}</p>
              {/if}
            </div>
            
            <div class="sm:col-span-2">
              <label for="email_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
              <div class="mt-1">
                <select 
                  id="email_status_{i}" 
                  bind:value={email.status}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="bounced">Bounced</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Phone Numbers Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-gray-900">Phone Numbers</h2>
        <button
          type="button"
          class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          on:click={addPhoneNumber}
          disabled={$isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Phone
        </button>
      </div>
      
      {#each $phoneNumbers as phone, i}
        <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
          {#if i > 0}
            <button 
              type="button" 
              class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
              on:click={() => removePhoneNumber(i)}
              disabled={$isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
          
          <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-4">
              <label for="phone_{i}" class="block text-sm font-medium text-gray-700">Phone Number</label>
              <div class="mt-1">
                <input 
                  type="tel" 
                  id="phone_{i}" 
                  bind:value={phone.phone_number}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                />
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="phone_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
              <div class="mt-1">
                <select 
                  id="phone_status_{i}" 
                  bind:value={phone.status}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="wrong number">Wrong Number</option>
                  <option value="disconnected">Disconnected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Addresses Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-gray-900">Addresses</h2>
        <button
          type="button"
          class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          on:click={addAddress}
          disabled={$isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Address
        </button>
      </div>
      
      {#each $addresses as address, i}
        <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
          {#if i > 0}
            <button 
              type="button" 
              class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
              on:click={() => removeAddress(i)}
              disabled={$isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
          
          <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-6">
              <label for="street_{i}" class="block text-sm font-medium text-gray-700">Street Address</label>
              <div class="mt-1">
                <input 
                  type="text" 
                  id="street_{i}" 
                  bind:value={address.street_address}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                />
              </div>
            </div>
            
            <div class="sm:col-span-6">
              <label for="street2_{i}" class="block text-sm font-medium text-gray-700">Secondary Address</label>
              <div class="mt-1">
                <input 
                  type="text" 
                  id="street2_{i}" 
                  bind:value={address.secondary_street_address}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                  placeholder="Apt, Suite, Unit, etc."
                />
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="city_{i}" class="block text-sm font-medium text-gray-700">City</label>
              <div class="mt-1">
                <input 
                  type="text" 
                  id="city_{i}" 
                  bind:value={address.city}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                />
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="state_{i}" class="block text-sm font-medium text-gray-700">State</label>
              <div class="mt-1">
                <select 
                  id="state_{i}" 
                  bind:value={address.state_id}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                >
                  <option value="">Select State</option>
                  {#each $stateOptions as option}
                    <option value={option.id}>{option.name}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="zip_{i}" class="block text-sm font-medium text-gray-700">ZIP Code</label>
              <div class="mt-1">
                <input 
                  type="text" 
                  id="zip_{i}" 
                  bind:value={address.zip_code}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                />
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="address_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
              <div class="mt-1">
                <select 
                  id="address_status_{i}" 
                  bind:value={address.status}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="moved">Moved</option>
                  <option value="wrong address">Wrong Address</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Social Media Section -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-medium text-gray-900">Social Media Accounts</h2>
        <button
          type="button"
          class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
          on:click={addSocialMedia}
          disabled={$isSubmitting}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>
      
      {#each $socialMedia as social, i}
        <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
          {#if i > 0}
            <button 
              type="button" 
              class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
              on:click={() => removeSocialMedia(i)}
              disabled={$isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
          
          <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-2">
              <label for="social_service_{i}" class="block text-sm font-medium text-gray-700">Platform</label>
              <div class="mt-1">
                <select
                  id="social_service_{i}"
                  bind:value={social.service_type}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                >
                  {#each socialMediaServices as service}
                    <option value={service.value}>{service.label}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="social_account_{i}" class="block text-sm font-medium text-gray-700">Username/Handle</label>
              <div class="mt-1">
                <input 
                  type="text" 
                  id="social_account_{i}" 
                  bind:value={social.social_media_account}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                />
              </div>
            </div>
            
            <div class="sm:col-span-2">
              <label for="social_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
              <div class="mt-1">
                <select
                  id="social_status_{i}"
                  bind:value={social.status}
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Tags Section -->
    <div>
      <h2 class="text-lg font-medium text-gray-900 mb-4">Tags</h2>
      <div class="mb-4">
        <div class="flex items-center">
          <div class="flex-grow mr-2 relative">
            <input
              type="text"
              placeholder="Add a tag..."
              bind:value={$tagInput}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
              on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            
            <!-- Tag suggestions dropdown -->
            {#if $filteredTags.length > 0}
              <div class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {#each $filteredTags as tag}
                  <button
                    type="button"
                    class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    on:click={() => selectTag(tag)}
                  >
                    {tag}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            on:click={addTag}
            disabled={$isSubmitting || !$tagInput.trim()}
          >
            Add
          </button>
        </div>
        
        <p class="mt-2 text-sm text-gray-500">
          Add tags to categorize this contact. Press Enter or click Add to create a tag.
        </p>
      </div>
      
      {#if $tags.length > 0}
        <div class="flex flex-wrap gap-2 mt-2">
          {#each $tags as tag}
            <div class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {tag}
              <button
                type="button"
                class="ml-1 rounded-full text-blue-600 hover:text-blue-800 focus:outline-none"
                on:click={() => removeTag(tag)}
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          {/each}
        </div>
      {/if}
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
      class="ml-3 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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