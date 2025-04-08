<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css'
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();
	injectAnalytics();
</script>

<svelte:head>
	<title>Civics Lab</title>
</svelte:head>

<div>
  <slot />
</div>