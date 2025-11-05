<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusBadgeClass(status: string): string {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'canceled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }
</script>

<svelte:head>
  <title>Donor Portal - Dashboard</title>
</svelte:head>

<div>
  <!-- Welcome Message -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">
      Welcome back, {data.contact?.firstName || 'Donor'}!
    </h1>
    <p class="mt-1 text-sm text-gray-600">
      Thank you for your continued support. Here's a summary of your contributions.
    </p>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Total Contributed -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Total Contributed</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        ${((data.summary.totalContributed || 0) / 100).toFixed(2)}
      </p>
      <p class="text-xs text-gray-500 mt-1">All time</p>
    </div>

    <!-- Contributions Count -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Contributions</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        {data.summary.contributionCount || 0}
      </p>
      <p class="text-xs text-gray-500 mt-1">Total count</p>
    </div>

    <!-- Active Subscriptions -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Active Subscriptions</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        {data.activeSubscriptions.length}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        ${((data.summary.monthlyRecurring || 0) / 100).toFixed(2)}/month
      </p>
    </div>
  </div>

  <!-- Recent Contributions -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
    <div class="px-6 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">Recent Contributions</h2>
    </div>

    {#if data.recentContributions.length === 0}
      <div class="p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <p class="text-gray-600">No contributions yet</p>
        <p class="text-sm text-gray-500 mt-1">
          Your contributions will appear here once you make your first donation
        </p>
      </div>
    {:else}
      <div class="divide-y divide-gray-200">
        {#each data.recentContributions as contribution}
          <div class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-3">
                  <p class="text-sm font-medium text-gray-900">
                    ${((contribution.amount || 0) / 100).toFixed(2)}
                  </p>
                  {#if contribution.type}
                    <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {contribution.type}
                    </span>
                  {/if}
                </div>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(contribution.createdAt)}
                </div>
                {#if contribution.formName}
                  <p class="text-xs text-gray-500 mt-1">
                    Via: {contribution.formName}
                  </p>
                {/if}
              </div>

              {#if contribution.formSlug}
                <a
                  href="/forms/{contribution.formSlug}"
                  class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Donate Again
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <a
          href="/donors/contributions"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Contributions →
        </a>
      </div>
    {/if}
  </div>

  <!-- Active Subscriptions -->
  {#if data.activeSubscriptions.length > 0}
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Active Subscriptions</h2>
      </div>

      <div class="divide-y divide-gray-200">
        {#each data.activeSubscriptions as subscription}
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-3">
                  <p class="text-sm font-medium text-gray-900">
                    ${((subscription.amount || 0) / 100).toFixed(2)}/month
                  </p>
                  <span class="px-2 py-1 text-xs font-medium {getStatusBadgeClass(subscription.status)} rounded">
                    {subscription.status}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  Started {formatDate(subscription.startDate)}
                </p>
              </div>

              <a
                href="/donors/subscriptions"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                Manage
              </a>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
