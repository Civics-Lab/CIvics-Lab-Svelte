<!-- src/lib/components/contacts/ContactDetailsSheet.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import DetailsSheetOverlay from '$lib/components/DetailsSheetOverlay.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { fetchContact, updateContact, deleteContact } from '$lib/services/contactService';
  
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
      // These would ideally come from API endpoints too
      // For now, we'll use placeholder data
      genderOptions.set([
        { id: '1', gender: 'Male' },
        { id: '2', gender: 'Female' },
        { id: '3', gender: 'Non-binary' },
        { id: '4', gender: 'Other' }
      ]);
      
      raceOptions.set([
        { id: '1', race: 'Asian' },
        { id: '2', race: 'Black or African American' },
        { id: '3', race: 'Hispanic or Latino' },
        { id: '4', race: 'Native American' },
        { id: '5', race: 'Pacific Islander' },
        { id: '6', race: 'White' },
        { id: '7', race: 'Other' },
        { id: '8', race: 'Multiracial' }
      ]);
      
      stateOptions.set([
        { id: '1', name: 'Alabama', abbreviation: 'AL' },
        { id: '2', name: 'Alaska', abbreviation: 'AK' },
        { id: '3', name: 'Arizona', abbreviation: 'AZ' },
        // Add more states here
      ]);
      
    } catch (err) {
      console.error('Error fetching options:', err);
      error.set('Failed to load form options');
    }
  }
  
  async function fetchContactDetails() {
    if (!contactId) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      // Fetch contact details using the API service
      const contact = await fetchContact(contactId);
      
      if (contact) {
        // Set basic info
        formData.set({
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          middleName: contact.middleName || '',
          genderId: contact.genderId || '',
          raceId: contact.raceId || '',
          pronouns: contact.pronouns || '',
          vanid: contact.vanid || '',
          status: contact.status || 'active'
        });
        
        // Store original data for comparison
        originalData.set({
          ...JSON.parse(JSON.stringify($formData)),
          tags: contact.tags ? [...contact.tags.map(t => t.tag)] : []
        });
        
        // Set emails
        if (contact.emails) {
          emails.set(Array.isArray(contact.emails) ? contact.emails : []);
        } else {
          emails.set([]);
        }
        
        // Set phone numbers
        if (contact.phone_numbers) {
          phoneNumbers.set(Array.isArray(contact.phone_numbers) ? contact.phone_numbers : []);
        } else {
          phoneNumbers.set([]);
        }
        
        // Set addresses
        if (contact.addresses) {
          addresses.set(Array.isArray(contact.addresses) ? contact.addresses.map(address => ({
            id: address.id,
            streetAddress: address.streetAddress || '',
            secondaryStreetAddress: address.secondaryStreetAddress || '',
            city: address.city || '',
            stateId: address.stateId || '',
            zipCode: address.zipCodeId || '',
            status: address.status || 'active'
          })) : []);
        } else {
          addresses.set([]);
        }
        
        // Set social media
        if (contact.social_media_accounts) {
          socialMedia.set(Array.isArray(contact.social_media_accounts) ? contact.social_media_accounts : []);
        } else {
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
      // Prepare the update data
      const updateData = {
        contactData: { ...$formData },
        emails: $emails.filter(email => email.isNew || email.isDeleted || email.isModified),
        phoneNumbers: $phoneNumbers.filter(phone => phone.isNew || phone.isDeleted || phone.isModified),
        addresses: $addresses.filter(address => address.isNew || address.isDeleted || address.isModified),
        socialMedia: $socialMedia.filter(social => social.isNew || social.isDeleted || social.isModified),
        tags: $tags
      };
      
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
      error.set('Failed to save changes');
      toastStore.error('Failed to save changes');
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
