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
  import { X, AlertTriangle } from '@lucide/svelte';
  
  // Import entity-specific subcomponents
  import ContactBasicInfo from './ContactDetailsSheet/ContactBasicInfo.svelte';
  import ContactEmails from './ContactDetailsSheet/ContactEmails.svelte';
  import ContactDonations from './ContactDetailsSheet/ContactDonations.svelte';
  
  // Import generic shared components
  import GenericPhones from '$lib/components/shared/GenericPhones.svelte';
  import GenericAddresses from '$lib/components/shared/GenericAddresses.svelte';
  import GenericSocialMedia from '$lib/components/shared/GenericSocialMedia.svelte';
  import GenericTags from '$lib/components/shared/GenericTags.svelte';
  import InteractionStream from '$lib/components/shared/InteractionStream.svelte';
  
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
      
      // Fetch all form options at once
      try {
        console.log('Fetching all form options...');
        const options = await fetchFormOptions(workspaceId);
        
        console.log('Form options fetched:', options);
        
        // Set options in stores
        genderOptions.set(options.genders || []);
        raceOptions.set(options.races || []);
        stateOptions.set(options.states || []);
      } catch (err) {
        console.error('Error fetching all form options:', err);
        error.set('Error loading form options. Some dropdowns may not be populated.');
      }
    } catch (err) {
      console.error('Error in fetchOptions:', err);
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
          
          // Map addresses and log zip code data specifically
          const mappedAddresses = possibleAddresses.map(address => {
            const zipCode = address.zipCodeName || address.zipCode || '';
            
            // Log specific zip code details for debugging
            console.log('Address zip code details:', {
              addressId: address.id,
              zipCodeId: address.zipCodeId,
              zipCodeName: address.zipCodeName,
              zipCode: address.zipCode,
              finalZipValue: zipCode
            });
            
            return {
              id: address.id,
              street_address: address.streetAddress || address.street_address || '',
              secondary_street_address: address.secondaryStreetAddress || address.secondary_street_address || '',
              city: address.city || '',
              state_id: address.stateId || address.state_id || '',
              zip_code: zipCode, // Use zipCodeName from API
              zipCodeId: address.zipCodeId || '',
              status: address.status || 'active',
              isNew: false,
              isModified: false,
              isDeleted: false
            };
          });
          
          // Set the addresses store
          addresses.set(mappedAddresses);
          console.log('Mapped addresses for UI:', mappedAddresses);
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
          .filter(email => {
            // Keep deleted items to ensure they're removed from DB
            if (email.isDeleted) return true;
            // Only include valid emails with content
            return (email.isNew || email.isModified) && email.email && email.email.trim() !== '';
          })
          .map(email => ({
            // Explicitly map all fields needed by the API
            id: email.id,
            email: email.email,
            status: email.status || 'active',
            isNew: !!email.isNew, // Ensure boolean type
            isModified: !!email.isModified, // Ensure boolean type
            isDeleted: !!email.isDeleted // Ensure boolean type
          })),
        phoneNumbers: phonesToSend
          .filter(phone => {
            // Keep deleted items to ensure they're removed from DB
            if (phone.isDeleted) return true;
            // Only include valid phone numbers with content
            const phoneValue = phone.phone_number || '';
            return phoneValue.trim() !== '';
          })
          .map(phone => ({
            // Explicitly map phone_number to phoneNumber for API
            id: phone.id,
            phoneNumber: phone.phone_number || '', // Ensure empty string instead of null
            status: phone.status || 'active',
            isNew: !!phone.isNew, // Ensure boolean type
            isDeleted: !!phone.isDeleted, // Ensure boolean type
            isModified: !!phone.isModified // Ensure boolean type
          })),
        addresses: $addresses
          .filter(address => {
            // Keep deleted items to ensure they're removed from DB
            if (address.isDeleted) return true;
            // Only include valid addresses with required fields
            return (address.isNew || address.isModified) && 
                   address.street_address && address.street_address.trim() !== '' &&
                   address.city && address.city.trim() !== '';
          })
          .map(address => ({
            // Explicitly map all fields needed by the API
            id: address.id,
            streetAddress: address.street_address || '',
            secondaryStreetAddress: address.secondary_street_address || '',
            city: address.city || '',
            stateId: address.state_id || '',
            zipCode: address.zip_code || '',
            status: address.status || 'active',
            isNew: !!address.isNew, // Ensure boolean type
            isModified: !!address.isModified, // Ensure boolean type
            isDeleted: !!address.isDeleted // Ensure boolean type
          })),
        socialMedia: $socialMedia
          .filter(social => {
            // Keep deleted items to ensure they're removed from DB
            if (social.isDeleted) return true;
            // Only include valid social media with required fields
            return (social.isNew || social.isModified) && 
                   social.social_media_account && social.social_media_account.trim() !== '' &&
                   social.service_type;
          })
          .map(social => ({
            // Explicitly map all fields needed by the API
            id: social.id,
            socialMediaAccount: social.social_media_account || '',
            serviceType: social.service_type || 'facebook',
            status: social.status || 'active',
            isNew: !!social.isNew, // Ensure boolean type
            isModified: !!social.isModified, // Ensure boolean type
            isDeleted: !!social.isDeleted // Ensure boolean type
          })),
        tags: $tags
      };
      
      // Debug the phone numbers data
      console.log('Phone numbers to be sent:', updateData.phoneNumbers);
      
      // Add detailed logging to debug the update process
      console.log('Sending update data:', updateData);
      
      // Log detailed info about the email objects
      console.log('Email data details:', updateData.emails.map(e => ({
        email: e.email,
        isNew: e.isNew,
        isModified: e.isModified,
        isDeleted: e.isDeleted
      })));
      
      // Log detailed info about the phone objects
      console.log('Phone data details:', updateData.phoneNumbers.map(p => ({
        phoneNumber: p.phoneNumber,
        isNew: p.isNew,
        isModified: p.isModified,
        isDeleted: p.isDeleted
      })));
      
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
        class="absolute inset-y-0 right-0 max-w-5xl w-full flex"
        transition:fly={{ duration: 300, x: '100%' }}
        on:click|stopPropagation={() => {}}
      >
        <div class="h-full w-full flex flex-col bg-white shadow-xl overflow-y-scroll">
          <!-- Header -->
          <div class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
            <div class="min-w-0 flex-1">
              <h2 class="text-lg font-semibold text-slate-900">
                {#if $isLoading}
                  Loading...
                {:else if $error}
                  Error Loading Contact
                {:else}
                  {$formData.firstName} {$formData.lastName}
                {/if}
              </h2>
              <p class="text-sm text-slate-500 mt-1">
                {#if $hasChanges}
                  <span class="text-amber-600 font-medium">You have unsaved changes</span>
                {:else}
                  Contact details
                {/if}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors"
              on:click|stopPropagation={handleClose}
            >
              <span class="sr-only">Close panel</span>
              <X size={20} />
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto">
            {#if $isLoading}
              <div class="flex h-32 items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            {:else if $error}
              <div class="rounded-md border border-red-200 bg-red-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <AlertTriangle class="h-5 w-5 text-red-400" />
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
              <!-- Two Column Layout: Stream on Left, Details on Right -->
              <div class="flex h-full" on:click|stopPropagation={() => {}}>
                <!-- Left Column: Interaction Stream -->
                <div class="w-96 border-r border-gray-200 flex-shrink-0 overflow-y-auto">
                  <div class="p-6">
                    {#if contactId}
                      <InteractionStream
                        entityType="contact"
                        entityId={contactId}
                        isSaving={$isSaving}
                        on:change={handleMultiItemChange}
                      />
                    {/if}
                  </div>
                </div>
                
                <!-- Right Column: Contact Details -->
                <div class="flex-1 overflow-y-auto">
                  <div class="p-6 space-y-8">
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
                    <GenericPhones 
                      {phoneNumbers}
                      isSaving={$isSaving}
                      entityType="contact"
                      on:change={handleMultiItemChange}
                    />
                    
                    <!-- Addresses Section -->
                    <GenericAddresses 
                      {addresses}
                      {stateOptions}
                      isSaving={$isSaving}
                      entityType="contact"
                      on:change={handleMultiItemChange}
                    />
                    
                    <!-- Social Media Section -->
                    <GenericSocialMedia 
                      {socialMedia}
                      isSaving={$isSaving}
                      entityType="contact"
                      on:change={handleMultiItemChange}
                    />
                    
                    <!-- Tags Section -->
                    <GenericTags 
                      {tags}
                      isSaving={$isSaving}
                      entityType="contact"
                      on:change={handleMultiItemChange}
                    />
                    
                    <!-- Donations Section -->
                    {#if contactId}
                      <ContactDonations
                        {contactId}
                        isSaving={$isSaving}
                      />
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Footer with action buttons -->
          <div class="flex shrink-0 justify-end gap-3 border-t border-slate-200 px-6 py-4">
            {#if $hasChanges}
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                on:click|stopPropagation={cancelChanges}
                disabled={$isSaving}
              >
                Discard Changes
              </button>
              
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50"
                on:click|stopPropagation={saveChanges}
                disabled={$isSaving}
              >
                {#if $isSaving}
                  <div class="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Saving...</span>
                  </div>
                {:else}
                  Save Changes
                {/if}
              </button>
            {:else}
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                on:click|stopPropagation={handleClose}
              >
                Close
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Unsaved changes confirmation dialog -->
    {#if $showUnsavedChangesDialog}
      <div class="fixed inset-0 z-[60] flex min-h-full items-center justify-center p-4">
        <div 
          class="relative w-full max-w-lg transform overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-lg transition-all"
          transition:fly={{ duration: 200, y: 10 }}
          on:click|stopPropagation={() => {}}
        >
          <div class="px-6 pb-4 pt-6">
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle class="h-5 w-5 text-amber-600" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-base font-semibold text-slate-900">Unsaved Changes</h3>
                <div class="mt-2">
                  <p class="text-sm text-slate-500">
                    You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button 
              type="button" 
              class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              on:click|stopPropagation={() => showUnsavedChangesDialog.set(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              on:click|stopPropagation={discardChangesAndClose}
            >
              Discard
            </button>
            <button 
              type="button" 
              class="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
              on:click|stopPropagation={saveChangesAndClose}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    {/if}
  </DetailsSheetOverlay>
{/if}