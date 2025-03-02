<!-- src/routes/app/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types'
	
	export let data: PageData
</script>

<svelte:head>
	<title>App Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6">
	<header class="mb-8">
		<h1 class="text-3xl font-bold">App Dashboard</h1>
		<p class="text-gray-600">Welcome, {data.user?.email}</p>
	</header>
	
	<section class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">Quick Access</h2>
			<ul class="space-y-2">
				<li><a href="/app/profile" class="text-blue-600 hover:underline">Profile Settings</a></li>
				<li><a href="/engage" class="text-blue-600 hover:underline">Engagement Portal</a></li>
				<li>
					<form method="POST" action="/logout">
						<button type="submit" class="text-blue-600 hover:underline text-left">
							Sign Out
						</button>
					</form>
				</li>
			</ul>
		</div>
		
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">Account Status</h2>
			<div class="space-y-2">
				<div class="flex justify-between">
					<span class="text-gray-600">User ID:</span>
					<span class="font-medium">{data.user?.id.substring(0, 8)}...</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Email:</span>
					<span class="font-medium">{data.user?.email}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">Status:</span>
					<span class="font-medium text-green-600">Active</span>
				</div>
			</div>
		</div>
		
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
			<p class="text-gray-600 italic">No recent activity to show.</p>
		</div>
	</section>
</div>