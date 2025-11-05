<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>Financial Dashboard - Super Admin</title>
</svelte:head>

<div class="p-6">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
    <p class="mt-1 text-sm text-gray-600">
      Platform-wide financial overview and transaction management
    </p>
  </div>

  <!-- Overview Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <!-- Total Processed -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Total Processed</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        {formatCurrency(data.overview.totalProcessed || 0)}
      </p>
      <p class="text-xs text-gray-500 mt-1">All time</p>
    </div>

    <!-- Platform Fees -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Platform Fees</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-green-600">
        {formatCurrency(data.overview.totalPlatformFees || 0)}
      </p>
      <p class="text-xs text-gray-500 mt-1">Revenue earned</p>
    </div>

    <!-- Stripe Fees -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Stripe Fees</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        {formatCurrency(data.overview.totalStripeFees || 0)}
      </p>
      <p class="text-xs text-gray-500 mt-1">Processing costs</p>
    </div>

    <!-- Active Workspaces -->
    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-medium text-gray-600">Active Workspaces</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        {data.overview.activeWorkspaces || 0}
      </p>
      <p class="text-xs text-gray-500 mt-1">With transactions</p>
    </div>
  </div>

  <!-- Quick Links -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <a
      href="/app/admin/financial/transactions"
      class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-600 transition-colors"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-900">All Transactions</h3>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      <p class="text-sm text-gray-600">
        View and filter all platform transactions by workspace, date, and status
      </p>
    </a>

    <a
      href="/app/admin/financial/payouts"
      class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-600 transition-colors"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-900">Manage Payouts</h3>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      <p class="text-sm text-gray-600">
        Create and track payouts to workspace Stripe accounts
      </p>
    </a>

    <a
      href="/app/admin/financial/reports"
      class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-600 transition-colors"
    >
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-900">Financial Reports</h3>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      <p class="text-sm text-gray-600">
        Generate monthly and annual financial reports for accounting
      </p>
    </a>
  </div>

  <!-- Recent Transactions -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Recent Transactions</h2>
      <a
        href="/app/admin/financial/transactions"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        View All →
      </a>
    </div>

    {#if data.recentTransactions.length === 0}
      <div class="p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600">No transactions yet</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Workspace
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stripe Fee
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Platform Fee
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Net
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each data.recentTransactions as transaction}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.workspaceName || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                    {transaction.type}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatCurrency(transaction.stripeFee)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                  {formatCurrency(transaction.platformFee)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.netAmount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded capitalize">
                    {transaction.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
