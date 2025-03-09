<script lang="ts">
  import { onMount } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { Menu, X } from '@lucide/svelte';
  import Button from './Button.svelte';
  
  let isOpen = false;
  
  // Navigation data (to be imported from a store or constant file)
  const navigationItems = {
    products: [
      { name: 'Compass', description: 'For campaign management', href: '/products/compass', icon: '/images/compass.svg' },
      { name: 'Help Desk', description: 'Support when you need it', href: '/products/helpdesk', icon: '/images/help-desk.svg' },
      { name: 'Engage', description: 'CRM for county parties', href: '/products/engage', icon: '/images/engage.svg' },
      { name: 'Pathway', description: 'Educational resources', href: '/products/pathway', icon: '/images/pathway.svg' },
      { name: 'Advocacy Ink', description: 'Print services', href: '/products/advocacy-ink', icon: '/images/advocacy-ink.svg' },
    ],
    solutions: [
      {
        heading: 'By Role',
        items: [
          { name: 'For Candidates', href: '/solutions/candidates', icon: '/images/solutions/candidates.svg' },
          { name: 'For Staff', href: '/solutions/staff', icon: '/images/solutions/staff.svg' },
          { name: 'For County Parties', href: '/solutions/county-parties', icon: '/images/solutions/county-parties.svg' },
        ]
      },
      {
        heading: 'By Need',
        items: [
          { name: 'Campaign Management', href: '/solutions/campaign-management', icon: '/images/solutions/campaign-management.svg' },
          { name: 'Volunteer Coordination', href: '/solutions/volunteer-coordination', icon: '/images/solutions/volunteer-coordination.svg' },
          { name: 'Donor Tracking', href: '/solutions/donor-tracking', icon: '/images/solutions/donor-tracking.svg' },
        ]
      }
    ],
    resources: [
      { name: 'Blog', href: '/blog', icon: '/images/resources/blog.svg' },
      { name: 'Documentation', href: '/docs', icon: '/images/resources/docs.svg' },
      { name: 'Support', href: '/support', icon: '/images/resources/support.svg' },
    ]
  };
  
  function toggleMobileMenu() {
    isOpen = !isOpen;
  }
  
  onMount(() => {
    // Close mobile menu when clicking outside
    function handleClickOutside(event) {
      if (isOpen && !event.target.closest('.mobile-menu') && !event.target.closest('.menu-button')) {
        isOpen = false;
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<nav class="fixed w-full z-50 bg-white px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto w-full">
    <div class="flex items-center justify-between h-16">
      <!-- Mobile Layout -->
      <div class="flex w-full items-center justify-between md:hidden">
        <!-- Left: Login Button -->
        <a href="/login" class="text-gray-800 hover:text-gray-600 px-3 py-2">
          Login
        </a>

        <!-- Center: Logo -->
        <a href="/" class="absolute left-1/2 -translate-x-1/2">
          <img src="/images/logo.svg" alt="Company Logo" class="h-8 w-auto" />
        </a>

        <!-- Right: Menu Button -->
        <button
          on:click={toggleMobileMenu}
          class="text-gray-800 hover:text-gray-600 menu-button"
        >
          {#if isOpen}
            <X size={24} />
          {:else}
            <Menu size={24} />
          {/if}
        </button>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden md:flex items-center space-x-8">
        <a href="/">
          <img src="/images/logo.svg" alt="Company Logo" class="h-8 w-auto" />
        </a>
        
        <!-- Desktop Navigation - Left Side -->
        <div class="flex items-center space-x-8">
          <!-- Products Dropdown -->
          <div class="relative group">
            <button class="font-semibold text-slate-950 hover:text-slate-600 px-3 py-2">
              Products
            </button>
            <div class="absolute left-0 mt-2 w-max min-w-[320px] max-w-[600px] rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div class="px-6 py-6 space-y-6">
                {#each navigationItems.products as product}
                  <a
                    href={product.href}
                    class="block p-3 hover:bg-gray-100 rounded-lg"
                  >
                    <div class="flex items-start space-x-4">
                      <img 
                        src={product.icon} 
                        alt="" 
                        class="flex-shrink-0 w-10 h-10"
                      />
                      <div class="flex-shrink-0">
                        <div class="font-inter font-bold text-slate-950">{product.name}</div>
                        <p class="font-inter font-medium text-sm text-slate-500 whitespace-nowrap">{product.description}</p>
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            </div>
          </div>

          <!-- Solutions Dropdown -->
          <div class="relative group">
            <button class="font-semibold text-slate-950 hover:text-slate-600 px-3 py-2">
              Solutions
            </button>
            <div class="absolute left-0 mt-2 w-[600px] rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div class="p-6">
                {#each navigationItems.solutions as section}
                  <div class="mb-8 last:mb-0">
                    <h3 class="font-semibold text-sm uppercase text-slate-800 px-3 mb-3">
                      {section.heading}
                    </h3>
                    <div class="grid grid-cols-2 gap-3">
                      {#each section.items as item}
                        <a
                          href={item.href}
                          class="flex items-center space-x-4 px-3 py-2 hover:bg-gray-50 rounded-lg"
                        >
                          <img 
                            src={item.icon} 
                            alt="" 
                            class="w-6 h-6"
                          />
                          <span class="text-slate-900 font-bold text-base">{item.name}</span>
                        </a>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>

          <!-- Resources Dropdown -->
          <div class="relative group">
            <button class="font-semibold text-slate-950 hover:text-slate-600 px-3 py-2">
              Resources
            </button>
            <div class="absolute left-0 mt-2 w-[600px] rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div class="p-6">
                <div class="grid grid-cols-2 gap-3">
                  {#each navigationItems.resources as item}
                    <a
                      href={item.href}
                      class="flex items-center space-x-4 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <img 
                        src={item.icon} 
                        alt="" 
                        class="w-6 h-6"
                      />
                      <span class="text-slate-900 font-bold text-base">{item.name}</span>
                    </a>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Navigation - Right Side -->
      <div class="hidden md:flex items-center space-x-4">
        <Button type="primary" href="/contact">Contact Sales</Button>
      </div>
    </div>
  </div>

  <!-- Mobile Navigation Menu -->
  {#if isOpen}
    <div 
      transition:fade={{ duration: 200 }}
      class="md:hidden fixed inset-0 bg-slate-900/80 backdrop-blur-sm mobile-menu"
    >
      <!-- Close button positioned at the top-right -->
      <div class="absolute top-4 right-4">
        <button
          on:click={toggleMobileMenu}
          class="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <!-- Menu content -->
      <div class="px-4 pt-16 pb-6 space-y-6">
        <!-- Mobile Products Menu -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-3">Products</h3>
          <div class="space-y-2">
            {#each navigationItems.products as product}
              <a
                href={product.href}
                class="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg"
              >
                <img 
                  src={product.icon} 
                  alt="" 
                  class="w-6 h-6 mt-1"
                />
                <div>
                  <div class="font-medium text-gray-900">{product.name}</div>
                  <p class="text-sm text-gray-500">{product.description}</p>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <!-- Mobile Solutions Menu -->
        <div>
          <h3 class="text-lg font-semibold text-white mb-3">Solutions</h3>
          <div class="space-y-2">
            {#each navigationItems.solutions as section}
              <div class="mb-6 last:mb-0">
                <h3 class="font-semibold text-gray-900 px-3 mb-2">
                  {section.heading}
                </h3>
                <div class="space-y-1">
                  {#each section.items as item}
                    <a
                      href={item.href}
                      class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                    >
                      <img 
                        src={item.icon} 
                        alt="" 
                        class="w-5 h-5"
                      />
                      <span class="text-gray-700">{item.name}</span>
                    </a>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <Button type="ghost" href="/login">Login</Button>
        <Button type="primary" href="/contact">Contact Sales</Button>
      </div>
    </div>
  {/if}
</nav>