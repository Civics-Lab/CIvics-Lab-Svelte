<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css'
	import { invalidate } from '$app/navigation'
	import { onMount } from 'svelte'
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	injectSpeedInsights();
	injectAnalytics();

	export let data

	let { supabase, session } = data
	$: ({ supabase, session } = data)

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})

		return () => data.subscription.unsubscribe()
	})
</script>

<svelte:head>
	<title>Civics Lab</title>
</svelte:head>

<div>
  <slot />
</div>