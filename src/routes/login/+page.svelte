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
		// Clear any potential loop indicators
		const loopCount = sessionStorage.getItem('redirect_loop_count');
		if (loopCount && parseInt(loopCount) > 3) {
			console.error('Detected potential redirect loop - clearing all auth data');
			// Force clear all auth data to break the loop
			localStorage.removeItem('auth_token');
			localStorage.removeItem('auth_user');
			document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
			sessionStorage.removeItem('redirect_loop_count');
			return;
		}
		
		// Get the auth token from localStorage
		const token = localStorage.getItem('auth_token');
		if (token) {
			console.log('Token found in localStorage, checking if valid');
			// We'll verify the token but not redirect automatically
			// This helps break potential redirect loops
			return;
		}
		
		// Clear any stale auth data if we're on the login page
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_user');
		// Also clear any auth cookies
		document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
	});

	async function handleLogin() {
		try {
			loading = true;
			error = '';
			console.log('Starting login process for:', username);
			
			// Reset any loop counters
			sessionStorage.removeItem('redirect_loop_count');
			
			const result = await auth.login(username, password);
			console.log('Login successful, preparing to navigate');
			
			// Verify we have a token before redirecting
			if (result && result.token) {
				console.log('Login successful! Token received and stored.');
				console.log('User authenticated as:', result.user?.username);
				console.log('Navigating to app page with token');
				
				// Add a small delay before redirect
				setTimeout(() => {
					// Redirect to app on successful login using window.location for a hard redirect
					window.location.href = '/app'; 
				}, 500);
				return; // Prevent further execution
			} else {
				console.error('Login succeeded but no token received');
				error = 'Authentication error: No token received';
			}
		} catch (err) {
			console.error('Login error:', err);
			// More detailed error message
			if (err instanceof Error) {
				if (err.message === 'Invalid credentials') {
					error = 'Username or password is incorrect. Please try again.';
				} else {
					error = err.message;
				}
			} else {
				error = 'Login failed. Please try again later.';
			}
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
	</div>
</div>
