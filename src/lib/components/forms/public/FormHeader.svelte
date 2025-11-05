<script lang="ts">
  export let logoUrl: string | undefined;
  export let workspaceName: string;
  export let formName: string;
</script>

<div class="bg-white rounded-lg shadow-sm p-8 mb-8">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-6">
      {#if logoUrl}
        <img
          src={logoUrl}
          alt="{workspaceName} logo"
          class="h-16 w-auto object-contain"
        />
      {/if}
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{formName}</h1>
        <p class="text-sm text-gray-600 mt-1">{workspaceName}</p>
      </div>
    </div>
  </div>
</div>
