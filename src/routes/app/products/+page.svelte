<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

  import {
    fetchProducts,
    fetchProductWithStats,
    createProduct,
    updateProduct,
    archiveProduct,
    deleteProduct,
    formatProductAmount,
    formatBillingPeriod
  } from '$lib/services/productService';

  import type { Product, ProductWithStats } from '$lib/types/product';

  // State
  const products = writable<ProductWithStats[]>([]);
  const isLoading = writable(false);
  const error = writable<string | null>(null);

  // Modal state
  const isModalOpen = writable(false);
  const isDeleteModalOpen = writable(false);
  const modalMode = writable<'create' | 'edit'>('create');
  const selectedProduct = writable<ProductWithStats | null>(null);

  // Form state
  const formData = writable({
    name: '',
    description: '',
    amount: '',
    billingPeriod: 'monthly' as 'one_time' | 'weekly' | 'monthly' | 'yearly',
    isActive: true
  });

  const formErrors = writable<Record<string, string>>({});
  const isSubmitting = writable(false);

  // Fetch products
  async function loadProducts() {
    if (!$workspaceStore.currentWorkspace) return;

    isLoading.set(true);
    error.set(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const productsList = await fetchProducts($workspaceStore.currentWorkspace.id, token);

      // Fetch stats for each product
      const productsWithStats = await Promise.all(
        productsList.map(async (product) => {
          try {
            return await fetchProductWithStats(product.id, token);
          } catch {
            return { ...product, activeSubscriptions: 0, totalRevenue: 0, totalSubscribers: 0 };
          }
        })
      );

      products.set(productsWithStats);
    } catch (err) {
      console.error('Error loading products:', err);
      error.set(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      isLoading.set(false);
    }
  }

  // Open create modal
  function handleCreate() {
    modalMode.set('create');
    formData.set({
      name: '',
      description: '',
      amount: '',
      billingPeriod: 'monthly',
      isActive: true
    });
    formErrors.set({});
    isModalOpen.set(true);
  }

  // Open edit modal
  function handleEdit(product: ProductWithStats) {
    modalMode.set('edit');
    selectedProduct.set(product);
    formData.set({
      name: product.name,
      description: product.description || '',
      amount: (product.amount / 100).toFixed(2),
      billingPeriod: product.billingPeriod,
      isActive: product.isActive
    });
    formErrors.set({});
    isModalOpen.set(true);
  }

  // Open delete modal
  function handleDelete(product: ProductWithStats) {
    selectedProduct.set(product);
    isDeleteModalOpen.set(true);
  }

  // Validate form
  function validateForm() {
    const errors: Record<string, string> = {};

    if (!$formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!$formData.amount || parseFloat($formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  // Submit form
  async function handleSubmit() {
    if (!validateForm()) return;
    if (!$workspaceStore.currentWorkspace) return;

    isSubmitting.set(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const productData = {
        name: $formData.name.trim(),
        description: $formData.description.trim() || undefined,
        amount: Math.round(parseFloat($formData.amount) * 100), // Convert to cents
        billingPeriod: $formData.billingPeriod,
        isActive: $formData.isActive
      };

      if ($modalMode === 'create') {
        await createProduct(
          $workspaceStore.currentWorkspace.id,
          productData,
          token
        );
        toastStore.success('Product created successfully');
      } else if ($modalMode === 'edit' && $selectedProduct) {
        await updateProduct(
          $selectedProduct.id,
          productData,
          token
        );
        toastStore.success('Product updated successfully');
      }

      isModalOpen.set(false);
      await loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      isSubmitting.set(false);
    }
  }

  // Archive product
  async function handleArchive(product: ProductWithStats) {
    if (!confirm(`Archive "${product.name}"? It will no longer be available for new subscriptions.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await archiveProduct(product.id, token);
      toastStore.success('Product archived successfully');
      await loadProducts();
    } catch (err) {
      console.error('Error archiving product:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to archive product');
    }
  }

  // Confirm delete
  async function confirmDelete() {
    if (!$selectedProduct) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await deleteProduct($selectedProduct.id, token);
      toastStore.success('Product deleted successfully');
      isDeleteModalOpen.set(false);
      selectedProduct.set(null);
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      toastStore.error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  // Load products on workspace change
  $: if ($workspaceStore.currentWorkspace) {
    loadProducts();
  }
</script>

<svelte:head>
  <title>Products | Civics Lab</title>
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
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Products</h1>
          <p class="text-sm text-gray-500 mt-1">Manage donation products and subscription tiers</p>
        </div>
        <button
          on:click={handleCreate}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Product
        </button>
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
      {:else if $products.length === 0}
        <div class="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p class="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
          <div class="mt-6">
            <button
              on:click={handleCreate}
              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Product
            </button>
          </div>
        </div>
      {:else}
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Period</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscriptions</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each $products as product}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{product.name}</div>
                    {#if product.description}
                      <div class="text-sm text-gray-500">{product.description}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatProductAmount(product.amount)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatBillingPeriod(product.billingPeriod)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if product.isActive}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    {:else}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Archived
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.activeSubscriptions || 0} active
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatProductAmount(product.totalRevenue || 0)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      on:click={() => handleEdit(product)}
                      class="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    {#if product.isActive}
                      <button
                        on:click={() => handleArchive(product)}
                        class="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Archive
                      </button>
                    {/if}
                    <button
                      on:click={() => handleDelete(product)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
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

<!-- Create/Edit Modal -->
{#if $isModalOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          {$modalMode === 'create' ? 'Create Product' : 'Edit Product'}
        </h2>

        <form on:submit|preventDefault={handleSubmit}>
          <!-- Name -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              bind:value={$formData.name}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Monthly Supporter"
            />
            {#if $formErrors.name}
              <p class="text-red-500 text-xs mt-1">{$formErrors.name}</p>
            {/if}
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              bind:value={$formData.description}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Support our mission with a monthly contribution"
            />
          </div>

          <!-- Amount -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Amount <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                bind:value={$formData.amount}
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25.00"
              />
            </div>
            {#if $formErrors.amount}
              <p class="text-red-500 text-xs mt-1">{$formErrors.amount}</p>
            {/if}
          </div>

          <!-- Billing Period -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Billing Period
            </label>
            <select
              bind:value={$formData.billingPeriod}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="one_time">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <!-- Active Status -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={$formData.isActive}
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Active (available for new subscriptions)</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <button
              type="button"
              on:click={() => isModalOpen.set(false)}
              disabled={$isSubmitting}
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={$isSubmitting}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {#if $isSubmitting}
                <LoadingSpinner size="sm" color="white" />
                <span>Saving...</span>
              {:else}
                <span>{$modalMode === 'create' ? 'Create' : 'Update'}</span>
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if $isDeleteModalOpen && $selectedProduct}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-semibold text-red-600 mb-4">Delete Product?</h2>
      <p class="text-gray-700 mb-4">
        Are you sure you want to delete "<strong>{$selectedProduct.name}</strong>"?
        This action cannot be undone.
      </p>
      {#if $selectedProduct.activeSubscriptions && $selectedProduct.activeSubscriptions > 0}
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <p class="text-sm text-yellow-800">
            Warning: This product has {$selectedProduct.activeSubscriptions} active subscription(s).
            Consider archiving instead of deleting.
          </p>
        </div>
      {/if}
      <div class="flex justify-end gap-3">
        <button
          on:click={() => isDeleteModalOpen.set(false)}
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          on:click={confirmDelete}
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}
