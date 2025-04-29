<!-- src/routes/app/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import { auth } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { workspaceStore } from '$lib/stores/workspaceStore';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import EmptyWorkspaceView from '$lib/components/EmptyWorkspaceView.svelte';
	export let data: PageData;

	// Track if we should show the app content or the empty workspace view
	let loading = true;
	let showEmptyWorkspaceView = false;

	onMount(async () => {
		// Refresh workspaces to get the latest data
		try {
			await workspaceStore.refreshWorkspaces();
			
			// Check if we should show empty workspace view
			if ($workspaceStore.workspaces.length === 0) {
				console.log('No workspaces found, showing empty workspace view');
				showEmptyWorkspaceView = true;
			} else {
				console.log(`Found ${$workspaceStore.workspaces.length} workspaces`);
			}

			// Check if we should auto-open the workspace creation form
			const shouldCreateWorkspace = $page.url.searchParams.get('create') === 'workspace';
			if (shouldCreateWorkspace) {
				showEmptyWorkspaceView = true;
			}
		} catch (error) {
			console.error('Error loading workspaces:', error);
		} finally {
			loading = false;
		}
	});

	function handleLogout() {
		auth.logout();
		goto('/login');
	}

	function handleWorkspaceCreated(event) {
		console.log('Workspace created:', event.detail.workspace);
		workspaceStore.refreshWorkspaces();
		showEmptyWorkspaceView = false;
	}
</script>

<svelte:head>
	<title>App Dashboard</title>
</svelte:head>

{#if loading}
	<div class="flex justify-center items-center h-screen">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
	</div>
{:else if showEmptyWorkspaceView}
	<EmptyWorkspaceView 
		autoOpen={$page.url.searchParams.get('create') === 'workspace'}
		on:created={handleWorkspaceCreated} 
	/>
{:else}
	<div class="max-w-7xl mx-auto p-6">
		<header class="mb-8">
			<div class="flex justify-between items-center mb-4">
				<h1 class="text-3xl font-bold">App Dashboard</h1>
				<div>
					<button 
						on:click={handleLogout}
						class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
					>
						Sign Out
					</button>
				</div>
			</div>
		</header>
		
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<a href="/app/admin" class="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 flex items-center transition-colors">
					<div class="bg-blue-100 p-3 rounded-full mr-3">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
					<div>
						<h3 class="font-medium">Admin Dashboard</h3>
						<p class="text-sm text-gray-600">Manage users, workspaces and invites</p>
					</div>
				</a>
				
				<a href="/app/contacts" class="bg-green-50 hover:bg-green-100 rounded-lg p-4 flex items-center transition-colors">
					<div class="bg-green-100 p-3 rounded-full mr-3">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<div>
						<h3 class="font-medium">Manage Contacts</h3>
						<p class="text-sm text-gray-600">Work with your contact database</p>
					</div>
				</a>
				
				<a href="/engage" class="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 flex items-center transition-colors">
					<div class="bg-purple-100 p-3 rounded-full mr-3">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
						</svg>
					</div>
					<div>
						<h3 class="font-medium">Engagement Portal</h3>
						<p class="text-sm text-gray-600">Launch the engagement dashboard</p>
					</div>
				</a>
			</div>
		</div>
		
		<div class="bg-white p-6 rounded-lg shadow mb-6">
			<h2 class="text-xl font-semibold mb-4">Authentication Success!</h2>
			<p class="text-gray-600">Welcome, {data.user?.username || data.user?.email}!</p>
			<p class="text-gray-600 mt-2">You've successfully authenticated with the new authentication system.</p>
		</div>
		
		<div class="bg-white p-6 rounded-lg shadow">
			<h2 class="text-xl font-semibold mb-4">User Information</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<h3 class="font-medium text-gray-700">Username:</h3>
					<p>{data.user?.username || 'N/A'}</p>
				</div>
				<div>
					<h3 class="font-medium text-gray-700">Email:</h3>
					<p>{data.user?.email || 'N/A'}</p>
				</div>
				<div>
					<h3 class="font-medium text-gray-700">User ID:</h3>
					<p>{data.user?.id || 'N/A'}</p>
				</div>
				<div>
					<h3 class="font-medium text-gray-700">User Role:</h3>
					<p>{data.user?.role || 'N/A'}</p>
				</div>
			</div>
		</div>
	</div>
{/if}
