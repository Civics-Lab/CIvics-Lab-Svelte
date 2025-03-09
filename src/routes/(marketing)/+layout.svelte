<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../../app.css'
	import Navbar from '$lib/components/marketing-site/Navbar.svelte';
  	import Footer from '$lib/components/marketing-site/Footer.svelte';
	import { invalidate } from '$app/navigation'
	import { onMount } from 'svelte'

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


<Navbar />

<main>
  <slot />
</main>

<Footer />