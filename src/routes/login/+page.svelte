<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData, SubmitFunction } from './$types.js'

	export let form: ActionData;

	let loading = false;
	let passwordVisible = false;

	const handleSubmit: SubmitFunction = () => {
		loading = true
		return async ({ update }) => {
			update()
			loading = false
		}
	}

	const togglePasswordVisibility = () => {
		passwordVisible = !passwordVisible;
	}
</script>

<svelte:head>
	<title>Login | Supabase + SvelteKit</title>
</svelte:head>

<form class="min-h-screen flex items-center justify-center bg-gray-50" method="POST" use:enhance={handleSubmit}>
	<div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md flex flex-col">
		<div>
			<h1 class="header text-2xl font-bold">Welcome Back</h1>
			<p class="description font-semibold text-gray-600">Sign in to your account.</p>
			{#if form?.message !== undefined}
			<div class="success {form?.success ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'} border p-3 mb-4 rounded">
				{form?.message}
			</div>
			{/if}
		</div>
		<div class="mb-4">
			<label for="email" class="block text-sm font-medium mb-1">Email address</label>
			<input
				id="email"
				name="email"
				class="w-full p-2 border rounded"
				type="email"
				placeholder="Your email"
				value={form?.email ?? ''}
				required
			/>
			{#if form?.errors?.email}
			<span class="text-sm text-red-600 mt-1">
				{form?.errors?.email}
			</span>
			{/if}
		</div>
		<div class="mb-4">
			<label for="password" class="block text-sm font-medium mb-1">Password</label>
			<div class="relative">
				<input
					id="password"
					name="password"
					class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full"
					type={passwordVisible ? "text" : "password"}
					placeholder="Your password"
					required
				/>
				<button
					type="button"
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500"
					on:click={togglePasswordVisibility}
				>
					{passwordVisible ? "Hide" : "Show"}
				</button>
			</div>
			{#if form?.errors?.password}
			<span class="text-sm text-red-600 mt-1">
				{form?.errors?.password}
			</span>
			{/if}
		</div>
		<div class="mb-6">
			<button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-950 text-white hover:bg-slate-800 h-10 px-4 py-2 w-full">
				{loading ? 'Loading...' : 'Sign in'}
			</button>
		</div>
		<div class="text-center text-sm">
			<p>Don't have an account? <a href="/signup" class="text-blue-600 hover:underline">Sign up</a></p>
		</div>
	</div>
</form>