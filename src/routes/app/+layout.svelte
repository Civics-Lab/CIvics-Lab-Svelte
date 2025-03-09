<!-- src/routes/app/+layout.svelte -->
<script lang="ts">
    import type { LayoutData } from './$types';
    import WorkspaceContext from '$lib/components/WorkspaceContext.svelte';
    
    export const data: LayoutData;
  </script>
  
  <WorkspaceContext supabase={data.supabase}>
    <div class="min-h-screen bg-gray-50">
      <slot />
    </div>
  </WorkspaceContext>