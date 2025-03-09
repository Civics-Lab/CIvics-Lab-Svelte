<!-- src/routes/app/+page.svelte -->
<script lang="ts">
	import type { PageData } from './$types';
	import WorkspaceSelector from '$lib/components/WorkspaceSelector.svelte';
	import CreateWorkspaceModal from '$lib/components/CreateWorkspaceModal.svelte';
	import { userStore } from '$lib/stores/userStore';
	import { workspaceStore } from '$lib/stores/workspaceStore';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import { writable } from 'svelte/store';
	
	export const data: PageData;
	
	// State for create workspace modal
	const isCreateModalOpen = writable(false);
	
	function openCreateModal() {
		isCreateModalOpen.set(true);
	}
	
	function closeCreateModal() {
		isCreateModalOpen.set(false);
	}
</script>

<svelte:head>
	<title>App Dashboard</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6">
	<header class="mb-8">
		<div class="flex justify-between items-center mb-4">
			<div>
				<WorkspaceSelector />
			</div>
			<div>
				<p class="text-gray-600">Welcome, {$userStore.user?.email}</p>
			</div>
		</div>
		<h1 class="text-3xl font-bold">App Dashboard</h1>
	</header>
	
	{#if $workspaceStore.isLoading}
		<div class="flex justify-center items-center py-20">
			<LoadingSpinner size="lg" />
		</div>
	{:else if !$workspaceStore.currentWorkspace}
		<div class="bg-white p-8 rounded-lg shadow-md text-center">
			<h2 class="text-xl font-semibold mb-4 text-gray-700">No Workspace Selected</h2>
			<p class="text-gray-600 mb-6">
				You need to select or create a workspace to continue.
			</p>
			<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
				Create New Workspace
			</button>
		</div>
	{:else}
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
						<span class="font-medium">{$userStore.user?.id.substring(0, 8)}...</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Email:</span>
						<span class="font-medium">{$userStore.user?.email}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Status:</span>
						<span class="font-medium text-green-600">Active</span>
					</div>
				</div>
			</div>
			
			<div class="bg-white p-6 rounded-lg shadow">
				<h2 class="text-xl font-semibold mb-4">
					Current Workspace
				</h2>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="text-gray-600">Name:</span>
						<span class="font-medium">{$workspaceStore.currentWorkspace?.name}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">ID:</span>
						<span class="font-medium">{$workspaceStore.currentWorkspace?.id.substring(0, 8)}...</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Created:</span>
						<span class="font-medium">
							{#if $workspaceStore.currentWorkspace?.created_at}
								{new Date($workspaceStore.currentWorkspace.created_at).toLocaleDateString()}
							{:else}
								-
							{/if}
						</span>
					</div>
				</div>
			</div>
		</section>
	{/if}
</div>