<script lang="ts">
    export let icon = undefined;
    export let text = undefined;
    export let variant = 'compass';
    export let heading = '';
    export let body = '';
    
    // Map variants to style classes
    const variantStyles = {
      global: 'text-blue-500 bg-blue-100 border-blue-500',
      compass: 'text-cyan-500 bg-cyan-100 border-cyan-500',
      helpdesk: 'text-violet-500 bg-violet-100 border-violet-500',
      engage: 'text-teal-500 bg-teal-100 border-teal-500',
      pathway: 'text-lime-500 bg-lime-100 border-lime-500',
      advocacyink: 'text-amber-500 bg-amber-100 border-amber-500'
    };
    
    // Compute the style class based on the variant
    $: styleClass = variantStyles[variant] || variantStyles.compass;
  </script>
  
  <div class="flex flex-col gap-2">
    <div class={`border-2 rounded-lg p-4 w-14 h-14 flex items-center justify-center ${styleClass}`}>
      {#if icon}
        <svelte:component this={icon} class="w-7 h-7" />
      {/if}
      {#if text}
        <span class="text-2xl font-bold">{text}</span>
      {/if}
    </div>
    <h3 class="text-2xl font-bold">{heading}</h3>
    <p class="text-base text-slate-500 font-medium">{body}</p>
  </div>