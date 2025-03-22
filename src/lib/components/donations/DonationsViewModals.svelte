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
    } else {
      dispatch('closeCreateViewModal');
    }
  }
  
  // Handle edit view form submit
  function handleEditViewSubmit() {
    if (newViewName.trim()) {
      dispatch('updateView', newViewName);
    } else {
      dispatch('closeEditViewModal');
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
  confirmText="Create"
  cancelText="Cancel"
  on:close={() => dispatch('closeCreateViewModal')}
  on:confirm={handleCreateViewSubmit}
>
  <div class="p-4">
    <label for="new-view-name" class="block text-sm font-medium text-gray-700 mb-2">
      View Name
    </label>
    <input 
      id="new-view-name" 
      type="text" 
      bind:value={newViewName}
      placeholder="Enter view name"
      class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
    />
  </div>
</Modal>

<!-- Edit View Modal -->
<Modal
  isOpen={isEditViewModalOpen}
  title="Rename View"
  confirmText="Save"
  cancelText="Cancel"
  on:close={() => dispatch('closeEditViewModal')}
  on:confirm={handleEditViewSubmit}
>
  <div class="p-4">
    <label for="edit-view-name" class="block text-sm font-medium text-gray-700 mb-2">
      View Name
    </label>
    <input 
      id="edit-view-name" 
      type="text" 
      bind:value={newViewName}
      placeholder="Enter view name"
      class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
    />
  </div>
</Modal>

<!-- Delete View Modal -->
<Modal
  isOpen={isDeleteViewModalOpen}
  title="Delete View"
  confirmText="Delete"
  cancelText="Cancel"
  confirmClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
  on:close={() => dispatch('closeDeleteViewModal')}
  on:confirm={handleDeleteViewConfirm}
>
  <div class="p-4">
    <p class="text-sm text-gray-500">
      Are you sure you want to delete the view "{currentView?.view_name}"? This action cannot be undone.
    </p>
  </div>
</Modal>
