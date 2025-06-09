<!-- src/lib/components/import/ImportStepIndicator.svelte -->
<script lang="ts">
  import type { ImportStep } from '$lib/types/import';

  export let currentStep: number;
  export let steps: ImportStep[];

  $: processedSteps = steps.map((step, index) => ({
    ...step,
    completed: index < currentStep - 1,
    active: index === currentStep - 1
  }));
</script>

<nav aria-label="Import Progress">
  <ol class="flex items-center">
    {#each processedSteps as step, index}
      <li class="relative flex-1">
        <!-- Step content -->
        <div class="flex items-center">
          <!-- Step circle -->
          <div class="relative flex h-8 w-8 items-center justify-center">
            {#if step.completed}
              <!-- Completed step -->
              <div class="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                <svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            {:else if step.active}
              <!-- Active step -->
              <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span class="text-sm font-medium text-white">{step.number}</span>
              </div>
            {:else}
              <!-- Upcoming step -->
              <div class="h-8 w-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                <span class="text-sm font-medium text-gray-500">{step.number}</span>
              </div>
            {/if}
          </div>

          <!-- Step label -->
          <div class="ml-3 flex-1">
            <div class="text-sm font-medium {step.active ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'}">
              {step.title}
            </div>
            <div class="text-xs text-gray-400">
              {step.description}
            </div>
          </div>
        </div>

        <!-- Connector line -->
        {#if index < steps.length - 1}
          <div class="absolute top-4 left-4 w-full h-0.5 {step.completed ? 'bg-green-600' : 'bg-gray-300'}" 
               style="margin-left: 2rem; width: calc(100% - 2rem);"></div>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
