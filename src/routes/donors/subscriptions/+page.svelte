<script lang="ts">
  import { invalidate } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let cancellingId: string | null = null;
  let showCancelModal = false;
  let subscriptionToCancel: any = null;

  function getStatusBadgeClass(status: string): string {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'canceled') return 'bg-red-100 text-red-800';
    if (status === 'past_due') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getNextBillingDate(subscription: any): string {
    if (subscription.status !== 'active') return 'N/A';

    const startDate = new Date(subscription.startDate);
    const now = new Date();

    // Calculate next billing date (simple monthly calculation)
    const nextDate = new Date(startDate);
    while (nextDate < now) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    return formatDate(nextDate);
  }

  function openCancelModal(subscription: any) {
    subscriptionToCancel = subscription;
    showCancelModal = true;
  }

  function closeCancelModal() {
    subscriptionToCancel = null;
    showCancelModal = false;
  }

  async function confirmCancel() {
    if (!subscriptionToCancel) return;

    cancellingId = subscriptionToCancel.id;

    try {
      const response = await fetch(`/api/donors/subscriptions/${subscriptionToCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Reload the page data
      await invalidate('/donors/subscriptions');

      closeCancelModal();
      alert('Subscription canceled successfully');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      cancellingId = null;
    }
  }
</script>

<svelte:head>
  <title>Donor Portal - Subscriptions</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">My Subscriptions</h1>
    <p class="mt-1 text-sm text-gray-600">
      Manage your recurring contributions and update payment methods
    </p>
  </div>

  <!-- Subscriptions List -->
  {#if data.subscriptions.length === 0}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      <p class="text-gray-600">No active subscriptions</p>
      <p class="text-sm text-gray-500 mt-1">
        When you set up recurring contributions, they'll appear here
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.subscriptions as subscription}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-start justify-between">
            <!-- Subscription Details -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <h3 class="text-lg font-semibold text-gray-900">
                  ${((subscription.amount || 0) / 100).toFixed(2)}/month
                </h3>
                <span class="px-2 py-1 text-xs font-medium {getStatusBadgeClass(subscription.status)} rounded capitalize">
                  {subscription.status}
                </span>
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Started: {formatDate(subscription.startDate)}
                </div>

                {#if subscription.status === 'active'}
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Next billing: {getNextBillingDate(subscription)}
                  </div>
                {/if}

                {#if subscription.endDate}
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ended: {formatDate(subscription.endDate)}
                  </div>
                {/if}

                {#if subscription.formName}
                  <p class="text-sm text-gray-600">
                    Form: {subscription.formName}
                  </p>
                {/if}

                {#if subscription.stripeSubscriptionId}
                  <p class="text-xs text-gray-500 font-mono">
                    ID: {subscription.stripeSubscriptionId.slice(0, 20)}...
                  </p>
                {/if}
              </div>
            </div>

            <!-- Actions -->
            {#if subscription.status === 'active'}
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  on:click={() => openCancelModal(subscription)}
                  disabled={cancellingId === subscription.id}
                  class="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {#if cancellingId === subscription.id}
                    Canceling...
                  {:else}
                    Cancel Subscription
                  {/if}
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Cancel Confirmation Modal -->
{#if showCancelModal && subscriptionToCancel}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="flex items-start gap-4 mb-4">
        <div class="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Cancel Subscription?
          </h3>
          <p class="text-sm text-gray-600">
            Are you sure you want to cancel this ${((subscriptionToCancel.amount || 0) / 100).toFixed(2)}/month subscription?
            You will no longer be charged, and your access will end at the end of the current billing period.
          </p>
        </div>
      </div>

      <div class="flex gap-3 justify-end">
        <button
          type="button"
          on:click={closeCancelModal}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Keep Subscription
        </button>
        <button
          type="button"
          on:click={confirmCancel}
          disabled={cancellingId !== null}
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if cancellingId}
            Canceling...
          {:else}
            Yes, Cancel
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
