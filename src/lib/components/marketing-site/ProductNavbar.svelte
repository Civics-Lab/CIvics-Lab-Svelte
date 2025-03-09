<script lang="ts">
    import { onMount } from 'svelte';
    import Button from './Button.svelte';
    import { serviceColors } from '$lib/services';
    
    export let product = {
      name: '',
      iconSrc: ''
    };
    export let navItems = [];
    export let button = {
      text: '',
      to: '',
      type: 'primary',
      trailingIcon: undefined
    };
    
    let isSticky = false;
  
    // Handle scroll behavior
    onMount(() => {
      const handleScroll = () => {
        const offset = window.scrollY;
        isSticky = offset > 100; // Adjust this value based on your needs
      };
  
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    });
  
    // Smooth scroll to section
    function scrollToSection(id) {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Get the appropriate color class based on product name
    $: productColorClass = serviceColors[product.name] || '';
  </script>
  
  <nav class={`bg-white border-b border-gray-200 transition-all duration-200 px-4 sm:px-6 lg:px-8 ${isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-sm' : ''}`}>
    <div class="max-w-7xl mx-auto w-full">
      <div class="flex items-center justify-between h-16">
        <!-- Left - Product Info -->
        <div class="flex items-center gap-3">
          <img 
            src={product.iconSrc} 
            alt={product.name}
            class="w-6 h-6"
          />
          <div class="flex flex-col">
            <span class="font-bold text-base text-slate-900">
              Civics Lab
            </span>
            <span class={`font-caveat font-bold text-lg -mt-4 ${productColorClass}`}>
              {product.name}
            </span>
          </div>
        </div>
  
        <!-- Right - Nav Items & Button -->
        <div class="flex flex-row items-center gap-8">
          <!-- Nav Items -->
          <div class="hidden md:flex items-center gap-6">
            {#each navItems as item}
              <button
                on:click={() => scrollToSection(item.to)}
                class="text-sm text-slate-900 hover:text-slate-900 font-semibold"
              >
                {item.label}
              </button>
            {/each}
          </div>
  
          <!-- CTA Button -->
          <Button
            type={button.type || 'primary'}
            href={button.to}
            TrailingIcon={button.trailingIcon}
          >
            {button.text}
          </Button>
        </div>
      </div>
    </div>
  </nav>