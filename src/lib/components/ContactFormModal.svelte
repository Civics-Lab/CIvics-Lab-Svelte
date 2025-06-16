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
  
  // Import the same components used in ContactDetailsSheet
  import ContactBasicInfo from './contacts/ContactDetailsSheet/ContactBasicInfo.svelte';
  import ContactEmails from './contacts/ContactDetailsSheet/ContactEmails.svelte';
  import ContactPhones from './contacts/ContactDetailsSheet/ContactPhones.svelte';
  import ContactAddresses from './contacts/ContactDetailsSheet/ContactAddresses.svelte';
  import ContactSocialMedia from './contacts/ContactDetailsSheet/ContactSocialMedia.svelte';
  import AutocompleteTags from './shared/AutocompleteTags.svelte';
  
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
  
  // Multi-item sections - using same structure as detail sheet
  const emails = writable([{ email: '', status: 'active', isNew: true, isModified: false, isDeleted: false }]);
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
  
  // Loading and errors
  const isSubmitting = writable(false);
  const errors = writable<Record<string, string>>({});
  
  // Options for dropdowns
  const genderOptions = writable<{id: string, gender: string}[]>([]);
  const raceOptions = writable<{id: string, race: string}[]>([]);
  const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
  
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
    const validEmails = $emails.filter(item => !item.isDeleted && item.email && item.email.trim());
    validEmails.forEach((item, index) => {
      if (!isValidEmail(item.email)) {
        formErrors[`email_${index}`] = 'Please enter a valid email address';
        valid = false;
      }
    });
    
    errors.set(formErrors);
    return valid;
  }
  
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      genderOptions.set(options.genders || []);
      raceOptions.set(options.races || []);
      stateOptions.set(options.states || []);
    } catch (error) {
      console.error('Error in fetchOptions:', error);
      toastStore.error('Failed to load form options. Some dropdowns may not be populated.');
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
          .filter(item => !item.isDeleted && item.email && item.email.trim())
          .map(item => ({
            email: item.email.trim(),
            status: item.status
          })),
        phoneNumbers: $phoneNumbers
          .filter(item => !item.isDeleted && item.phone_number && item.phone_number.trim())
          .map(item => ({
            phoneNumber: item.phone_number.trim(),
            phone_number: item.phone_number.trim(),
            status: item.status
          })),
        addresses: $addresses
          .filter(addr => !addr.isDeleted && addr.street_address && addr.street_address.trim() && addr.city && addr.city.trim())
          .map(addr => ({
            streetAddress: addr.street_address.trim(),
            street_address: addr.street_address.trim(),
            secondaryStreetAddress: addr.secondary_street_address?.trim() || null,
            secondary_street_address: addr.secondary_street_address?.trim() || null,
            city: addr.city.trim(),
            stateId: addr.state_id || null,
            state_id: addr.state_id || null,
            zipCode: addr.zip_code?.trim() || null,
            zip_code: addr.zip_code?.trim() || null,
            status: addr.status
          })),
        socialMedia: $socialMedia
          .filter(item => !item.isDeleted && item.social_media_account && item.social_media_account.trim())
          .map(item => ({
            socialMediaAccount: item.social_media_account.trim(),
            social_media_account: item.social_media_account.trim(),
            serviceType: item.service_type,
            service_type: item.service_type,
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
    
    emails.set([{ email: '', status: 'active', isNew: true, isModified: false, isDeleted: false }]);
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
</script>

<Modal 
  isOpen={isOpen} 
  title="Add New Contact" 
  on:close={handleClose}
  maxWidth="max-w-4xl"
>
  <form on:submit|preventDefault={handleSubmit} class="space-y-8">
    <!-- Basic Information Section -->
    <ContactBasicInfo 
      {formData}
      {genderOptions}
      {raceOptions}
      isSaving={$isSubmitting}
      on:change={handleFormDataChange}
    />
    
    <!-- Email Addresses Section -->
    <ContactEmails 
      {emails}
      isSaving={$isSubmitting}
      on:change={handleMultiItemChange}
    />
    
    <!-- Phone Numbers Section -->
    <ContactPhones 
      phoneNumbers={phoneNumbers}
      isSaving={$isSubmitting}
      on:change={handleMultiItemChange}
    />
    
    <!-- Addresses Section -->
    <ContactAddresses 
      {addresses}
      {stateOptions}
      isSaving={$isSubmitting}
      on:change={handleMultiItemChange}
    />
    
    <!-- Social Media Section -->
    <ContactSocialMedia 
      socialMedia={socialMedia}
      isSaving={$isSubmitting}
      on:change={handleMultiItemChange}
    />
    
    <!-- Tags Section -->
    <AutocompleteTags 
      {tags}
      isSaving={$isSubmitting}
      entityType="contact"
      on:change={handleMultiItemChange}
    />
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
