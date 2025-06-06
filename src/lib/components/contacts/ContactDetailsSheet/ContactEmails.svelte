<!-- src/lib/components/contacts/ContactDetailsSheet/ContactEmails.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Plus, X, Mail } from '@lucide/svelte';
  
  // Props
  export let emails;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  function handleChange() {
    dispatch('change');
  }
  
  function addEmail() {
    emails.update(items => [...items, { 
      email: '', 
      status: 'active',
      isNew: true,
      isModified: false,
      isDeleted: false
    }]);
    console.log('Added new email with flags:', { isNew: true, isModified: false, isDeleted: false });
    handleChange();
  }
  
  function removeEmail(index) {
    emails.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      // Initialize flags if they don't exist
      if (item.isNew === undefined) item.isNew = false;
      if (item.isModified === undefined) item.isModified = false;
      if (item.isDeleted === undefined) item.isDeleted = false;
      
      if (item.id) {
        // For existing items, mark as deleted
        item.isDeleted = true;
        console.log(`Email ${index} with ID ${item.id} marked as deleted`);
      } else {
        // For new items, just remove from array
        updatedItems.splice(index, 1);
        console.log(`New email at index ${index} removed from array`);
      }
      
      return updatedItems;
    });
    handleChange();
  }
  
  function updateEmail(index, field, value) {
    emails.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      // Initialize flags if they don't exist
      if (item.isNew === undefined) item.isNew = false;
      if (item.isModified === undefined) item.isModified = false;
      if (item.isDeleted === undefined) item.isDeleted = false;
      
      if (item.id && !item.isNew) {
        // Mark as modified for existing items
        item.isModified = true;
        console.log(`Email ${index} marked as modified:`, item);
      }
      
      // For email field, ensure it's not null
      if (field === 'email') {
        // Trim the value and store it, or empty string if null/undefined
        item[field] = value ? value.trim() : '';
      } else {
        item[field] = value || 'active'; // Ensure default status is 'active' if null
      }
      
      return updatedItems;
    });
    handleChange();
  }
  
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'bounced':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unsubscribed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
  
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between border-b border-slate-200 pb-4">
    <div>
      <h3 class="text-lg font-semibold leading-6 text-slate-900">Email Addresses</h3>
      <p class="mt-1 text-sm text-slate-600">Manage contact email addresses and delivery status.</p>
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-9 px-3"
      on:click={addEmail}
      disabled={isSaving}
    >
      <Plus class="h-4 w-4" />
      Add Email
    </button>
  </div>
  
  <div class="space-y-4">
    {#each $emails.filter(item => !item.isDeleted) as email, i}
      <div class="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button 
          type="button" 
          class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" 
          on:click={() => removeEmail(i)}
          disabled={isSaving}
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Remove email</span>
        </button>
        
        <div class="grid gap-4 pr-8 md:grid-cols-3">
          <div class="md:col-span-2 space-y-2">
            <label for="email_{i}" class="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input 
              type="email" 
              id="email_{i}" 
              value={email.email}
              on:input={(e) => updateEmail(i, 'email', e.target.value)}
              class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 {email.email && !isValidEmail(email.email) ? 'border-red-300 focus-visible:ring-red-500' : ''}"
              disabled={isSaving}
              placeholder="contact@example.com"
            />
            {#if email.email && !isValidEmail(email.email)}
              <p class="text-xs text-red-600">Please enter a valid email address</p>
            {/if}
          </div>
          
          <div class="space-y-2">
            <label for="email_status_{i}" class="block text-sm font-medium text-slate-700">Status</label>
            <select 
              id="email_status_{i}" 
              value={email.status}
              on:change={(e) => updateEmail(i, 'status', e.target.value)}
              class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="bounced">Bounced</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>
        
        <!-- Status Badge and Email Display -->
        <div class="mt-3 flex items-center gap-2">
          <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusBadgeClass(email.status)}">
            {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
          </span>
          {#if email.email}
            <span class="text-sm text-slate-600 font-mono">{email.email}</span>
            {#if isValidEmail(email.email)}
              <span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
            {/if}
          {/if}
        </div>
      </div>
    {/each}
    
    {#if $emails.filter(item => !item.isDeleted).length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Mail class="h-8 w-8 text-slate-400 mb-3" />
        <h3 class="text-sm font-medium text-slate-900 mb-1">No email addresses</h3>
        <p class="text-sm text-slate-600 mb-4">Add contact email addresses for digital communication.</p>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
          on:click={addEmail}
          disabled={isSaving}
        >
          <Plus class="h-4 w-4" />
          Add Email Address
        </button>
      </div>
    {/if}
  </div>
</div>