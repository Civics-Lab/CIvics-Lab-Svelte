<!-- src/routes/engage/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types'
	
	export let data: PageData
</script>

<svelte:head>
	<title>Engagement Portal</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6">
	<header class="mb-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold">Engagement Portal</h1>
				<p class="text-gray-600">Connect and collaborate</p>
			</div>
			<div>
				<a href="/app" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
					Back to Dashboard
				</a>
			</div>
		</div>
	</header>
	
	<section class="bg-white p-6 rounded-lg shadow mb-8">
		<h2 class="text-xl font-semibold mb-4">Welcome to the Engagement Portal</h2>
		<p class="text-gray-700 mb-4">
			This is a protected route that only authenticated users can access. 
			You're logged in as <strong>{data.user?.email}</strong>.
		</p>
		<p class="text-gray-700">
			From here, you can access various engagement features and collaborate with others.
		</p>
	</section>
	
	<section class="grid md:grid-cols-2 gap-6">
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">Recent Connections</h2>
			<p class="text-gray-600 italic">No recent connections to display.</p>
		</div>
		
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">Upcoming Events</h2>
			<p class="text-gray-600 italic">No upcoming events scheduled.</p>
		</div>
	</section>
</div>