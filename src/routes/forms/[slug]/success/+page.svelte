<script lang="ts">
  import FormHeader from '$lib/components/forms/public/FormHeader.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  function getTypeLabel(): string {
    if (data.form.type === 'donation') return 'donation';
    if (data.form.type === 'product') return 'purchase';
    if (data.form.type === 'subscription') return 'subscription';
    return 'contribution';
  }

  function downloadReceipt() {
    // TODO: Implement receipt download
    alert('Receipt download coming soon!');
  }
</script>

<svelte:head>
  <title>Thank You - {data.form.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4">
  <div class="max-w-3xl mx-auto">
    <!-- Form Header -->
    <FormHeader
      logoUrl={data.form.logoUrl}
      workspaceName={data.workspace.name}
      formName={data.form.name}
    />

    <!-- Success Message -->
    <div class="bg-white rounded-lg shadow-sm p-8 mt-8">
      <div class="text-center">
        <div class="flex justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>

        <p class="text-lg text-gray-600 mb-8">
          Your {getTypeLabel()} has been successfully processed.
        </p>

        <!-- Amount Summary -->
        <div class="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Amount</span>
            <span class="text-2xl font-bold text-gray-900">
              ${((data.submission.amount || 0) / 100).toFixed(2)}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>Confirmation ID</span>
            <span class="font-mono">{data.submission.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        <!-- Email Confirmation Notice -->
        <div class="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-8 text-left max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-blue-900">Receipt Sent</p>
            <p class="text-xs text-blue-700 mt-1">
              A confirmation email has been sent to your email address with the details of your {getTypeLabel()}.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            on:click={downloadReceipt}
            class="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="inline h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt
          </button>

          <a
            href="/"
            class="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="inline h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return Home
          </a>
        </div>
      </div>

      <!-- Additional Information for Subscriptions -->
      {#if data.form.type === 'subscription'}
        <div class="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-3">Subscription Details</h3>
          <p class="text-sm text-gray-600 mb-4">
            Your monthly subscription is now active. You will be charged ${((data.submission.amount || 0) / 100).toFixed(2)} on the same day each month.
          </p>
          <p class="text-sm text-gray-600">
            You can manage your subscription, update payment information, or cancel at any time from your donor portal.
          </p>
        </div>
      {/if}

      <!-- Social Sharing (Optional) -->
      <div class="mt-8 pt-8 border-t border-gray-200">
        <p class="text-sm text-gray-600 text-center">
          Help us spread the word about {data.workspace.name}!
        </p>
      </div>
    </div>
  </div>
</div>
