<script lang="ts">
    import { ArrowDown } from '@lucide/svelte';
    import Button from './Button.svelte';
    
    export let subheading: string;
    export let heading: string;
    export let description: string;
    export let buttonText: string;
    export let imageSrc: string;
    export let imageAlt: string;
    export let nextSectionId: string;
    
    function scrollToNextSection() {
      const element = document.getElementById(nextSectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  </script>
  
  <header class="px-8 py-20">
    <div class="h-full max-w-7xl mx-auto">
      <div class="h-full lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center">
        <!-- Content Section -->
        <div class="relative z-10">
          <div class="flex flex-col gap-6 sm:text-center lg:text-left">
            <span class="font-caveat font-bold text-blue-600 text-xl">
              {subheading}
            </span>
            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              {heading}
            </h1>
            <p class="text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto lg:mx-0">
              {description}
            </p>
            <div>
              <Button 
                type="primary" 
                on:click={scrollToNextSection}
                TrailingIcon={ArrowDown}
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
  
        <!-- Image Section -->
        <div class="relative w-full h-[50vh] lg:h-full mt-8 lg:mt-0">
          <img
            class="absolute inset-0 w-full h-full object-cover rounded-2xl"
            src={imageSrc}
            alt={imageAlt}
          />
        </div>
      </div>
    </div>
  </header>