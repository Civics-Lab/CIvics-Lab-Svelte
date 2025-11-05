<script lang="ts">
  import type { FormType } from '$lib/types/form';

  export let formType: FormType;
  export let linkedItem: any;
  export let onComplete: (info: any) => void;

  let firstName = '';
  let lastName = '';
  let email = '';
  let phone = '';
  let address = '';
  let city = '';
  let state = '';
  let zipCode = '';
  let amount = linkedItem?.price || linkedItem?.amount || 0;
  let customAmount = '';
  let selectedAmount: number | null = null;

  // Preset amounts for donations
  const presetAmounts = [2500, 5000, 10000, 25000, 50000]; // in cents

  function selectPresetAmount(preset: number) {
    selectedAmount = preset;
    amount = preset;
    customAmount = '';
  }

  function handleCustomAmount(value: string) {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      amount = Math.round(numValue * 100); // Convert to cents
      selectedAmount = null;
    }
  }

  function handleSubmit() {
    // Validate required fields
    if (!firstName || !lastName || !email) {
      alert('Please fill in all required fields');
      return;
    }

    if (formType === 'donation' && amount <= 0) {
      alert('Please enter a donation amount');
      return;
    }

    onComplete({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      amount: formType === 'donation' ? amount : linkedItem?.price || linkedItem?.amount || 0
    });
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-4">
  <!-- Amount selection for donations -->
  {#if formType === 'donation'}
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Donation Amount
      </label>

      <!-- Preset amounts -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        {#each presetAmounts as preset}
          <button
            type="button"
            on:click={() => selectPresetAmount(preset)}
            class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors {selectedAmount ===
            preset
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'}"
          >
            ${(preset / 100).toFixed(0)}
          </button>
        {/each}
      </div>

      <!-- Custom amount -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <input
          type="number"
          step="0.01"
          min="1"
          bind:value={customAmount}
          on:input={(e) => handleCustomAmount(e.currentTarget.value)}
          placeholder="Custom amount"
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  {/if}

  <!-- Product/Subscription amount display -->
  {#if formType === 'product' || formType === 'subscription'}
    <div class="mb-6 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">
          {formType === 'product' ? 'Price' : 'Monthly Amount'}
        </span>
        <span class="text-2xl font-bold text-gray-900">
          ${((linkedItem?.price || linkedItem?.amount || 0) / 100).toFixed(2)}
        </span>
      </div>
      {#if linkedItem?.name}
        <p class="text-sm text-gray-600 mt-1">{linkedItem.name}</p>
      {/if}
    </div>
  {/if}

  <!-- Contact Information -->
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
        First Name <span class="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="firstName"
        bind:value={firstName}
        required
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div>
      <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
        Last Name <span class="text-red-500">*</span>
      </label>
      <input
        type="text"
        id="lastName"
        bind:value={lastName}
        required
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>

  <div>
    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
      Email <span class="text-red-500">*</span>
    </label>
    <input
      type="email"
      id="email"
      bind:value={email}
      required
      class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div>
    <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
      Phone
    </label>
    <input
      type="tel"
      id="phone"
      bind:value={phone}
      class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div>
    <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
      Address
    </label>
    <input
      type="text"
      id="address"
      bind:value={address}
      class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="col-span-1">
      <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
        City
      </label>
      <input
        type="text"
        id="city"
        bind:value={city}
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div>
      <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
        State
      </label>
      <input
        type="text"
        id="state"
        bind:value={state}
        maxlength="2"
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <div>
      <label for="zipCode" class="block text-sm font-medium text-gray-700 mb-1">
        ZIP
      </label>
      <input
        type="text"
        id="zipCode"
        bind:value={zipCode}
        class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>

  <button
    type="submit"
    class="w-full px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
  >
    Continue to Payment
  </button>
</form>
