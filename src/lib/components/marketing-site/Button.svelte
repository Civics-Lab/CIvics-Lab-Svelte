<script lang="ts">
    import { ArrowRight } from '@lucide/svelte';
    
    export let type: 'primary' | 'secondary' | 'tertiary' | 'compass' | 'helpdesk' | 'engage' | 'pathway' | 'advocacyink' | 'ghost' = 'primary';
    export let href: string = undefined;
    export let className: string = '';
    export let TrailingIcon = undefined;
    
    // Map button types to class names
    const buttonStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-white text-slate-950 border border-slate-300 hover:bg-slate-50',
      tertiary: 'bg-transparent text-slate-950 hover:bg-slate-50',
      ghost: 'bg-transparent text-slate-950 hover:bg-slate-100',
      compass: 'bg-cyan-500 text-white hover:bg-cyan-600',
      helpdesk: 'bg-violet-500 text-white hover:bg-violet-600',
      engage: 'bg-teal-500 text-white hover:bg-teal-600',
      pathway: 'bg-lime-500 text-white hover:bg-lime-600',
      advocacyink: 'bg-amber-500 text-white hover:bg-amber-600'
    };
    
    const classes = `inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors ${buttonStyles[type]} ${className}`;
  </script>
  
  {#if href}
    <a {href} class={classes}>
      <slot></slot>
      {#if TrailingIcon}
        <span class="ml-2">
          <svelte:component this={TrailingIcon} size={18} />
        </span>
      {/if}
    </a>
  {:else}
    <button class={classes} on:click>
      <slot></slot>
      {#if TrailingIcon}
        <span class="ml-2">
          <svelte:component this={TrailingIcon} size={18} />
        </span>
      {/if}
    </button>
  {/if}