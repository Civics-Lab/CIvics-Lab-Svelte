<!-- src/lib/components/contacts/ContactDetailsSheet.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import DetailsSheetOverlay from '$lib/components/DetailsSheetOverlay.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { fetchContact, updateContact, deleteContact } from '$lib/services/contactService';
  import { fetchFormOptions } from '$lib/services/optionsService';
  
  // Import subcomponents
  import ContactBasicInfo from './ContactDetailsSheet/ContactBasicInfo.svelte';
  import ContactEmails from './ContactDetailsSheet/ContactEmails.svelte';
  import ContactPhones from './ContactDetailsSheet/ContactPhones.svelte';
  import ContactAddresses from './ContactDetailsSheet/ContactAddresses.svelte';
  import ContactSocialMedia from './ContactDetailsSheet/ContactSocialMedia.svelte';
  import ContactTags from './ContactDetailsSheet/ContactTags.svelte';
  import ContactDonations from './ContactDetailsSheet/ContactDonations.svelte';
  
  // Props
  export let isOpen = false;
  export let contactId: string | null = null;
  
  const dispatch = createEventDispatcher();
  
  // State
  const isLoading = writable(true);
  const isSaving = writable(false);
  const hasChanges = writable(false);
  const error = writable<string | null>(null);
  
  // State for unsaved changes confirmation dialog
  const showUnsavedChangesDialog = writable(false);
  
  // Contact data
  const originalData = writable<any>(null);
  const formData = writable<any>({
    firstName: '',
    middleName: '',
    lastName: '',
    genderId: '',
    raceId: '',
    pronouns: '',
    vanid: '',
    status: 'active'
  });
  
  // Multi-item sections
  const emails = writable<any[]>([]);
  const phoneNumbers = writable<any[]>([]);
  const addresses = writable<any[]>([]);
  const socialMedia = writable<any[]>([]);
  const tags = writable<string[]>([]);
  
  // Options for dropdowns
  const genderOptions = writable<{id: string, gender: string}[]>([]);
  const raceOptions = writable<{id: string, race: string}[]>([]);
  const stateOptions = writable<{id: string, name: string, abbreviation: string}[]>([]);
  
  // Fetch options
  async function fetchOptions() {
    try {
      // Get the current workspace ID
      const workspaceId = $workspaceStore.currentWorkspace?.id;
      
      if (!workspaceId) {
        console.error('No workspace selected');
        return;
      }
      
      // Fetch options via API
      const options = await fetchFormOptions(workspaceId);
      
      // Set options in stores
      genderOptions.set(options.genders || []);
      raceOptions.set(options.races || []);
      stateOptions.set(options.states || []);
    } catch (err) {
      console.error('Error fetching options:', err);
      error.set('Failed to load form options: ' + (err.message || 'Unknown error'));
    }
  }
  
  async function fetchContactDetails() {
    if (!contactId) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      console.log('Fetching contact details for ID:', contactId);
      
      // Fetch contact details using the API service
      const contact = await fetchContact(contactId);
      
      if (contact) {
        console.log('Contact fetched successfully:', contact);
        
        // Dump full contact object for debugging
        console.log('Full contact object from API:', JSON.stringify(contact, null, 2));
        
        // Check for alternative property names
        const possiblePhoneNumbers = contact.phoneNumbers || contact.phone_numbers || [];
        const possibleEmails = contact.emails || contact.email_addresses || [];
        const possibleAddresses = contact.addresses || contact.contact_addresses || [];
        const possibleSocialMedia = contact.socialMediaAccounts || contact.social_media_accounts || [];
        
        console.log('Alternative property checks:', {
          phoneNumbersFound: !!contact.phoneNumbers,
          phone_numbersFound: !!contact.phone_numbers,
          emailsFound: !!contact.emails,
          email_addressesFound: !!contact.email_addresses,
          addressesFound: !!contact.addresses,
          contact_addressesFound: !!contact.contact_addresses,
          socialMediaAccountsFound: !!contact.socialMediaAccounts,
          social_media_accountsFound: !!contact.social_media_accounts
        });
        
        // Set basic info
        formData.set({
          // Map camelCase from API to snake_case for form
          first_name: contact.firstName || '',
          last_name: contact.lastName || '',
          middle_name: contact.middleName || '',
          gender_id: contact.genderId || '',
          race_id: contact.raceId || '',
          pronouns: contact.pronouns || '',
          vanid: contact.vanid || '',
          status: contact.status || 'active'
        });
        
        // Store original data for comparison
        originalData.set({
          ...JSON.parse(JSON.stringify($formData)),
          tags: contact.tags ? [...contact.tags.map(t => t.tag)] : []
        });
        
        // Set emails - try both property names
        if (possibleEmails.length > 0) {
          console.log('Email data found:', possibleEmails);
          emails.set(possibleEmails.map(email => ({
            id: email.id,
            email: email.email || '',
            status: email.status || 'active'
          })));
        } else {
          console.log('No email data found');
          emails.set([]);
        }
        
        // Set phone numbers - try both property names
        if (possiblePhoneNumbers.length > 0) {
          console.log('Phone data found:', possiblePhoneNumbers);
          phoneNumbers.set(possiblePhoneNumbers.map(phone => ({
            id: phone.id,
            phone_number: phone.phoneNumber || phone.phone_number || '',
            status: phone.status || 'active'
          })));
          
          // Debug the mapped phone numbers
          console.log('Mapped phone numbers for UI:', $phoneNumbers);
        } else {
          console.log('No phone data found');
          phoneNumbers.set([]);
        }
        
        // Set addresses - try both property names
        if (possibleAddresses.length > 0) {
          console.log('Address data found:', possibleAddresses);
          addresses.set(possibleAddresses.map(address => ({
            id: address.id,
            street_address: address.streetAddress || address.street_address || '',
            secondary_street_address: address.secondaryStreetAddress || address.secondary_street_address || '',
            city: address.city || '',
            state_id: address.stateId || address.state_id || '',
            zip_code: address.zipCode || address.zip_code || '',
            status: address.status || 'active'
          })));
        } else {
          console.log('No address data found');
          addresses.set([]);
        }
        
        // Set social media - try both property names
        if (possibleSocialMedia.length > 0) {
          console.log('Social media data found:', possibleSocialMedia);
          socialMedia.set(possibleSocialMedia.map(social => ({
            id: social.id,
            social_media_account: social.socialMediaAccount || social.social_media_account || '',
            service_type: social.serviceType || social.service_type || 'facebook',
            status: social.status || 'active'
          })));
        } else {
          console.log('No social media data found');
          socialMedia.set([]);
        }
        
        // Set tags
        if (contact.tags) {
          tags.set(Array.isArray(contact.tags) ? contact.tags.map(tag => tag.tag) : []);
        } else {
          tags.set([]);
        }
      } else {
        error.set('Contact not found');
      }
      
    } catch (err) {
      console.error('Error fetching contact details:', err);
      error.set('Failed to load contact details: ' + (err.message || 'Unknown error'));
    } finally {
      isLoading.set(false);
    }
  }
  
  // Save changes
  async function saveChanges() {
    if (!contactId) return;
    
    isSaving.set(true);
    error.set(null);
    
    try {
      console.log('Preparing to save contact changes');
      
      // Extracting only phone numbers that need to be sent to the API
      const phonesToSend = $phoneNumbers
        .filter(phone => phone.isNew || phone.isDeleted || phone.isModified);
      console.log('Phone numbers to be sent:', phonesToSend); 

      // Prepare the update data
      const updateData = {
        contactData: {
          // Map snake_case to camelCase for API
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
          .filter(email => email.isNew || email.isDeleted || email.isModified)
          .map(email => ({
            // Keep properties as-is since service will map them
            ...email
          })),
        phoneNumbers: phonesToSend.map(phone => ({
            // Explicitly map phone_number to phoneNumber for API
            id: phone.id,
            phoneNumber: phone.phone_number || '', // Ensure empty string instead of null
            status: phone.status,
            isNew: phone.isNew,
            isDeleted: phone.isDeleted,
            isModified: phone.isModified
          })),
        addresses: $addresses
          .filter(address => address.isNew || address.isDeleted || address.isModified)
          .map(address => ({
            // Properties will be mapped in service
            ...address
          })),
        socialMedia: $socialMedia
          .filter(social => social.isNew || social.isDeleted || social.isModified)
          .map(social => ({
            // Properties will be mapped in service
            ...social
          })),
        tags: $tags
      };
      
      // Debug the phone numbers data
      console.log('Phone numbers to be sent:', updateData.phoneNumbers);
      
      console.log('Sending update data:', updateData);
      
      // Call the API to update the contact
      await updateContact(contactId, updateData);
      
      // Success notification
      toastStore.success('Contact updated successfully');
      
      // Refresh contact data
      fetchContactDetails();
      
      // Reset has changes flag
      hasChanges.set(false);
      
      // Notify parent about changes
      dispatch('updated');
      
    } catch (err) {
      console.error('Error saving contact changes:', err);
      error.set('Failed to save changes: ' + (err.message || 'Unknown error'));
      toastStore.error('Failed to save changes: ' + (err.message || 'Unknown error'));
    } finally {
      isSaving.set(false);
    }
  }
  
  // Cancel changes
  function cancelChanges() {
    // Reset to original data
    if ($originalData) {
      formData.set(JSON.parse(JSON.stringify($originalData)));
    }
    
    // Refetch everything
    fetchContactDetails();
    
    // Reset has changes flag
    hasChanges.set(false);
  }
  
  // Close the sheet
  function handleClose() {
    if ($hasChanges) {
      // Show the custom dialog instead of using browser confirm
      showUnsavedChangesDialog.set(true);
    } else {
      dispatch('close');
    }
  }
  
  // Discard changes and close
  function discardChangesAndClose() {
    showUnsavedChangesDialog.set(false);
    dispatch('close');
  }
  
  // Save changes and close
  async function saveChangesAndClose() {
    showUnsavedChangesDialog.set(false);
    await saveChanges();
    dispatch('close');
  }
  
  // Event handlers for child components
  function handleFormDataChange() {
    // Check if form data has changed
    if ($originalData) {
      const changed = Object.keys($formData).some(key => {
        // Handle empty strings vs nulls
        const origValue = $originalData[key] === null ? '' : $originalData[key];
        const newValue = $formData[key] === null ? '' : $formData[key];
        return String(newValue) !== String(origValue);
      });
      
      hasChanges.set(changed);
    }
  }
  
  function handleMultiItemChange() {
    // Check if any multi-item sections have changes
    const hasEmailChanges = $emails.some(email => email.isNew || email.isDeleted || email.isModified);
    const hasPhoneChanges = $phoneNumbers.some(phone => phone.isNew || phone.isDeleted || phone.isModified);
    const hasAddressChanges = $addresses.some(address => address.isNew || address.isDeleted || address.isModified);
    const hasSocialChanges = $socialMedia.some(social => social.isNew || social.isDeleted || social.isModified);
    
    // Original tags is an array of strings, we need to compare differently
    let originalTags = [];
    try {
      if ($originalData && $originalData.tags) {
        originalTags = $originalData.tags;
      }
    } catch (err) {
      console.log('Error getting original tags:', err);
    }
    
    // Compare current tags with original ones
    let hasTagChanges = false;
    if ($tags.length !== originalTags.length) {
      hasTagChanges = true;
    } else {
      // Check if any tags were added or removed
      hasTagChanges = $tags.some(tag => !originalTags.includes(tag)) || 
                      originalTags.some(tag => !$tags.includes(tag));
    }
    
    const anyChanges = hasEmailChanges || hasPhoneChanges || hasAddressChanges || 
                       hasSocialChanges || hasTagChanges;
    
    hasChanges.set(anyChanges);
  }
  
  // Key event handler for escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      handleClose();
    }
  }
  
  // Add/remove event listeners
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
  
  // Watch for contact ID changes
  $: if (contactId && isOpen) {
    console.log('Contact ID or isOpen changed, fetching details and options');
    fetchContactDetails();
    fetchOptions();
  }
</script>

{#if isOpen}
  <DetailsSheetOverlay {isOpen} on:close={handleClose} zIndex={50}>
    <div class="fixed inset-0 z-50 overflow-hidden" on:click|stopPropagation={() => {}}>
      <!-- Sheet panel - prevent click events from reaching the backdrop -->
      <div 
        class="absolute inset-y-0 right-0 max-w-2xl w-full flex"
        transition:fly={{ duration: 300, x: '100%' }}
        on:click|stopPropagation={() => {}}
      >
        <div class="h-full w-full flex flex-col bg-white shadow-xl overflow-y-scroll">
          <!-- Header -->
          <div class="px-4 py-6 bg-gray-50 sm:px-6 sticky top-0 z-10 border-b">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-lg font-medium text-gray-900">
                  {#if $isLoading}
                    Loading...
                  {:else if $error}
                    Error Loading Contact
                  {:else}
                    {$formData.firstName} {$formData.lastName}
                  {/if}
                </h2>
                <p class="mt-1 text-sm {$hasChanges ? 'text-orange-500 font-medium' : 'text-gray-500'}">
                  {#if $hasChanges}
                    You have unsaved changes
                  {:else}
                    Contact details
                  {/if}
                </p>
              </div>
              <button
                type="button"
                class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                on:click|stopPropagation={handleClose}
              >
                <span class="sr-only">Close panel</span>
                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="relative flex-1 px-4 py-6 sm:px-6">
            {#if $isLoading}
              <div class="flex items-center justify-center h-40">
                <LoadingSpinner size="lg" />
              </div>
            {:else if $error}
              <div class="bg-red-50 p-4 rounded-md mb-6">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <div class="mt-2 text-sm text-red-700">
                      <p>{$error}</p>
                    </div>
                  </div>
                </div>
              </div>
            {:else}
              <form class="space-y-6" on:click|stopPropagation={() => {}}>
                <!-- Basic Information Section -->
                <ContactBasicInfo 
                  {formData}
                  {genderOptions}
                  {raceOptions}
                  isSaving={false}
                  on:change={handleFormDataChange}
                />
                
                <!-- Email Addresses Section -->
                <ContactEmails 
                  {emails}
                  isSaving={false}
                  on:change={handleMultiItemChange}
                />
                
                <!-- Phone Numbers Section -->
                <ContactPhones 
                  phoneNumbers={phoneNumbers}
                  isSaving={false}
                  on:change={handleMultiItemChange}
                />
                
                <!-- Addresses Section -->
                <ContactAddresses 
                  {addresses}
                  {stateOptions}
                  isSaving={false}
                  on:change={handleMultiItemChange}
                />
                
                <!-- Social Media Section -->
                <ContactSocialMedia 
                  socialMedia={socialMedia}
                  isSaving={false}
                  on:change={handleMultiItemChange}
                />
                
                <!-- Tags Section -->
                <ContactTags 
                  {tags}
                  isSaving={false}
                  on:change={handleMultiItemChange}
                />
                
                <!-- Donations Section -->
                {#if contactId}
                  <ContactDonations
                    {contactId}
                    isSaving={$isSaving}
                  />
                {/if}
              </form>
            {/if}
          </div>
          
          <!-- Footer with action buttons -->
          <div class="px-4 py-4 sm:px-6 bg-gray-50 border-t sticky bottom-0">
            <div class="flex justify-end space-x-3">
              {#if $hasChanges}
                <button
                  type="button"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  on:click|stopPropagation={cancelChanges}
                  disabled={$isSaving}
                >
                  Discard Changes
                </button>
                
                <button
                  type="button"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  on:click|stopPropagation={saveChanges}
                  disabled={$isSaving}
                >
                  {#if $isSaving}
                    <div class="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span class="ml-2">Saving...</span>
                    </div>
                  {:else}
                    Save Changes
                  {/if}
                </button>
              {:else}
                <button
                  type="button"
                  class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  on:click|stopPropagation={handleClose}
                >
                  Close
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Unsaved changes confirmation dialog -->
    {#if $showUnsavedChangesDialog}
      <div class="fixed inset-0 z-[60] overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div 
            class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            transition:fly={{ duration: 200, y: 10 }}
            on:click|stopPropagation={() => {}}
          >
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 class="text-base font-semibold leading-6 text-gray-900">Unsaved Changes</h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button 
                type="button" 
                class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                on:click|stopPropagation={saveChangesAndClose}
              >
                Save Changes
              </button>
              <button 
                type="button" 
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                on:click|stopPropagation={discardChangesAndClose}
              >
                Discard
              </button>
              <button 
                type="button" 
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto mr-auto"
                on:click|stopPropagation={() => showUnsavedChangesDialog.set(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </DetailsSheetOverlay>
{/if}
