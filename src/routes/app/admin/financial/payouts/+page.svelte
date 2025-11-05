<script lang="ts">
  // Placeholder for payout management
  // This would need full implementation with actual payout creation

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
</script>

<svelte:head>
  <title>Payout Management - Financial Dashboard</title>
</svelte:head>

<div class="p-6">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Payout Management</h1>
    <p class="mt-1 text-sm text-gray-600">
      Create and track payouts to workspace Stripe accounts
    </p>
  </div>

  <!-- Coming Soon Message -->
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h2 class="text-xl font-semibold text-gray-900 mb-2">Payout Management Coming Soon</h2>
    <p class="text-gray-600 max-w-lg mx-auto">
      This feature will allow you to create batch payouts to workspaces, track payout status, and manage financial reconciliation.
    </p>
  </div>
</div>
