<script lang="ts">
    import Button from './Button.svelte';
    
    export let subheading = {
      text: '',
      style: ''
    };
    export let heading = '';
    export let body = '';
    export let primaryButton = undefined;
    export let secondaryButton = undefined;
    export let image = {
      src: '',
      alt: ''
    };
    export let product = undefined;
    
    // Service colors mapping
    import { serviceColors } from '$lib/services'; 
  </script>
  
  <header id="header" class="px-4 sm:px-8 pt-12 sm:pt-20">
    <div class="max-w-7xl mx-auto w-full">
      <div class="flex flex-col items-center text-center gap-4 sm:gap-6">
        <!-- Product Info -->
        {#if product}
          <div class="flex items-center gap-3">
            <img 
              src={product.iconSrc} 
              alt=""
              class="w-6 sm:w-8 h-6 sm:h-8" 
            />
            <span class={`text-lg sm:text-xl font-bold font-caveat ${serviceColors[product.name]}`}>
              {product.name}
            </span>
          </div>
        {/if}
  
        <!-- Subheading -->
        <h2 class={`text-lg sm:text-xl font-bold font-caveat ${subheading.style}`}>
          {subheading.text}
        </h2>
  
        <!-- Heading -->
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-950 max-w-4xl">
          {heading}
        </h1>
  
        <!-- Body -->
        <p class="text-sm sm:text-base font-semibold text-slate-500 max-w-2xl">
          {body}
        </p>
  
        <!-- Buttons -->
        {#if primaryButton || secondaryButton}
          <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            {#if primaryButton}
              <Button
                type={primaryButton.type || 'primary'}
                href={primaryButton.to}
                TrailingIcon={primaryButton.trailingIcon}
              >
                {primaryButton.text}
              </Button>
            {/if}
            {#if secondaryButton}
              <Button
                type={secondaryButton.type || 'secondary'}
                href={secondaryButton.to}
                TrailingIcon={secondaryButton.trailingIcon}
              >
                {secondaryButton.text}
              </Button>
            {/if}
          </div>
        {/if}
  
        <!-- Banner Image -->
        <div class="w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-xl sm:rounded-2xl overflow-hidden">
          <img
            src={image.src}
            alt={image.alt}
            class="w-full h-[250px] sm:h-[300px] md:h-[400px] object-cover"
          />
        </div>
      </div>
    </div>
  </header>