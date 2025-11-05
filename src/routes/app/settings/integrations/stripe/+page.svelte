<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let publishableKey = data.config?.publishableKey || '';
  let secretKey = data.config?.secretKey || '';
  let webhookSecret = data.config?.webhookSecret || '';
  let platformFeePercentage = data.config?.platformFeePercentage || 0;
  let isActive = data.config?.isActive ?? true;

  let showSecretKey = false;
  let showWebhookSecret = false;
  let isSaving = false;
  let isTesting = false;
  let testResult: { success: boolean; message: string } | null = null;

  async function handleSave() {
    isSaving = true;
    testResult = null;

    try {
      const method = data.config ? 'PUT' : 'POST';
      const url = data.config
        ? `/api/stripe/config?workspace_id=${data.currentWorkspace.id}`
        : '/api/stripe/config';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          workspaceId: data.currentWorkspace.id,
          publishableKey,
          secretKey,
          webhookSecret,
          platformFeePercentage,
          isActive
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save Stripe configuration');
      }

      alert('Stripe configuration saved successfully!');
      goto('/app/settings');
    } catch (error: any) {
      console.error('Error saving Stripe config:', error);
      alert(error.message || 'Failed to save Stripe configuration. Please try again.');
    } finally {
      isSaving = false;
    }
  }

  async function handleTest() {
    if (!data.config) {
      alert('Please save your configuration before testing');
      return;
    }

    isTesting = true;
    testResult = null;

    try {
      const response = await fetch(`/api/stripe/config/test?workspace_id=${data.currentWorkspace.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        testResult = {
          success: true,
          message: 'Connection successful! Your Stripe account is properly configured.'
        };
      } else {
        testResult = {
          success: false,
          message: result.message || 'Connection failed. Please check your API keys.'
        };
      }
    } catch (error) {
      console.error('Error testing Stripe connection:', error);
      testResult = {
        success: false,
        message: 'Connection test failed. Please check your API keys and try again.'
      };
    } finally {
      isTesting = false;
    }
  }

  function handleCancel() {
    goto('/app/settings');
  }
</script>

<svelte:head>
  <title>Stripe Configuration - Settings</title>
</svelte:head>

<div class="p-6">
  <!-- Header -->
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      <h1 class="text-2xl font-bold text-gray-900">Stripe Configuration</h1>
    </div>
    <p class="text-sm text-gray-600">
      Configure your Stripe account to accept payments through forms
    </p>
  </div>

  <!-- Info Banner -->
  <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p class="text-sm font-medium text-blue-900">Getting Started with Stripe</p>
        <p class="text-xs text-blue-700 mt-1">
          You'll need to create a Stripe account at <a href="https://stripe.com" target="_blank" class="underline">stripe.com</a>.
          Then, get your API keys from the Stripe Dashboard under Developers → API keys.
        </p>
      </div>
    </div>
  </div>

  <!-- Configuration Form -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">API Keys</h2>
    </div>

    <form on:submit|preventDefault={handleSave} class="p-6 space-y-6">
      <!-- Publishable Key -->
      <div>
        <label for="publishableKey" class="block text-sm font-medium text-gray-700 mb-1">
          Publishable Key <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="publishableKey"
          bind:value={publishableKey}
          required
          placeholder="pk_test_..."
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
        <p class="mt-1 text-xs text-gray-500">
          Your public key (safe to use in client-side code)
        </p>
      </div>

      <!-- Secret Key -->
      <div>
        <label for="secretKey" class="block text-sm font-medium text-gray-700 mb-1">
          Secret Key <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            type={showSecretKey ? 'text' : 'password'}
            id="secretKey"
            bind:value={secretKey}
            required
            placeholder="sk_test_..."
            class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
          <button
            type="button"
            on:click={() => (showSecretKey = !showSecretKey)}
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {#if showSecretKey}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Your secret key (keep this secure, never expose in client code)
        </p>
      </div>

      <!-- Webhook Secret -->
      <div>
        <label for="webhookSecret" class="block text-sm font-medium text-gray-700 mb-1">
          Webhook Signing Secret <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            type={showWebhookSecret ? 'text' : 'password'}
            id="webhookSecret"
            bind:value={webhookSecret}
            required
            placeholder="whsec_..."
            class="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
          <button
            type="button"
            on:click={() => (showWebhookSecret = !showWebhookSecret)}
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {#if showWebhookSecret}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Used to verify webhook events from Stripe
        </p>
      </div>

      <!-- Platform Fee -->
      <div>
        <label for="platformFee" class="block text-sm font-medium text-gray-700 mb-1">
          Platform Fee Percentage (%)
        </label>
        <input
          type="number"
          id="platformFee"
          bind:value={platformFeePercentage}
          min="0"
          max="100"
          step="0.1"
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <p class="mt-1 text-xs text-gray-500">
          Additional fee to charge on top of Stripe's standard 2.9% + $0.30 (0 for no platform fee)
        </p>
      </div>

      <!-- Active Status -->
      <div class="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          bind:checked={isActive}
          class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label for="isActive" class="text-sm font-medium text-gray-700">
          Enable Stripe payments
        </label>
      </div>

      <!-- Test Result -->
      {#if testResult}
        <div class="p-4 rounded-lg {testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
          <div class="flex items-start gap-3">
            {#if testResult.success}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {/if}
            <p class="text-sm {testResult.success ? 'text-green-800' : 'text-red-800'}">
              {testResult.message}
            </p>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-200">
        <div>
          {#if data.config}
            <button
              type="button"
              on:click={handleTest}
              disabled={isTesting}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if isTesting}
                Testing...
              {:else}
                Test Connection
              {/if}
            </button>
          {/if}
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            on:click={handleCancel}
            class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isSaving}
              Saving...
            {:else}
              {data.config ? 'Update Configuration' : 'Save Configuration'}
            {/if}
          </button>
        </div>
      </div>
    </form>
  </div>

  <!-- Webhook Instructions -->
  <div class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Webhook Setup</h3>
    <p class="text-sm text-gray-600 mb-3">
      To receive payment updates automatically, configure a webhook endpoint in your Stripe Dashboard:
    </p>
    <ol class="list-decimal list-inside space-y-2 text-sm text-gray-600">
      <li>Go to Stripe Dashboard → Developers → Webhooks</li>
      <li>Click "Add endpoint"</li>
      <li>
        Enter your webhook URL:
        <code class="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
          {window.location.origin}/api/stripe/webhook
        </code>
      </li>
      <li>Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded</li>
      <li>Copy the signing secret and paste it above</li>
    </ol>
  </div>
</div>
