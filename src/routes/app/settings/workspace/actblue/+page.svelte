<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  import {
    fetchActBlueConfig,
    createActBlueConfig,
    updateActBlueConfig,
    testWebhookCredentials,
    getWebhookUrl
  } from '$lib/services/actblueConfigService';

  import {
    fetchCsvImports,
    requestCsvExport,
    checkCsvStatus,
    importCsv,
    formatCsvType,
    formatImportStatus,
    getImportStatusColor,
    calculateImportProgress
  } from '$lib/services/actblueCsvService';

  import type { ActBlueConfig, ActBlueImport } from '$lib/types/actblue';

  // State
  const isLoading = writable(false);
  const config = writable<ActBlueConfig | null>(null);
  const webhookUrl = writable<string>('');

  // Form state
  const formData = writable({
    apiKey: '',
    webhookUsername: '',
    webhookPassword: '',
    isWebhookEnabled: true,
    isCsvImportEnabled: false
  });

  const formErrors = writable<Record<string, string>>({});
  const isSaving = writable(false);
  const isTesting = writable(false);
  const testPassword = writable('');

  // CSV Import state
  const imports = writable<ActBlueImport[]>([]);
  const isLoadingImports = writable(false);
  const showCsvModal = writable(false);
  const csvFormData = writable({
    csvType: 'paid_contributions' as any,
    dateRangeStart: '',
    dateRangeEnd: ''
  });
  const isRequesting = writable(false);

  // Load configuration
  async function loadConfig() {
    if (!$workspaceStore.currentWorkspace) return;

    isLoading.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const configData = await fetchActBlueConfig($workspaceStore.currentWorkspace.id, token);

      if (configData) {
        config.set(configData);
        formData.set({
          apiKey: configData.apiKey || '',
          webhookUsername: configData.webhookUsername,
          webhookPassword: '', // Never populate password from server
          isWebhookEnabled: configData.isWebhookEnabled,
          isCsvImportEnabled: configData.isCsvImportEnabled
        });

        // Get webhook URL
        const url = await getWebhookUrl(
          $workspaceStore.currentWorkspace.id,
          window.location.origin,
          token
        );
        webhookUrl.set(url);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        // No config exists yet
        config.set(null);
      } else {
        console.error('Error loading config:', err);
        toastStore.error('Failed to load ActBlue configuration');
      }
    } finally {
      isLoading.set(false);
    }
  }

  // Load CSV imports
  async function loadImports() {
    if (!$workspaceStore.currentWorkspace) return;

    isLoadingImports.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const importsList = await fetchCsvImports($workspaceStore.currentWorkspace.id, token);
      imports.set(importsList);
    } catch (err) {
      console.error('Error loading imports:', err);
    } finally {
      isLoadingImports.set(false);
    }
  }

  // Validate form
  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!$formData.webhookUsername.trim()) {
      errors.webhookUsername = 'Webhook username is required';
    }

    if (!$config && !$formData.webhookPassword.trim()) {
      errors.webhookPassword = 'Webhook password is required for initial setup';
    }

    if ($formData.webhookPassword && $formData.webhookPassword.length < 8) {
      errors.webhookPassword = 'Password must be at least 8 characters';
    }

    formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  // Save configuration
  async function handleSave() {
    if (!validateForm()) return;
    if (!$workspaceStore.currentWorkspace) return;

    isSaving.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const configData: any = {
        webhookUsername: $formData.webhookUsername.trim(),
        isWebhookEnabled: $formData.isWebhookEnabled,
        isCsvImportEnabled: $formData.isCsvImportEnabled
      };

      if ($formData.apiKey.trim()) {
        configData.apiKey = $formData.apiKey.trim();
      }

      if ($formData.webhookPassword.trim()) {
        configData.webhookPassword = $formData.webhookPassword;
      }

      if ($config) {
        await updateActBlueConfig($workspaceStore.currentWorkspace.id, configData, token);
        toastStore.success('ActBlue configuration updated');
      } else {
        await createActBlueConfig($workspaceStore.currentWorkspace.id, configData, token);
        toastStore.success('ActBlue configuration created');
      }

      // Clear password field
      formData.update(f => ({ ...f, webhookPassword: '' }));

      await loadConfig();
    } catch (err) {
      console.error('Error saving config:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      isSaving.set(false);
    }
  }

  // Test credentials
  async function handleTestCredentials() {
    if (!$workspaceStore.currentWorkspace || !$testPassword.trim()) {
      toastStore.error('Please enter a password to test');
      return;
    }

    isTesting.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const result = await testWebhookCredentials(
        $workspaceStore.currentWorkspace.id,
        $testPassword,
        token
      );

      if (result.valid) {
        toastStore.success('Credentials are valid!');
      } else {
        toastStore.error('Invalid credentials');
      }

      testPassword.set('');
    } catch (err) {
      console.error('Error testing credentials:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to test credentials');
    } finally {
      isTesting.set(false);
    }
  }

  // Copy webhook URL
  function copyWebhookUrl() {
    navigator.clipboard.writeText($webhookUrl);
    toastStore.success('Webhook URL copied to clipboard');
  }

  // Request CSV export
  async function handleRequestCsv() {
    if (!$workspaceStore.currentWorkspace) return;

    if (!$csvFormData.dateRangeStart || !$csvFormData.dateRangeEnd) {
      toastStore.error('Please select date range');
      return;
    }

    isRequesting.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const result = await requestCsvExport(
        $workspaceStore.currentWorkspace.id,
        $csvFormData.csvType,
        $csvFormData.dateRangeStart,
        $csvFormData.dateRangeEnd,
        token
      );

      toastStore.success('CSV export requested. Check back in a few minutes.');
      showCsvModal.set(false);
      await loadImports();
    } catch (err) {
      console.error('Error requesting CSV:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to request CSV');
    } finally {
      isRequesting.set(false);
    }
  }

  // Format date for display
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Load on mount
  $: if ($workspaceStore.currentWorkspace) {
    loadConfig();
    loadImports();
  }
</script>

<svelte:head>
  <title>ActBlue Settings | Civics Lab</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
  <div class="md:flex md:items-center md:justify-between mb-6">
    <div class="flex-1 min-w-0">
      <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
        ActBlue Integration
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        Configure ActBlue webhook and CSV import settings
      </p>
    </div>
  </div>

  {#if $isLoading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <!-- Webhook Configuration -->
    <div class="bg-white shadow sm:rounded-lg mb-6">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h2>

        <form on:submit|preventDefault={handleSave}>
          <!-- Webhook Username -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Webhook Username <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={$formData.webhookUsername}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="actblue_webhook_user"
            />
            {#if $formErrors.webhookUsername}
              <p class="text-red-500 text-xs mt-1">{$formErrors.webhookUsername}</p>
            {/if}
          </div>

          <!-- Webhook Password -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Webhook Password {!$config ? '(required for initial setup)' : '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              bind:value={$formData.webhookPassword}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {#if $formErrors.webhookPassword}
              <p class="text-red-500 text-xs mt-1">{$formErrors.webhookPassword}</p>
            {/if}
            <p class="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <!-- API Key (for CSV import) -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              ActBlue API Key (for CSV import)
            </label>
            <input
              type="password"
              bind:value={$formData.apiKey}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••••••••••"
            />
            <p class="text-xs text-gray-500 mt-1">Required for CSV import functionality</p>
          </div>

          <!-- Enable/Disable toggles -->
          <div class="mb-4 space-y-2">
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={$formData.isWebhookEnabled}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Enable webhook endpoint</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={$formData.isCsvImportEnabled}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Enable CSV import (requires API key)</span>
            </label>
          </div>

          <!-- Save Button -->
          <button
            type="submit"
            disabled={$isSaving}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {#if $isSaving}
              <LoadingSpinner size="sm" color="white" />
              <span>Saving...</span>
            {:else}
              <span>Save Configuration</span>
            {/if}
          </button>
        </form>

        <!-- Webhook URL -->
        {#if $config && $webhookUrl}
          <div class="mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-sm font-medium text-gray-900 mb-2">Webhook URL</h3>
            <div class="flex gap-2">
              <input
                type="text"
                value={$webhookUrl}
                readonly
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                on:click={copyWebhookUrl}
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Copy
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Use this URL in your ActBlue dashboard webhook settings with Basic Authentication
            </p>
          </div>
        {/if}

        <!-- Test Credentials -->
        {#if $config}
          <div class="mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-sm font-medium text-gray-900 mb-2">Test Credentials</h3>
            <div class="flex gap-2">
              <input
                type="password"
                bind:value={$testPassword}
                placeholder="Enter password to test"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                on:click={handleTestCredentials}
                disabled={$isTesting || !$testPassword}
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {#if $isTesting}
                  <LoadingSpinner size="sm" color="white" />
                  <span>Testing...</span>
                {:else}
                  <span>Test</span>
                {/if}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- CSV Import History -->
    {#if $config && $formData.isCsvImportEnabled}
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-medium text-gray-900">CSV Import History</h2>
            <button
              on:click={() => showCsvModal.set(true)}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Request CSV Export
            </button>
          </div>

          {#if $isLoadingImports}
            <div class="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          {:else if $imports.length === 0}
            <p class="text-sm text-gray-500 text-center py-8">No CSV imports yet</p>
          {:else}
            <div class="space-y-3">
              {#each $imports as importRecord}
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {formatCsvType(importRecord.csvType || 'paid_contributions')}
                      </p>
                      {#if importRecord.dateRangeStart && importRecord.dateRangeEnd}
                        <p class="text-xs text-gray-500">
                          {new Date(importRecord.dateRangeStart).toLocaleDateString()} -
                          {new Date(importRecord.dateRangeEnd).toLocaleDateString()}
                        </p>
                      {/if}
                      <p class="text-xs text-gray-500 mt-1">
                        Started: {formatDate(importRecord.createdAt)}
                      </p>
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-{getImportStatusColor(importRecord.status)}-100 text-{getImportStatusColor(importRecord.status)}-800">
                      {formatImportStatus(importRecord.status)}
                    </span>
                  </div>

                  {#if importRecord.status === 'processing' || importRecord.status === 'completed'}
                    <div class="mt-3">
                      <div class="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{importRecord.processedRecords} / {importRecord.totalRecords} records</span>
                        <span>{calculateImportProgress(importRecord)}%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-blue-600 h-2 rounded-full"
                          style="width: {calculateImportProgress(importRecord)}%"
                        />
                      </div>
                    </div>
                  {/if}

                  {#if importRecord.status === 'completed'}
                    <div class="mt-2 text-xs text-gray-600">
                      <span class="text-green-600">✓ {importRecord.successfulRecords} successful</span>
                      {#if importRecord.failedRecords > 0}
                        <span class="ml-2 text-red-600">✗ {importRecord.failedRecords} failed</span>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- CSV Request Modal -->
{#if $showCsvModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Request CSV Export</h2>

      <form on:submit|preventDefault={handleRequestCsv}>
        <!-- CSV Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            CSV Type
          </label>
          <select
            bind:value={$csvFormData.csvType}
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="paid_contributions">Paid Contributions</option>
            <option value="refunded_contributions">Refunded Contributions</option>
            <option value="cancelled_recurring_contributions">Cancelled Recurring</option>
            <option value="managed_form_contributions">Managed Form Contributions</option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            bind:value={$csvFormData.dateRangeStart}
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            bind:value={$csvFormData.dateRangeEnd}
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            on:click={() => showCsvModal.set(false)}
            disabled={$isRequesting}
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={$isRequesting}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {#if $isRequesting}
              <LoadingSpinner size="sm" color="white" />
              <span>Requesting...</span>
            {:else}
              <span>Request Export</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
