<script lang="ts">
  import { onMount } from 'svelte';
  import type { FormType } from '$lib/types/form';

  export let amount: number;
  export let formType: FormType;
  export let workspaceId: string;
  export let onComplete: (payment: any) => void;
  export let onBack: () => void;
  export let disabled = false;

  let stripe: any = null;
  let elements: any = null;
  let cardElement: any = null;
  let isProcessing = false;
  let error = '';

  onMount(async () => {
    // Load Stripe.js
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = initializeStripe;
    document.head.appendChild(script);

    return () => {
      if (cardElement) {
        cardElement.destroy();
      }
    };
  });

  async function initializeStripe() {
    // Get publishable key from API
    const keyResponse = await fetch(`/api/stripe/config/${workspaceId}`);
    const { publishableKey } = await keyResponse.json();

    // Initialize Stripe
    stripe = (window as any).Stripe(publishableKey);
    elements = stripe.elements();

    // Create card element
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#374151',
          fontFamily: 'system-ui, sans-serif',
          '::placeholder': {
            color: '#9CA3AF'
          }
        },
        invalid: {
          color: '#EF4444'
        }
      }
    });

    cardElement.mount('#card-element');

    cardElement.on('change', (event: any) => {
      error = event.error ? event.error.message : '';
    });
  }

  async function handleSubmit() {
    if (!stripe || !cardElement) {
      error = 'Payment system not ready';
      return;
    }

    isProcessing = true;
    error = '';

    try {
      // Create payment intent
      const intentResponse = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          workspaceId,
          metadata: {
            formType,
            workspaceId
          }
        })
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await intentResponse.json();

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Payment successful
      onComplete({
        paymentIntentId: paymentIntent.id,
        paymentMethodId: paymentIntent.payment_method
      });
    } catch (err: any) {
      error = err.message || 'Payment failed. Please try again.';
      isProcessing = false;
    }
  }
</script>

<div>
  <!-- Amount Summary -->
  <div class="mb-6 p-4 bg-gray-50 rounded-lg">
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-gray-700">Total Amount</span>
      <span class="text-2xl font-bold text-gray-900">
        ${(amount / 100).toFixed(2)}
      </span>
    </div>
  </div>

  <!-- Card Element Container -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      Card Information
    </label>
    <div
      id="card-element"
      class="px-3 py-3 border border-gray-300 rounded-lg bg-white"
    />
  </div>

  <!-- Error Message -->
  {#if error}
    <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{error}</p>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex gap-3">
    <button
      type="button"
      on:click={onBack}
      disabled={isProcessing || disabled}
      class="flex-1 px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="inline h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back
    </button>

    <button
      type="button"
      on:click={handleSubmit}
      disabled={isProcessing || disabled || !stripe}
      class="flex-1 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isProcessing}
        Processing...
      {:else}
        Complete {formType === 'donation' ? 'Donation' : formType === 'product' ? 'Purchase' : 'Subscription'}
      {/if}
    </button>
  </div>

  <!-- Security Notice -->
  <p class="mt-4 text-xs text-gray-500 text-center">
    Your payment is securely processed by Stripe. We never store your card information.
  </p>
</div>
