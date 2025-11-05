<script lang="ts">
  export let isOpen: boolean = false;
  export let availableBindings: Record<string, string> = {};
  export let onSelect: (binding: string) => void = () => {};

  function close() {
    isOpen = false;
  }

  function selectBinding(key: string) {
    onSelect(`{{${key}}}`);
    close();
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    role="dialog"
    aria-modal="true"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">Insert Field Binding</h3>
        <button
          type="button"
          on:click={close}
          class="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 overflow-y-auto max-h-[60vh]">
        <p class="text-sm text-gray-600 mb-4">
          Click on a field to insert it at the cursor position. These values will be replaced
          with actual data when the form is displayed.
        </p>

        <div class="space-y-2">
          {#each Object.entries(availableBindings) as [key, description]}
            <button
              type="button"
              on:click={() => selectBinding(key)}
              class="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <code class="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {`{{${key}}}`}
                  </code>
                  <p class="text-sm text-gray-600 mt-1">{description}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end p-4 border-t bg-gray-50">
        <button
          type="button"
          on:click={close}
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
