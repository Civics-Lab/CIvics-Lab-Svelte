<script lang="ts">
  import { goto } from '$app/navigation';
  import BlockRenderer from '$lib/components/forms/BlockRenderer.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  function editForm() {
    goto(`/app/forms/${data.form.id}/edit`);
  }

  function copyPublicUrl() {
    const url = `${window.location.origin}/forms/${data.form.slug}`;
    navigator.clipboard.writeText(url);
    alert('Public URL copied to clipboard!');
  }

  function openPublicForm() {
    window.open(`/forms/${data.form.slug}`, '_blank');
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case 'donation':
        return 'Donation';
      case 'product':
        return 'Product';
      case 'subscription':
        return 'Subscription';
      default:
        return type;
    }
  }
</script>

<div class="p-6">
  <!-- Header -->
  <div class="flex items-start justify-between mb-6">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-gray-900">{data.form.name}</h1>
        {#if !data.form.isActive}
          <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            Archived
          </span>
        {/if}
      </div>
      <p class="text-sm text-gray-600">{getTypeLabel(data.form.type)} Form</p>
      <div class="flex items-center gap-2 mt-2">
        <code class="text-xs bg-gray-100 px-2 py-1 rounded">/forms/{data.form.slug}</code>
        <button
          type="button"
          on:click={copyPublicUrl}
          class="text-xs text-blue-600 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg> Copy URL
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        on:click={openPublicForm}
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View Public Form
      </button>
      <button
        type="button"
        on:click={editForm}
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Form
      </button>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-gray-600">Total Submissions</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">{data.stats.totalSubmissions || 0}</p>
      <p class="text-xs text-gray-500 mt-1">
        {data.stats.completedSubmissions || 0} completed
      </p>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-gray-600">Total Raised</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-green-600">
        ${((data.stats.totalRaised || 0) / 100).toLocaleString()}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        ${((data.stats.averageDonation || 0) / 100).toFixed(2)} avg
      </p>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-gray-600">Conversion Rate</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p class="text-3xl font-bold text-gray-900">
        {data.stats.totalSubmissions > 0
          ? Math.round((data.stats.completedSubmissions / data.stats.totalSubmissions) * 100)
          : 0}%
      </p>
      <p class="text-xs text-gray-500 mt-1">Success rate</p>
    </div>

    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-gray-600">Status</p>
      </div>
      <p class="text-lg font-bold {data.form.isActive ? 'text-green-600' : 'text-gray-600'}">
        {data.form.isActive ? 'Active' : 'Archived'}
      </p>
      {#if data.stats.lastSubmission}
        <p class="text-xs text-gray-500 mt-1">
          Last: {new Date(data.stats.lastSubmission).toLocaleDateString()}
        </p>
      {:else}
        <p class="text-xs text-gray-500 mt-1">No submissions yet</p>
      {/if}
    </div>
  </div>

  <!-- Form Preview -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left Content -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold mb-4">Left Column Content</h3>
      {#if data.form.logoUrl}
        <div class="mb-4">
          <img src={data.form.logoUrl} alt="Form logo" class="h-16 w-auto" />
        </div>
      {/if}
      <BlockRenderer blocks={data.form.leftContent} bindings={data.availableBindings} />
    </div>

    <!-- Footer Content -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold mb-4">Footer Content</h3>
      <BlockRenderer blocks={data.form.footerContent} bindings={data.availableBindings} />
    </div>
  </div>

  <!-- Recent Submissions (placeholder) -->
  <div class="mt-6 bg-white rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold mb-4">Recent Submissions</h3>
    <div class="text-center py-8 text-gray-500">
      <p>No submissions yet</p>
      <p class="text-sm mt-2">Share your form to start receiving contributions</p>
    </div>
  </div>
</div>
