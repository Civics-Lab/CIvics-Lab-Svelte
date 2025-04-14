<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { auth } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	let username = '';
	let password = '';
	let loading = false;
	let passwordVisible = false;
	let error = '';

	// Check if user is already logged in
	onMount(() => {
		// Get the auth token from localStorage
		const token = localStorage.getItem('auth_token');
		if (token) {
			console.log('User is already logged in, redirecting to app');
			goto('/app');
		}
	});

	async function handleLogin() {
		try {
			loading = true;
			error = '';
			console.log('Starting login process for:', username);
			
			const result = await auth.login(username, password);
			console.log('Login successful, preparing to navigate');
			
			// Add a small delay to ensure state is updated
			setTimeout(() => {
				console.log('Navigating to app page');
				// Redirect to app on successful login
				goto('/app');
			}, 100);
		} catch (err) {
			console.error('Login error:', err);
			error = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loading = false;
		}
	}

	const togglePasswordVisibility = () => {
		passwordVisible = !passwordVisible;
	}
</script>

<svelte:head>
	<title>Login | Civics Lab</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md flex flex-col">
		<div>
			<h1 class="header text-2xl font-bold">Welcome Back</h1>
			<p class="description font-semibold text-gray-600">Sign in to your account.</p>
			{#if error}
			<div class="bg-red-100 border border-red-500 text-red-800 p-3 mb-4 rounded">
				{error}
			</div>
			{/if}
		</div>
		<div class="mb-4">
			<label for="username" class="block text-sm font-medium mb-1">Username</label>
			<input
				id="username"
				bind:value={username}
				class="w-full p-2 border rounded"
				type="text"
				placeholder="Your username"
				required
			/>
		</div>
		<div class="mb-4">
			<label for="password" class="block text-sm font-medium mb-1">Password</label>
			<div class="relative">
				<input
					id="password"
					bind:value={password}
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
		</div>
		<div class="mb-6">
			<button 
				on:click|preventDefault={handleLogin}
				class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-950 text-white hover:bg-slate-800 h-10 px-4 py-2 w-full"
				disabled={loading}
			>
				{loading ? 'Loading...' : 'Sign in'}
			</button>
		</div>
		<div class="text-center text-sm">
			<p>Don't have an account? <a href="/signup" class="text-blue-600 hover:underline">Sign up</a></p>
		</div>
	</div>
</div>
