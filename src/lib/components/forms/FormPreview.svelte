<script lang="ts">
  import BlockRenderer from './BlockRenderer.svelte';
  import type { Form } from '$lib/types/form';

  export let isOpen: boolean = false;
  export let form: Form;
  export let bindings: Record<string, string> = {};

  let viewMode: 'desktop' | 'mobile' = 'desktop';

  function close() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    role="dialog"
    aria-modal="true"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <div class="flex items-center gap-4">
          <h3 class="text-lg font-semibold">Form Preview</h3>

          <!-- View Mode Toggle -->
          <div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              on:click={() => (viewMode = 'desktop')}
              class="px-3 py-1 rounded {viewMode === 'desktop'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              type="button"
              on:click={() => (viewMode = 'mobile')}
              class="px-3 py-1 rounded {viewMode === 'mobile'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

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

      <!-- Preview Content -->
      <div class="flex-1 overflow-y-auto bg-gray-100 p-8">
        <div
          class="bg-white rounded-lg shadow-lg mx-auto transition-all duration-300 {viewMode ===
          'mobile'
            ? 'max-w-md'
            : 'max-w-5xl'}"
        >
          <!-- Logo -->
          {#if form.logoUrl}
            <div class="p-6 border-b">
              <img
                src={form.logoUrl}
                alt="Form logo"
                class="h-16 w-auto mx-auto"
              />
            </div>
          {/if}

          <!-- Two Column Layout -->
          <div class="grid {viewMode === 'mobile' ? 'grid-cols-1' : 'md:grid-cols-2'} gap-8 p-6">
            <!-- Left: Content -->
            <div>
              <BlockRenderer blocks={form.leftContent} {bindings} />
            </div>

            <!-- Right: Form (Mock) -->
            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold mb-4">Donation Information</h3>

              <!-- Mock Form Fields -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    disabled
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    disabled
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    disabled
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    disabled
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  />
                </div>

                <button
                  type="button"
                  disabled
                  class="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 border-t bg-gray-50">
            <BlockRenderer blocks={form.footerContent} {bindings} />
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
