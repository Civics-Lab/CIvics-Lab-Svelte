<!-- src/lib/components/donations/DonationsViewModals.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '$lib/components/Modal.svelte';
  import DonationFormModal from '$lib/components/DonationFormModal.svelte';
  
  export let isDonationModalOpen: boolean = false;
  export let isCreateViewModalOpen: boolean = false;
  export let isEditViewModalOpen: boolean = false;
  export let isDeleteViewModalOpen: boolean = false;
  export let newViewName: string = '';
  export let currentView: any = null;
  export let supabase: any;
  
  const dispatch = createEventDispatcher();
  
  // Handle donation modal close
  function handleCloseDonationModal() {
    isDonationModalOpen = false; // Directly modify the prop
    dispatch('closeDonationModal');
  }
  
  // Handle donation created successfully
  function handleDonationCreated() {
    isDonationModalOpen = false; // Close the modal after successful creation
    dispatch('donationCreated');
  }
  
  // Handle create view form submit
  function handleCreateViewSubmit() {
    if (newViewName.trim()) {
      dispatch('createView', newViewName);
    }
  }
  
  // Handle edit view form submit
  function handleEditViewSubmit() {
    if (newViewName.trim()) {
      dispatch('updateView', newViewName);
    }
  }
  
  // Handle delete view confirmation
  function handleDeleteViewConfirm() {
    dispatch('deleteView');
  }
</script>

<!-- Donation form modal -->
<DonationFormModal 
  isOpen={isDonationModalOpen} 
  supabase={supabase} 
  onClose={handleCloseDonationModal}
  on:close={handleCloseDonationModal}
  on:success={handleDonationCreated}
/>

<!-- Create View Modal -->
<Modal 
  isOpen={isCreateViewModalOpen} 
  title="Create New View" 
  on:close={() => dispatch('closeCreateViewModal')}
>
  <form on:submit|preventDefault={handleCreateViewSubmit}>
    <div class="mb-4">
      <label for="new-view-name" class="block text-sm font-medium text-gray-700 mb-1">
        View Name
      </label>
      <input
        id="new-view-name"
        type="text"
        bind:value={newViewName}
        class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
        placeholder="Enter view name"
      />
    </div>
    
    <div class="flex justify-end space-x-3 mt-6">
      <button
        type="button"
        class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
        on:click={() => dispatch('closeCreateViewModal')}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        disabled={!newViewName.trim()}
      >
        Create View
      </button>
    </div>
  </form>
</Modal>

<!-- Edit View Modal -->
<Modal 
  isOpen={isEditViewModalOpen} 
  title="Edit View Name" 
  on:close={() => dispatch('closeEditViewModal')}
>
  <form on:submit|preventDefault={handleEditViewSubmit}>
    <div class="mb-4">
      <label for="edit-view-name" class="block text-sm font-medium text-gray-700 mb-1">
        View Name
      </label>
      <input
        id="edit-view-name"
        type="text"
        bind:value={newViewName}
        class="w-full p-2 border rounded focus:ring-purple-500 focus:border-purple-500"
        placeholder={currentView?.view_name || 'Enter view name'}
      />
    </div>
    
    <div class="flex justify-end space-x-3 mt-6">
      <button
        type="button"
        class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
        on:click={() => dispatch('closeEditViewModal')}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        disabled={!newViewName.trim()}
      >
        Update View
      </button>
    </div>
  </form>
</Modal>

<!-- Delete View Modal -->
<Modal 
  isOpen={isDeleteViewModalOpen} 
  title="Delete View" 
  on:close={() => dispatch('closeDeleteViewModal')}
>
  <div class="p-4">
    <p class="text-gray-700 mb-4">
      Are you sure you want to delete the view "{currentView?.view_name}"? This action cannot be undone.
    </p>
    
    <div class="flex justify-end space-x-3 mt-6">
      <button
        type="button"
        class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
        on:click={() => dispatch('closeDeleteViewModal')}
      >
        Cancel
      </button>
      <button
        type="button"
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        on:click={handleDeleteViewConfirm}
      >
        Delete View
      </button>
    </div>
  </div>
</Modal>
