<!-- src/lib/components/contacts/ContactDetailsSheet.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { fly } from 'svelte/transition';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { TypedSupabaseClient } from '$lib/types/supabase';
  
  // Import subcomponents
  import ContactBasicInfo from './ContactDetailsSheet/ContactBasicInfo.svelte';
  import ContactEmails from './ContactDetailsSheet/ContactEmails.svelte';
  import ContactPhones from './ContactDetailsSheet/ContactPhones.svelte';
  import ContactAddresses from './ContactDetailsSheet/ContactAddresses.svelte';
  import ContactSocialMedia from './ContactDetailsSheet/ContactSocialMedia.svelte';
  import ContactTags from './ContactDetailsSheet/ContactTags.svelte';
  
  // Props
  export let isOpen = false;
  export let contactId: string | null = null;
  export let supabase: TypedSupabaseClient;
  
  const dispatch = createEventDispatcher();
  
  // State
  const isLoading = writable(true);
  const isSaving = writable(false);
  const hasChanges = writable(false);
  const error = writable<string | null>(null);
  
  // Contact data
  const originalData = writable<any>(null);
  const formData = writable<any>({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender_id: '',
    race_id: '',
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
      console.log('Fetching form options...');
      
      // Fetch gender options
      const { data: genderData, error: genderError } = await supabase
        .from('genders')
        .select('id, gender')
        .order('gender');
      
      if (genderError) {
        console.error('Error fetching genders:', genderError);
        throw genderError;
      }
      console.log('Fetched genders:', genderData);
      genderOptions.set(genderData || []);
      
      // Fetch race options
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('id, race')
        .order('race');
      
      if (raceError) {
        console.error('Error fetching races:', raceError);
        throw raceError;
      }
      console.log('Fetched races:', raceData);
      raceOptions.set(raceData || []);
      
      // Fetch state options
      const { data: stateData, error: stateError } = await supabase
        .from('states')
        .select('id, name, abbreviation')
        .order('name');
      
      if (stateError) {
        console.error('Error fetching states:', stateError);
        throw stateError;
      }
      console.log('Fetched states:', stateData);
      stateOptions.set(stateData || []);
      
    } catch (err) {
      console.error('Error fetching options:', err);
      error.set('Failed to load form options');
    }
  }
  
  // Fetch contact details
  async function fetchContactDetails() {
    if (!contactId) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      // Fetch contact details
      const { data, error: fetchError } = await supabase
        .rpc('get_contact_details', { contact_uuid: contactId });
      
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        const contactData = data[0];
        
        // Set basic info
        formData.set({
          first_name: contactData.full_name.split(' ')[0] || '',
          last_name: contactData.full_name.split(' ').slice(-1)[0] || '',
          middle_name: contactData.full_name.split(' ').slice(1, -1).join(' ') || '',
          gender_id: contactData.gender_id || '',
          race_id: contactData.race_id || '',
          pronouns: contactData.pronouns || '',
          vanid: contactData.vanid || '',
          status: contactData.status || 'active'
        });
        
        // Store original data for comparison
        originalData.set(JSON.parse(JSON.stringify($formData)));
        
        // Set emails
        if (contactData.emails && Array.isArray(contactData.emails)) {
          emails.set(contactData.emails.map(email => ({
            id: email.id,
            email: email.email,
            status: email.status
          })));
        }
        
        // Set phone numbers
        if (contactData.phone_numbers && Array.isArray(contactData.phone_numbers)) {
          phoneNumbers.set(contactData.phone_numbers.map(phone => ({
            id: phone.id,
            phone_number: phone.phone_number,
            status: phone.status
          })));
        }
        
        // Set addresses
        if (contactData.addresses && Array.isArray(contactData.addresses)) {
          addresses.set(contactData.addresses.map(address => ({
            id: address.id,
            street_address: address.street_address,
            secondary_street_address: address.secondary_street_address || '',
            city: address.city,
            state_id: address.state_id,
            zip_code: address.zip_code_id,
            status: address.status
          })));
        }
        
        // Set social media
        if (contactData.social_media && Array.isArray(contactData.social_media)) {
          socialMedia.set(contactData.social_media.map(social => ({
            id: social.id,
            social_media_account: social.social_media_account,
            service_type: social.service_type,
            status: social.status
          })));
        }
        
        // Set tags
        if (contactData.tags && Array.isArray(contactData.tags)) {
          tags.set(contactData.tags.map(tag => tag.tag));
        }
      }
      
    } catch (err) {
      console.error('Error fetching contact details:', err);
      error.set('Failed to load contact details');
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
      // Update contact basic info if changed
      if (JSON.stringify($formData) !== JSON.stringify($originalData)) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update($formData)
          .eq('id', contactId);
        
        if (updateError) throw updateError;
      }
      
      // Handle email updates
      for (const email of $emails) {
        if (email.isNew) {
          // Insert new email
          await supabase
            .from('contact_emails')
            .insert({
              contact_id: contactId,
              email: email.email,
              status: email.status
            });
        } else if (email.isDeleted) {
          // Delete email
          await supabase
            .from('contact_emails')
            .delete()
            .eq('id', email.id);
        } else if (email.isModified) {
          // Update email
          await supabase
            .from('contact_emails')
            .update({
              email: email.email,
              status: email.status
            })
            .eq('id', email.id);
        }
      }
      
      // Handle phone updates
      for (const phone of $phoneNumbers) {
        if (phone.isNew) {
          // Insert new phone
          await supabase
            .from('contact_phone_numbers')
            .insert({
              contact_id: contactId,
              phone_number: phone.phone_number,
              status: phone.status
            });
        } else if (phone.isDeleted) {
          // Delete phone
          await supabase
            .from('contact_phone_numbers')
            .delete()
            .eq('id', phone.id);
        } else if (phone.isModified) {
          // Update phone
          await supabase
            .from('contact_phone_numbers')
            .update({
              phone_number: phone.phone_number,
              status: phone.status
            })
            .eq('id', phone.id);
        }
      }
      
      // Handle address updates
      for (const address of $addresses) {
        if (address.isNew) {
          // Handle the zip code first - get or create it
          let zip_code_id = null;
          if (address.zip_code && address.zip_code.trim()) {
            // Try to find the zip code first
            const { data: zipData, error: zipError } = await supabase
              .from('zip_codes')
              .select('id')
              .eq('name', address.zip_code.trim())
              .maybeSingle();
            
            if (!zipError && zipData) {
              // Use existing zip code
              zip_code_id = zipData.id;
            } else {
              // Create a new zip code record
              try {
                const { data: newZipCode, error: zipCreateError } = await supabase
                  .from('zip_codes')
                  .insert({
                    name: address.zip_code.trim(),
                    state_id: address.state_id || null
                  })
                  .select('id')
                  .single();
                
                if (zipCreateError) {
                  console.error('Error creating zip code:', zipCreateError);
                } else {
                  zip_code_id = newZipCode.id;
                }
              } catch (err) {
                console.error('Error in zip code creation process:', err);
              }
            }
          }
          
          // Insert new address with the zip code
          await supabase
            .from('contact_addresses')
            .insert({
              contact_id: contactId,
              street_address: address.street_address,
              secondary_street_address: address.secondary_street_address || null,
              city: address.city,
              state_id: address.state_id,
              zip_code_id: zip_code_id,
              status: address.status
            });
        } else if (address.isDeleted) {
          // Delete address
          await supabase
            .from('contact_addresses')
            .delete()
            .eq('id', address.id);
        } else if (address.isModified) {
          // Handle the zip code first - get or create it
          let zip_code_id = null;
          if (address.zip_code && address.zip_code.trim()) {
            // Try to find the zip code first
            const { data: zipData, error: zipError } = await supabase
              .from('zip_codes')
              .select('id')
              .eq('name', address.zip_code.trim())
              .maybeSingle();
            
            if (!zipError && zipData) {
              // Use existing zip code
              zip_code_id = zipData.id;
            } else {
              // Create a new zip code record
              try {
                const { data: newZipCode, error: zipCreateError } = await supabase
                  .from('zip_codes')
                  .insert({
                    name: address.zip_code.trim(),
                    state_id: address.state_id || null
                  })
                  .select('id')
                  .single();
                
                if (zipCreateError) {
                  console.error('Error creating zip code:', zipCreateError);
                } else {
                  zip_code_id = newZipCode.id;
                }
              } catch (err) {
                console.error('Error in zip code creation process:', err);
              }
            }
          }
          
          // Update address with the zip code
          await supabase
            .from('contact_addresses')
            .update({
              street_address: address.street_address,
              secondary_street_address: address.secondary_street_address || null,
              city: address.city,
              state_id: address.state_id,
              zip_code_id: zip_code_id,
              status: address.status
            })
            .eq('id', address.id);
        }
      }
      
      // Handle social media updates
      for (const social of $socialMedia) {
        if (social.isNew) {
          // Insert new social media
          await supabase
            .from('contact_social_media_accounts')
            .insert({
              contact_id: contactId,
              social_media_account: social.social_media_account,
              service_type: social.service_type,
              status: social.status
            });
        } else if (social.isDeleted) {
          // Delete social media
          await supabase
            .from('contact_social_media_accounts')
            .delete()
            .eq('id', social.id);
        } else if (social.isModified) {
          // Update social media
          await supabase
            .from('contact_social_media_accounts')
            .update({
              social_media_account: social.social_media_account,
              service_type: social.service_type,
              status: social.status
            })
            .eq('id', social.id);
        }
      }
      
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
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        dispatch('close');
      }
    } else {
      dispatch('close');
    }
  }
  
  // Watch for contact ID changes
  $: if (contactId && isOpen) {
    fetchContactDetails();
    fetchOptions();
  }
  
  // Event handlers for child components
  function handleFormDataChange() {
    // Check if form data has changed
    if ($originalData) {
      const changed = Object.keys($formData).some(key => {
        return $formData[key] !== $originalData[key];
      });
      
      hasChanges.set(changed);
    }
  }
  
  function handleMultiItemChange() {
    hasChanges.set(true);
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
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
      on:click={handleClose}
      transition:fly={{ duration: 200, opacity: 0 }}
    ></div>
    
    <!-- Sheet panel -->
    <div 
      class="absolute inset-y-0 right-0 max-w-2xl w-full flex"
      transition:fly={{ duration: 300, x: '100%' }}
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
                  {$formData.first_name} {$formData.last_name}
                {/if}
              </h2>
              <p class="mt-1 text-sm text-gray-500">
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
              on:click={handleClose}
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
            <form class="space-y-6">
              <!-- Basic Information Section -->
              <ContactBasicInfo 
                {formData}
                {genderOptions}
                {raceOptions}
                {isSaving}
                on:change={handleFormDataChange}
              />
              
              <!-- Email Addresses Section -->
              <ContactEmails 
                {emails}
                {isSaving}
                on:change={handleMultiItemChange}
              />
              
              <!-- Phone Numbers Section -->
              <ContactPhones 
                phoneNumbers={phoneNumbers}
                {isSaving}
                on:change={handleMultiItemChange}
              />
              
              <!-- Addresses Section -->
              <ContactAddresses 
                {addresses}
                {stateOptions}
                {isSaving}
                on:change={handleMultiItemChange}
              />
              
              <!-- Social Media Section -->
              <ContactSocialMedia 
                socialMedia={socialMedia}
                {isSaving}
                on:change={handleMultiItemChange}
              />
              
              <!-- Tags Section -->
              <ContactTags 
                {tags}
                {isSaving}
                on:change={handleMultiItemChange}
              />
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
                on:click={cancelChanges}
                disabled={$isSaving}
              >
                Cancel
              </button>
              
              <button
                type="button"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                on:click={saveChanges}
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
                on:click={handleClose}
              >
                Close
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  {/if}