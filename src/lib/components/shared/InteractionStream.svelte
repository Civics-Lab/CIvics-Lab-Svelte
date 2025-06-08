<!-- Simple wrapper for InteractionStream component -->
<script lang="ts">
  export let entityType: 'contact' | 'business' = 'contact';
  export let entityId: string;
  export let isSaving = false;
</script>

<div class="interaction-stream-wrapper">
  {#await import('./InteractionStream/InteractionStream.svelte') then { default: InteractionStream }}
    <InteractionStream {entityType} {entityId} {isSaving} on:change />
  {:catch error}
    <div class="text-red-600 text-sm">
      Failed to load interaction stream: {error.message}
    </div>
  {/await}
</div>