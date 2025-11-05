<script lang="ts">
  import BlockRenderer from '$lib/components/forms/BlockRenderer.svelte';
  import type { EditorJsData } from '$lib/types/form';

  export let content: EditorJsData;
  export let bindings: Record<string, string>;
</script>

<div class="border-t border-gray-200 pt-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Contribution Rules</h3>
  <div class="prose prose-sm max-w-none text-gray-600">
    <BlockRenderer blocks={content} {bindings} />
  </div>
</div>
