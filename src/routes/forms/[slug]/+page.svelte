<script lang="ts">
  import { goto } from '$app/navigation';
  import FormHeader from '$lib/components/forms/public/FormHeader.svelte';
  import DonorInfoForm from '$lib/components/forms/public/DonorInfoForm.svelte';
  import PaymentForm from '$lib/components/forms/public/PaymentForm.svelte';
  import FormFooter from '$lib/components/forms/public/FormFooter.svelte';
  import BlockRenderer from '$lib/components/forms/BlockRenderer.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let donorInfo: any = {};
  let paymentMethod: any = null;
  let isSubmitting = false;
  let showPaymentForm = false;

  // Handle donor info completion
  function handleDonorInfoComplete(info: any) {
    donorInfo = info;
    showPaymentForm = true;
  }

  // Handle payment completion
  async function handlePaymentComplete(payment: any) {
    isSubmitting = true;

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: data.form.id,
          donorInfo,
          paymentMethod: payment,
          amount: getAmount()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const result = await response.json();

      // Navigate to success page
      goto(`/forms/${data.form.slug}/success?submission=${result.submissionId}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      isSubmitting = false;
    }
  }

  // Get amount based on form type
  function getAmount(): number {
    if (!data.linkedItem) return 0;

    if (data.form.type === 'donation') {
      // For donations, we'll get this from the payment form
      return donorInfo.amount || 0;
    } else if (data.form.type === 'product') {
      return data.linkedItem.price || 0;
    } else if (data.form.type === 'subscription') {
      return data.linkedItem.amount || 0;
    }

    return 0;
  }

  function getTypeLabel(): string {
    if (data.form.type === 'donation') return 'Donate';
    if (data.form.type === 'product') return 'Purchase';
    if (data.form.type === 'subscription') return 'Subscribe';
    return 'Continue';
  }
</script>

<svelte:head>
  <title>{data.form.name} - {data.workspace.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8 px-4">
  <div class="max-w-6xl mx-auto">
    <!-- Form Header -->
    <FormHeader
      logoUrl={data.form.logoUrl}
      workspaceName={data.workspace.name}
      formName={data.form.name}
    />

    <!-- Two-column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <!-- Left Column: Content -->
      <div class="bg-white rounded-lg shadow-sm p-8">
        <BlockRenderer
          blocks={data.form.leftContent}
          bindings={data.availableBindings}
        />
      </div>

      <!-- Right Column: Form -->
      <div class="bg-white rounded-lg shadow-sm p-8 sticky top-8 h-fit">
        {#if !showPaymentForm}
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            Your Information
          </h2>
          <DonorInfoForm
            formType={data.form.type}
            linkedItem={data.linkedItem}
            onComplete={handleDonorInfoComplete}
          />
        {:else}
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            Payment Details
          </h2>
          <PaymentForm
            amount={getAmount()}
            formType={data.form.type}
            workspaceId={data.workspace.id}
            onComplete={handlePaymentComplete}
            onBack={() => (showPaymentForm = false)}
            disabled={isSubmitting}
          />
        {/if}
      </div>
    </div>

    <!-- Footer Content -->
    <div class="mt-8 bg-white rounded-lg shadow-sm p-8">
      <FormFooter
        content={data.form.footerContent}
        bindings={data.availableBindings}
      />
    </div>
  </div>
</div>
