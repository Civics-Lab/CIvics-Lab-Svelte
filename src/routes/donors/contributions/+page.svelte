<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  let searchQuery = '';
  let filterType = 'all';

  $: filteredContributions = data.contributions.filter((contrib: any) => {
    const matchesSearch =
      searchQuery === '' ||
      (contrib.amount / 100).toString().includes(searchQuery) ||
      contrib.formName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || contrib.type === filterType;

    return matchesSearch && matchesType;
  });

  function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function exportToCSV() {
    // TODO: Implement CSV export
    alert('CSV export coming soon!');
  }

  function getTypeBadgeClass(type: string): string {
    if (type === 'donation') return 'bg-blue-100 text-blue-800';
    if (type === 'product') return 'bg-purple-100 text-purple-800';
    if (type === 'subscription') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }
</script>

<svelte:head>
  <title>Donor Portal - Contributions</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Contribution History</h1>
    <p class="mt-1 text-sm text-gray-600">
      View all your past contributions and download receipts
    </p>
  </div>

  <!-- Filters and Search -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search -->
      <div class="flex-1">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search contributions..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <!-- Type Filter -->
      <div class="sm:w-48">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <select
            bind:value={filterType}
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="donation">Donations</option>
            <option value="product">Products</option>
            <option value="subscription">Subscriptions</option>
          </select>
        </div>
      </div>

      <!-- Export Button -->
      <button
        type="button"
        on:click={exportToCSV}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>
  </div>

  <!-- Contributions Table -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    {#if filteredContributions.length === 0}
      <div class="p-12 text-center">
        <p class="text-gray-600">No contributions found</p>
        <p class="text-sm text-gray-500 mt-1">
          {searchQuery || filterType !== 'all'
            ? 'Try adjusting your filters'
            : 'Your contributions will appear here'}
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Form
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredContributions as contribution}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(contribution.createdAt)}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium {getTypeBadgeClass(contribution.type)} rounded">
                    {contribution.type || 'donation'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contribution.formName || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${((contribution.amount || 0) / 100).toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    {contribution.status || 'completed'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div class="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      class="text-blue-600 hover:text-blue-800"
                    >
                      Receipt
                    </button>
                    {#if contribution.formSlug}
                      <a
                        href="/forms/{contribution.formSlug}"
                        class="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Donate Again
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if data.total > data.limit}
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-700">
              Showing {data.offset + 1} to {Math.min(data.offset + data.limit, data.total)} of {data.total} contributions
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                disabled={data.offset === 0}
                class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={data.offset + data.limit >= data.total}
                class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
