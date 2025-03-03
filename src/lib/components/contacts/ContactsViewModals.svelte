<!-- src/lib/components/contacts/ContactsViewModals.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Modal from '$lib/components/Modal.svelte';
    import ContactFormModal from '$lib/components/ContactFormModal.svelte';
    
    // Props
    export let isContactModalOpen = false;
    export let isCreateViewModalOpen = false;
    export let isEditViewModalOpen = false;
    export let isDeleteViewModalOpen = false;
    export let newViewName = '';
    export let currentView = null;
    export let supabase = null;
    
    const dispatch = createEventDispatcher();
    
    // Event handlers
    function closeContactModal() {
      dispatch('closeContactModal');
    }
    
    function contactCreated(event) {
      dispatch('contactCreated', event.detail);
    }
    
    function createView() {
      if (newViewName.trim()) {
        // Pass the newViewName as the event detail
        dispatch('createView', newViewName);
      }
    }
    
    function updateView() {
      if (newViewName.trim()) {
        // Pass the newViewName as the event detail
        dispatch('updateView', newViewName);
      }
    }
    
    function deleteView() {
      dispatch('deleteView');
    }
    
    function closeCreateViewModal() {
      dispatch('closeCreateViewModal');
    }
    
    function closeEditViewModal() {
      dispatch('closeEditViewModal');
    }
    
    function closeDeleteViewModal() {
      dispatch('closeDeleteViewModal');
    }
  </script>
  
  <!-- Contact Form Modal -->
  <ContactFormModal 
    isOpen={isContactModalOpen} 
    {supabase} 
    on:close={closeContactModal}
    on:success={contactCreated}
  />
  
  <!-- Create View Modal -->
  <Modal 
    isOpen={isCreateViewModalOpen} 
    title="Create New View" 
    on:close={closeCreateViewModal}
  >
    <form on:submit|preventDefault={createView}>
      <div class="mb-4">
        <label for="view_name" class="block text-sm font-medium text-gray-700 mb-1">
          View Name
        </label>
        <input
          id="view_name"
          type="text"
          bind:value={newViewName}
          class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter view name"
        />
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          on:click={closeCreateViewModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
    on:close={closeEditViewModal}
  >
    <form on:submit|preventDefault={updateView}>
      <div class="mb-4">
        <label for="edit_view_name" class="block text-sm font-medium text-gray-700 mb-1">
          View Name
        </label>
        <input
          id="edit_view_name"
          type="text"
          bind:value={newViewName}
          class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          placeholder={currentView?.view_name || 'Enter view name'}
        />
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          on:click={closeEditViewModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
    on:close={closeDeleteViewModal}
  >
    <div class="p-4">
      <p class="text-gray-700 mb-4">
        Are you sure you want to delete the view "{currentView?.view_name}"? This action cannot be undone.
      </p>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          on:click={closeDeleteViewModal}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          on:click={deleteView}
        >
          Delete View
        </button>
      </div>
    </div>
  </Modal>