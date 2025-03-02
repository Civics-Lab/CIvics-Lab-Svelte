<!-- src/routes/signup/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData, SubmitFunction } from './$types.js'

	export let form: ActionData;

	let loading = false;
	let passwordVisible = false;
	let confirmPasswordVisible = false;

	const handleSubmit: SubmitFunction = () => {
		loading = true
		return async ({ update }) => {
			update()
			loading = false
		}
	}

	const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
		if (field === 'password') {
			passwordVisible = !passwordVisible;
		} else {
			confirmPasswordVisible = !confirmPasswordVisible;
		}
	}
</script>

<svelte:head>
	<title>Sign Up | Supabase + SvelteKit</title>
</svelte:head>

<form class="row flex flex-center" method="POST" use:enhance={handleSubmit}>
	<div class="col-6 form-widget max-w-md w-full mx-auto p-4">
		<h1 class="header text-2xl font-bold mb-4">Create an Account</h1>
		<p class="description mb-6">Sign up with your email and password</p>
		{#if form?.message !== undefined}
		<div class="success {form?.success ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'} border p-3 mb-4 rounded">
			{form?.message}
		</div>
		{/if}
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
					class="w-full p-2 border rounded"
					type={passwordVisible ? "text" : "password"}
					placeholder="Create a password"
					required
				/>
				<button
					type="button"
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500"
					on:click={() => togglePasswordVisibility('password')}
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
		<div class="mb-4">
			<label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm Password</label>
			<div class="relative">
				<input
					id="confirmPassword"
					name="confirmPassword"
					class="w-full p-2 border rounded"
					type={confirmPasswordVisible ? "text" : "password"}
					placeholder="Confirm your password"
					required
				/>
				<button
					type="button"
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500"
					on:click={() => togglePasswordVisibility('confirmPassword')}
				>
					{confirmPasswordVisible ? "Hide" : "Show"}
				</button>
			</div>
			{#if form?.errors?.confirmPassword}
			<span class="text-sm text-red-600 mt-1">
				{form?.errors?.confirmPassword}
			</span>
			{/if}
		</div>
		<div class="mb-6">
			<button class="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
				{loading ? 'Loading...' : 'Sign up'}
			</button>
		</div>
		<div class="text-center text-sm">
			<p>Already have an account? <a href="/login" class="text-blue-600 hover:underline">Sign in</a></p>
		</div>
	</div>
</form>