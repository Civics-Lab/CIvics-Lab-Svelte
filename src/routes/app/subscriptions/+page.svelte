<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  import {
    fetchSubscriptions,
    fetchSubscriptionWithDetails,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    formatSubscriptionStatus,
    getStatusBadgeColor,
    calculateSubscriptionRevenue
  } from '$lib/services/subscriptionService';

  import { formatProductAmount } from '$lib/services/productService';

  import type { Subscription, SubscriptionWithDetails } from '$lib/types/subscription';

  // State
  const subscriptions = writable<Subscription[]>([]);
  const isLoading = writable(false);
  const error = writable<string | null>(null);
  const statusFilter = writable<string>('all');

  // Details modal state
  const isDetailsModalOpen = writable(false);
  const selectedSubscription = writable<SubscriptionWithDetails | null>(null);
  const isLoadingDetails = writable(false);

  // Cancel modal state
  const isCancelModalOpen = writable(false);
  const cancelReason = writable('');
  const isProcessing = writable(false);

  // Stats
  const stats = writable({
    total: 0,
    active: 0,
    canceled: 0,
    paused: 0,
    monthlyRevenue: 0
  });

  // Fetch subscriptions
  async function loadSubscriptions() {
    if (!$workspaceStore.currentWorkspace) return;

    isLoading.set(true);
    error.set(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const subscriptionsList = await fetchSubscriptions(
        $workspaceStore.currentWorkspace.id,
        token
      );

      subscriptions.set(subscriptionsList);

      // Calculate stats
      const total = subscriptionsList.length;
      const active = subscriptionsList.filter(s => s.status === 'active').length;
      const canceled = subscriptionsList.filter(s => s.status === 'canceled').length;
      const paused = subscriptionsList.filter(s => s.status === 'paused').length;

      // Calculate monthly revenue from active subscriptions
      const monthlyRevenue = subscriptionsList
        .filter(s => s.status === 'active' && s.billingPeriod === 'monthly')
        .reduce((sum, s) => sum + s.amount, 0);

      stats.set({ total, active, canceled, paused, monthlyRevenue });
    } catch (err) {
      console.error('Error loading subscriptions:', err);
      error.set(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      isLoading.set(false);
    }
  }

  // Open details modal
  async function handleViewDetails(subscription: Subscription) {
    isDetailsModalOpen.set(true);
    isLoadingDetails.set(true);
    selectedSubscription.set(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const details = await fetchSubscriptionWithDetails(subscription.id, token);
      selectedSubscription.set(details);
    } catch (err) {
      console.error('Error loading subscription details:', err);
      toastStore.error('Failed to load subscription details');
      isDetailsModalOpen.set(false);
    } finally {
      isLoadingDetails.set(false);
    }
  }

  // Open cancel modal
  function handleCancelClick(subscription: Subscription) {
    selectedSubscription.set(subscription as any);
    cancelReason.set('');
    isCancelModalOpen.set(true);
  }

  // Cancel subscription
  async function handleCancelConfirm() {
    if (!$selectedSubscription) return;

    isProcessing.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await cancelSubscription(
        $selectedSubscription.id,
        $cancelReason.trim() || undefined,
        token
      );

      toastStore.success('Subscription canceled successfully');
      isCancelModalOpen.set(false);
      cancelReason.set('');
      selectedSubscription.set(null);
      await loadSubscriptions();
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      isProcessing.set(false);
    }
  }

  // Pause subscription
  async function handlePause(subscription: Subscription) {
    if (!confirm(`Pause subscription for ${subscription.contact?.firstName} ${subscription.contact?.lastName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await pauseSubscription(subscription.id, token);
      toastStore.success('Subscription paused successfully');
      await loadSubscriptions();
    } catch (err) {
      console.error('Error pausing subscription:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to pause subscription');
    }
  }

  // Resume subscription
  async function handleResume(subscription: Subscription) {
    if (!confirm(`Resume subscription for ${subscription.contact?.firstName} ${subscription.contact?.lastName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await resumeSubscription(subscription.id, token);
      toastStore.success('Subscription resumed successfully');
      await loadSubscriptions();
    } catch (err) {
      console.error('Error resuming subscription:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to resume subscription');
    }
  }

  // Format date
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Get billing period text
  function getBillingPeriodText(period: string): string {
    const map: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      one_time: 'One-time'
    };
    return map[period] || period;
  }

  // Get status color
  function getStatusColor(status: string): string {
    const map: Record<string, string> = {
      active: 'green',
      canceled: 'gray',
      paused: 'yellow',
      failed: 'red',
      pending: 'blue'
    };
    return map[status] || 'gray';
  }

  // Filter subscriptions
  $: filteredSubscriptions = $statusFilter === 'all'
    ? $subscriptions
    : $subscriptions.filter(s => s.status === $statusFilter);

  // Load subscriptions on workspace change
  $: if ($workspaceStore.currentWorkspace) {
    loadSubscriptions();
  }
</script>

<svelte:head>
  <title>Subscriptions | Civics Lab</title>
</svelte:head>

<div class="h-full flex flex-col bg-gray-50">
  {#if $workspaceStore.isLoading}
    <div class="flex-1 flex justify-center items-center">
      <LoadingSpinner size="lg" />
    </div>
  {:else if !$workspaceStore.currentWorkspace}
    <div class="bg-white p-8 rounded-lg shadow-md m-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">No Workspace Selected</h2>
      <p class="text-gray-600">
        Please select a workspace from the dropdown in the sidebar to continue.
      </p>
    </div>
  {:else}
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Subscriptions</h1>
          <p class="text-sm text-gray-500 mt-1">Manage recurring donations and subscriptions</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-xs text-gray-500 uppercase">Total</p>
          <p class="text-2xl font-semibold text-gray-900">{$stats.total}</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-xs text-green-600 uppercase">Active</p>
          <p class="text-2xl font-semibold text-green-600">{$stats.active}</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-xs text-yellow-600 uppercase">Paused</p>
          <p class="text-2xl font-semibold text-yellow-600">{$stats.paused}</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-xs text-gray-500 uppercase">Canceled</p>
          <p class="text-2xl font-semibold text-gray-500">{$stats.canceled}</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <p class="text-xs text-blue-600 uppercase">Monthly Revenue</p>
          <p class="text-2xl font-semibold text-blue-600">{formatProductAmount($stats.monthlyRevenue)}</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="mt-4">
        <select
          bind:value={$statusFilter}
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Subscriptions</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="canceled">Canceled</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      {#if $isLoading}
        <div class="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      {:else if $error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {$error}
        </div>
      {:else if filteredSubscriptions.length === 0}
        <div class="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
          <p class="mt-1 text-sm text-gray-500">
            {$statusFilter === 'all'
              ? 'No subscriptions have been created yet.'
              : `No ${$statusFilter} subscriptions found.`}
          </p>
        </div>
      {:else}
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Billing</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredSubscriptions as subscription}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {subscription.contact?.firstName || ''} {subscription.contact?.lastName || ''}
                    </div>
                    {#if subscription.contact?.email}
                      <div class="text-sm text-gray-500">{subscription.contact.email}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatProductAmount(subscription.amount)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getBillingPeriodText(subscription.billingPeriod)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-{getStatusColor(subscription.status)}-100 text-{getStatusColor(subscription.status)}-800">
                      {formatSubscriptionStatus(subscription.status)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(subscription.startDate)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      on:click={() => handleViewDetails(subscription)}
                      class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Details
                    </button>
                    {#if subscription.status === 'active'}
                      <button
                        on:click={() => handlePause(subscription)}
                        class="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Pause
                      </button>
                      <button
                        on:click={() => handleCancelClick(subscription)}
                        class="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    {:else if subscription.status === 'paused'}
                      <button
                        on:click={() => handleResume(subscription)}
                        class="text-green-600 hover:text-green-900 mr-3"
                      >
                        Resume
                      </button>
                      <button
                        on:click={() => handleCancelClick(subscription)}
                        class="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Details Modal -->
{#if $isDetailsModalOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Subscription Details</h2>
          <button
            on:click={() => isDetailsModalOpen.set(false)}
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {#if $isLoadingDetails}
          <div class="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        {:else if $selectedSubscription}
          <div class="space-y-4">
            <!-- Contact Info -->
            <div class="border-b border-gray-200 pb-4">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Contact</h3>
              <p class="text-lg font-medium text-gray-900">
                {$selectedSubscription.contact?.firstName} {$selectedSubscription.contact?.lastName}
              </p>
              {#if $selectedSubscription.contact?.email}
                <p class="text-sm text-gray-600">{$selectedSubscription.contact.email}</p>
              {/if}
            </div>

            <!-- Subscription Info -->
            <div class="border-b border-gray-200 pb-4">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Subscription Information</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-gray-500">Amount</p>
                  <p class="text-sm font-medium">{formatProductAmount($selectedSubscription.amount)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Billing Period</p>
                  <p class="text-sm font-medium">{getBillingPeriodText($selectedSubscription.billingPeriod)}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Status</p>
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-{getStatusColor($selectedSubscription.status)}-100 text-{getStatusColor($selectedSubscription.status)}-800">
                    {formatSubscriptionStatus($selectedSubscription.status)}
                  </span>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Start Date</p>
                  <p class="text-sm font-medium">{formatDate($selectedSubscription.startDate)}</p>
                </div>
                {#if $selectedSubscription.nextBillingDate}
                  <div>
                    <p class="text-xs text-gray-500">Next Billing</p>
                    <p class="text-sm font-medium">{formatDate($selectedSubscription.nextBillingDate)}</p>
                  </div>
                {/if}
                {#if $selectedSubscription.endDate}
                  <div>
                    <p class="text-xs text-gray-500">End Date</p>
                    <p class="text-sm font-medium">{formatDate($selectedSubscription.endDate)}</p>
                  </div>
                {/if}
                {#if $selectedSubscription.recurringCompleted}
                  <div>
                    <p class="text-xs text-gray-500">Payments Completed</p>
                    <p class="text-sm font-medium">{$selectedSubscription.recurringCompleted}</p>
                  </div>
                {/if}
                {#if $selectedSubscription.product}
                  <div class="col-span-2">
                    <p class="text-xs text-gray-500">Product</p>
                    <p class="text-sm font-medium">{$selectedSubscription.product.name}</p>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Recent Donations -->
            {#if $selectedSubscription.donations && $selectedSubscription.donations.length > 0}
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-2">Recent Donations</h3>
                <div class="space-y-2">
                  {#each $selectedSubscription.donations.slice(0, 5) as donation}
                    <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <div>
                        <p class="text-sm font-medium">{formatProductAmount(donation.amount)}</p>
                        <p class="text-xs text-gray-500">{formatDate(donation.createdAt)}</p>
                      </div>
                      <span class="text-xs text-gray-600">{donation.status}</span>
                    </div>
                  {/each}
                </div>
                {#if $selectedSubscription.donations.length > 5}
                  <p class="text-xs text-gray-500 mt-2">
                    Showing 5 of {$selectedSubscription.donations.length} donations
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Cancel Modal -->
{#if $isCancelModalOpen && $selectedSubscription}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-semibold text-red-600 mb-4">Cancel Subscription?</h2>
      <p class="text-gray-700 mb-4">
        Are you sure you want to cancel this subscription? This action cannot be undone.
      </p>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Reason (optional)
        </label>
        <textarea
          bind:value={$cancelReason}
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter cancellation reason..."
        />
      </div>

      <div class="flex justify-end gap-3">
        <button
          on:click={() => isCancelModalOpen.set(false)}
          disabled={$isProcessing}
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Keep Subscription
        </button>
        <button
          on:click={handleCancelConfirm}
          disabled={$isProcessing}
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {#if $isProcessing}
            <LoadingSpinner size="sm" color="white" />
            <span>Canceling...</span>
          {:else}
            <span>Cancel Subscription</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
