<script lang="ts">
    import Button from './Button.svelte';
    
    export let title = '';
    export let variant = 'secondary';
    export let productName = '';
    export let price = undefined;
    export let text = undefined;
    export let includedItems = [];
    export let features = [];
    export let primaryButton = undefined;
    export let secondaryButton = undefined;
    
    // Variant styles based on product and variant
    const variantStyles = {
      primary: {
        'Compass': 'border-cyan-500 bg-cyan-500 text-white',
        'Help Desk': 'border-violet-500 bg-violet-500 text-white',
        'Engage': 'border-teal-500 bg-teal-500 text-white',
        'Pathway': 'border-lime-500 bg-lime-500 text-white',
        'Advocacy Ink': 'border-amber-500 bg-amber-500 text-white'
      },
      secondary: {
        'Compass': 'border-cyan-200 bg-cyan-100 text-cyan-950',
        'Help Desk': 'border-violet-200 bg-violet-100 text-violet-950',
        'Engage': 'border-teal-200 bg-teal-100 text-teal-950',
        'Pathway': 'border-lime-200 bg-lime-100 text-lime-950',
        'Advocacy Ink': 'border-amber-200 bg-amber-100 text-amber-950'
      }
    };
    
    // Get the style class for this card
    $: styleClass = variantStyles[variant][productName] || '';
  </script>
  
  <div class={`rounded-xl border-2 p-8 flex flex-col gap-7 ${styleClass}`}>
    <!-- Title -->
    <h3 class="text-4xl font-bold">{title}</h3>
  
    <!-- Price Section -->
    <div class="flex flex-col gap-2">
      <div class="flex items-top gap-1">
        {#if text}
          <span class="text-6xl font-bold">{text}</span>
        {:else if price}
          <span class="text-base">$</span>
          {#if price.dollars}
            <span class="text-6xl font-bold">{price.dollars}</span>
          {/if}
          {#if price.cents}
            <span class="text-base">.{price.cents}</span>
          {/if}
          {#if price.period}
            <span class="text-xs font-semibold">/{price.period}</span>
          {/if}
        {/if}
      </div>
    </div>
  
    <!-- What's Included Section -->
    {#if includedItems && includedItems.length > 0}
      <div class="flex flex-col gap-1">
        <h4 class="font-bold text-sm">What's included</h4>
        <ul class="flex flex-col gap-1">
          {#each includedItems as item}
            <li class="text-sm flex items-center gap-2">
              <span class="text-[0.6rem]">★</span>
              {item}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  
    <!-- Features Section -->
    {#if features && features.length > 0}
      <div class="flex flex-col gap-1">
        <h4 class="font-bold text-sm">Features</h4>
        <ul class="flex flex-col gap-1">
          {#each features as feature}
            <li class="text-sm flex items-center gap-2">
              <span class="text-[0.6rem]">★</span>
              {feature}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  
    <!-- Buttons -->
    <div class="flex flex-col xl:flex-row gap-3 mt-auto">
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
  </div>