<script lang="ts">
  import Button from './Button.svelte';
  
  export let id = '';
  export let subheading = '';
  export let service = undefined;
  export let heading: string;
  export let body: string;
  export let primaryButton = undefined;
  export let secondaryButton = undefined;
  export let image: { src: string; alt: string };
  
  // Service colors mapping
  const serviceColors = {
    Compass: 'text-cyan-500',
    'Help Desk': 'text-violet-500',
    Engage: 'text-teal-500',
    Pathway: 'text-lime-500',
    'Advocacy Ink': 'text-amber-500'
  };
</script>

<section {id} class="relative overflow-hidden px-8 py-20">
  <div class="mx-auto max-w-7xl w-full">
    <div class="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center">
      <!-- Content Side -->
      <div class="max-w-xl flex flex-col gap-4">
        <!-- Optional Subheading -->
        {#if subheading}
          <span class="block text-blue-600 font-caveat font-bold text-xl">
            {subheading}
          </span>
        {/if}

        <!-- Optional Service -->
        {#if service}
          <div class="flex items-center space-x-2">
            <div class="flex-shrink-0 h-7 w-7">
              <img 
                src={service.iconSrc}
                alt=""
                class="h-full w-full object-contain"
              />
            </div>
            <span class={`font-caveat font-bold text-xl ${serviceColors[service.name]}`}>
              {service.name}
            </span>
          </div>
        {/if}

        <!-- Heading -->
        <h2 class="text-3xl font-bold text-gray-900 sm:text-4xl">
          {heading}
        </h2>

        <!-- Body Content -->
        <p class="text-lg text-gray-500">
          {body}
        </p>

        <!-- Buttons -->
        {#if primaryButton || secondaryButton}
          <div class="flex flex-wrap gap-4">
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
      </div>

      <!-- Image Side -->
      <div class="relative w-full h-[50vh] lg:min-h-[500px] lg:h-full mt-8 lg:mt-0 overflow-hidden rounded-2xl">
        <img
          class="absolute inset-0 w-full h-full object-cover"
          src={image.src}
          alt={image.alt}
        />
      </div>
    </div>
  </div>
</section>