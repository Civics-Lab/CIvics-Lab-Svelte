<!-- src/routes/engage/settings/workspace/billing/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    // State for billing information
    const subscription = writable<any | null>(null);
    const payments = writable<any[]>([]);
    const isLoadingBilling = writable(true);
    const billingError = writable<string | null>(null);
    
    // State for card update
    const showUpdateCard = writable(false);
    const isUpdatingCard = writable(false);
    
    // State for plan change
    const showChangePlan = writable(false);
    const isChangingPlan = writable(false);
    const selectedPlan = writable('');
    
    // Available plans
    const plans = [
      { id: 'basic', name: 'Basic', price: '$9.99/month', features: ['Up to 500 contacts', 'Basic CRM features', 'Email support'] },
      { id: 'pro', name: 'Professional', price: '$19.99/month', features: ['Up to 2,000 contacts', 'Advanced CRM features', 'Priority email support', 'Data exports'] },
      { id: 'enterprise', name: 'Enterprise', price: '$49.99/month', features: ['Unlimited contacts', 'All features', 'Phone support', 'Custom integrations', 'Dedicated account manager'] }
    ];
    
    // Fetch billing information
    async function fetchBillingInfo() {
      if (!$workspaceStore.currentWorkspace) return;
      
      isLoadingBilling.set(true);
      billingError.set(null);
      
      try {
        // Fetch subscription information
        const { data: subscriptionData, error: subscriptionError } = await data.supabase
          .from('workspace_subscriptions')
          .select('*')
          .eq('workspace_id', $workspaceStore.currentWorkspace.id)
          .maybeSingle();
        
        if (subscriptionError) throw subscriptionError;
        
        subscription.set(subscriptionData);
        
        // Fetch payment history
        if (subscriptionData) {
          const { data: paymentData, error: paymentError } = await data.supabase
            .from('workspace_payments')
            .select('*')
            .eq('workspace_id', $workspaceStore.currentWorkspace.id)
            .order('payment_date', { ascending: false });
          
          if (paymentError) throw paymentError;
          
          payments.set(paymentData || []);
        }
      } catch (err) {
        console.error('Error fetching billing information:', err);
        billingError.set('Failed to load billing information');
      } finally {
        isLoadingBilling.set(false);
      }
    }
    
    // Toggle update card form
    function toggleUpdateCard() {
      showUpdateCard.update(value => !value);
    }
    
    // Toggle change plan form
    function toggleChangePlan() {
      showChangePlan.update(value => !value);
      if ($showChangePlan) {
        // Set the current plan as selected initially
        selectedPlan.set($subscription?.plan || '');
      }
    }
    
    // Update payment method (mock function)
    async function updatePaymentMethod() {
      isUpdatingCard.set(true);
      
      try {
        // In a real implementation, this would call to a payment processor API
        // For this example, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toastStore.success('Payment method updated successfully');
        toggleUpdateCard();
      } catch (err) {
        console.error('Error updating payment method:', err);
        toastStore.error('Failed to update payment method');
      } finally {
        isUpdatingCard.set(false);
      }
    }
    
    // Change subscription plan (mock function)
    async function changePlan() {
      if (!$selectedPlan || $selectedPlan === $subscription?.plan) return;
      
      isChangingPlan.set(true);
      
      try {
        // In a real implementation, this would call to a payment processor API
        // For this example, we'll just simulate a delay and update the database
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update the subscription in the database
        const { error } = await data.supabase
          .from('workspace_subscriptions')
          .update({ plan: $selectedPlan })
          .eq('id', $subscription.id);
        
        if (error) throw error;
        
        // Refresh the billing information
        await fetchBillingInfo();
        
        toastStore.success('Subscription plan updated successfully');
        toggleChangePlan();
      } catch (err) {
        console.error('Error changing plan:', err);
        toastStore.error('Failed to change subscription plan');
      } finally {
        isChangingPlan.set(false);
      }
    }
    
    // Format a date for display
    function formatDate(dateString: string) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Format currency for display
    function formatCurrency(amount: number, currency: string = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    }
    
    // Fetch billing information when workspace changes
    $: if ($workspaceStore.currentWorkspace) {
      fetchBillingInfo();
    }
  </script>
  
  <svelte:head>
    <title>Workspace Billing | Engage</title>
  </svelte:head>
  
  <div class="p-6">
    <h2 class="text-xl font-bold mb-6">Billing & Subscription</h2>
    
    {#if $isLoadingBilling}
      <div class="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    {:else if $billingError}
      <div class="bg-red-50 p-4 rounded-md mb-6">
        <p class="text-red-700">{$billingError}</p>
      </div>
    {:else}
      <!-- Current Subscription -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Current Subscription</h3>
        </div>
        <div class="p-6">
          {#if $subscription}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="mb-4">
                  <p class="text-sm font-medium text-gray-500">Plan</p>
                  <p class="mt-1 text-lg font-semibold">
                    {$subscription.plan.charAt(0).toUpperCase() + $subscription.plan.slice(1)}
                  </p>
                </div>
                <div class="mb-4">
                  <p class="text-sm font-medium text-gray-500">Status</p>
                  <p class="mt-1">
                    <span class="inline-flex rounded-full px-3 py-1 text-sm font-semibold {$subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                      {$subscription.status.charAt(0).toUpperCase() + $subscription.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    on:click={toggleChangePlan}
                  >
                    Change Plan
                  </button>
                </div>
              </div>
              <div>
                <div class="mb-4">
                  <p class="text-sm font-medium text-gray-500">Current Billing Period</p>
                  <p class="mt-1">
                    {formatDate($subscription.billing_cycle_start)} to {formatDate($subscription.billing_cycle_end)}
                  </p>
                </div>
                <div class="mb-4">
                  <p class="text-sm font-medium text-gray-500">Payment Method</p>
                  <p class="mt-1">
                    <span class="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Visa ending in 1234
                    </span>
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    on:click={toggleUpdateCard}
                  >
                    Update Payment Method
                  </button>
                </div>
              </div>
            </div>
          {:else}
            <div class="text-center py-6">
              <p class="text-gray-500 mb-4">No active subscription found.</p>
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                on:click={toggleChangePlan}
              >
                Choose a Plan
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Update Payment Method Form -->
      {#if $showUpdateCard}
        <div class="bg-gray-50 p-6 rounded-lg border mb-8">
          <h3 class="text-lg font-medium mb-4">Update Payment Method</h3>
          <form on:submit|preventDefault={updatePaymentMethod} class="space-y-4 max-w-lg">
            <div>
              <label for="card-number" class="block text-sm font-medium text-gray-700">Card Number</label>
              <input
                id="card-number"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-2">
                <label for="expiration" class="block text-sm font-medium text-gray-700">Expiration Date</label>
                <input
                  id="expiration"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label for="cvc" class="block text-sm font-medium text-gray-700">CVC</label>
                <input
                  id="cvc"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="123"
                />
              </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                on:click={toggleUpdateCard}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                disabled={$isUpdatingCard}
              >
                {#if $isUpdatingCard}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Updating...</span>
                  </div>
                {:else}
                  Update Payment Method
                {/if}
              </button>
            </div>
          </form>
        </div>
      {/if}
      
      <!-- Change Plan Form -->
      {#if $showChangePlan}
        <div class="bg-gray-50 p-6 rounded-lg border mb-8">
          <h3 class="text-lg font-medium mb-4">Change Subscription Plan</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each plans as plan}
              <div 
                class="border rounded-lg p-4 {$selectedPlan === plan.id ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500' : 'border-gray-200 bg-white'} cursor-pointer"
                on:click={() => selectedPlan.set(plan.id)}
                on:keydown={(e) => e.key === 'Enter' && selectedPlan.set(plan.id)}
                tabindex="0"
                role="radio"
                aria-checked={$selectedPlan === plan.id}
              >
                <div class="flex justify-between items-start mb-4">
                  <h4 class="text-lg font-medium">{plan.name}</h4>
                  {#if $selectedPlan === plan.id}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </div>
                <p class="text-lg font-bold mb-4">{plan.price}</p>
                <ul class="text-sm space-y-2">
                  {#each plan.features as feature}
                    <li class="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-teal-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  {/each}
                </ul>
              </div>
            {/each}
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              on:click={toggleChangePlan}
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              on:click={changePlan}
              disabled={$isChangingPlan || !$selectedPlan || $selectedPlan === $subscription?.plan}
            >
              {#if $isChangingPlan}
                <div class="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span class="ml-2">Updating...</span>
                </div>
              {:else}
                Confirm Plan Change
              {/if}
            </button>
          </div>
        </div>
      {/if}
      
      <!-- Payment History -->
      <div class="bg-white border rounded-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Payment History</h3>
        </div>
        <div class="overflow-x-auto">
          {#if $payments.length === 0}
            <div class="text-center py-6">
              <p class="text-gray-500">No payment history available.</p>
            </div>
          {:else}
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each $payments as payment}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Subscription Payment
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold {payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : payment.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href="#" class="text-teal-600 hover:text-teal-900">
                        Download
                      </a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      </div>
    {/if}
  </div>