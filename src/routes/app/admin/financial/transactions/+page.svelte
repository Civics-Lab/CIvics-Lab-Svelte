<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  let searchQuery = '';
  let selectedWorkspace = data.filters.workspaceId;
  let selectedStatus = data.filters.status;
  let selectedType = data.filters.type;

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (selectedWorkspace) params.set('workspace_id', selectedWorkspace);
    if (selectedStatus) params.set('status', selectedStatus);
    if (selectedType) params.set('type', selectedType);

    goto(`/app/admin/financial/transactions?${params.toString()}`);
  }

  function clearFilters() {
    selectedWorkspace = '';
    selectedStatus = '';
    selectedType = '';
    goto('/app/admin/financial/transactions');
  }

  function exportToCSV() {
    alert('CSV export coming soon!');
  }

  function nextPage() {
    const newOffset = data.filters.offset + data.filters.limit;
    const params = new URLSearchParams(window.location.search);
    params.set('offset', newOffset.toString());
    goto(`/app/admin/financial/transactions?${params.toString()}`);
  }

  function previousPage() {
    const newOffset = Math.max(0, data.filters.offset - data.filters.limit);
    const params = new URLSearchParams(window.location.search);
    params.set('offset', newOffset.toString());
    goto(`/app/admin/financial/transactions?${params.toString()}`);
  }

  $: totalPlatformFees = data.transactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
  $: totalStripeFees = data.transactions.reduce((sum, t) => sum + (t.stripeFee || 0), 0);
  $: totalAmount = data.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
</script>

<svelte:head>
  <title>All Transactions - Financial Dashboard</title>
</svelte:head>

<div class="p-6">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">All Transactions</h1>
    <p class="mt-1 text-sm text-gray-600">
      View and filter all platform transactions
    </p>
  </div>

  <!-- Summary Cards for Current View -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <p class="text-xs font-medium text-gray-600 mb-1">Total Amount (Current View)</p>
      <p class="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
    </div>
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <p class="text-xs font-medium text-gray-600 mb-1">Platform Fees</p>
      <p class="text-2xl font-bold text-green-600">{formatCurrency(totalPlatformFees)}</p>
    </div>
    <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <p class="text-xs font-medium text-gray-600 mb-1">Stripe Fees</p>
      <p class="text-2xl font-bold text-gray-900">{formatCurrency(totalStripeFees)}</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Workspace Filter -->
      <div>
        <label for="workspace" class="block text-sm font-medium text-gray-700 mb-1">
          Workspace
        </label>
        <select
          id="workspace"
          bind:value={selectedWorkspace}
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Workspaces</option>
          {#each data.workspaces as workspace}
            <option value={workspace.id}>{workspace.name}</option>
          {/each}
        </select>
      </div>

      <!-- Status Filter -->
      <div>
        <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          bind:value={selectedStatus}
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <!-- Type Filter -->
      <div>
        <label for="type" class="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          id="type"
          bind:value={selectedType}
          class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="donation">Donation</option>
          <option value="product">Product</option>
          <option value="subscription">Subscription</option>
        </select>
      </div>

      <!-- Actions -->
      <div class="flex items-end gap-2">
        <button
          type="button"
          on:click={applyFilters}
          class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Apply
        </button>
        <button
          type="button"
          on:click={clearFilters}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <p class="text-sm text-gray-600">
        Showing {data.filters.offset + 1} to {Math.min(data.filters.offset + data.filters.limit, data.total)} of {data.total} transactions
      </p>
      <button
        type="button"
        on:click={exportToCSV}
        class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
      </button>
    </div>
  </div>

  <!-- Transactions Table -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    {#if data.transactions.length === 0}
      <div class="p-12 text-center">
        <p class="text-gray-600">No transactions found</p>
        <p class="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
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
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Stripe Fee
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Platform Fee
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Net Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each data.transactions as transaction}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.workspaceName || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.contactName || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                    {transaction.type}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(transaction.amount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                  {formatCurrency(transaction.stripeFee)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">
                  {formatCurrency(transaction.platformFee)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatCurrency(transaction.netAmount)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium {
                    transaction.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  } rounded capitalize">
                    {transaction.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <button
          type="button"
          on:click={previousPage}
          disabled={data.filters.offset === 0}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="text-sm text-gray-700">
          Page {Math.floor(data.filters.offset / data.filters.limit) + 1} of {Math.ceil(data.total / data.filters.limit)}
        </span>
        <button
          type="button"
          on:click={nextPage}
          disabled={data.filters.offset + data.filters.limit >= data.total}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    {/if}
  </div>
</div>
