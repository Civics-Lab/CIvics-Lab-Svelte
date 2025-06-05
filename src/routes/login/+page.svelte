<!-- src/routes/login/+page.svelte -->
<script lang="ts">
	import { auth } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	let email = '';
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
			console.log('Starting login process for:', email);
			
			// Reset any loop counters
			sessionStorage.removeItem('redirect_loop_count');
			
			// Use email instead of username for the auth.login call
			const result = await auth.login(email, password);
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

<!-- Desktop and Mobile Layout -->
<div class="min-h-screen bg-gray-50 flex items-center justify-center md:grid md:grid-cols-2 md:p-0">
	<!-- Left side: Login Form -->
	<div class="w-full flex items-center justify-center md:h-screen p-6 md:p-8 bg-gray-50">
		<div class="w-full max-w-sm bg-gray-50 p-8 md:p-10">
			<!-- Company Logo/Name -->
			<div class="flex items-center justify-center mb-8">
				<div class="flex items-center space-x-3">
					<img src="/logo.svg" alt="Civics Lab" class="w-8 h-8" />
					<span class="text-xl font-semibold text-gray-900">Civics Lab</span>
				</div>
			</div>

			<!-- Login Header -->
			<div class="text-center mb-8">
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Login to your account</h1>
				<p class="text-gray-600">Enter your username below to login to your account</p>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="bg-red-50 border border-red-200 text-red-800 p-3 mb-6 rounded-lg text-sm">
					{error}
				</div>
			{/if}

			<!-- Login Form -->
			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<!-- Username Field -->
				<div class="space-y-2">
					<label for="username" class="block text-sm font-medium text-gray-900">Username</label>
					<input
						id="username"
						bind:value={email}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
						type="text"
						placeholder="username"
						required
					/>
				</div>

				<!-- Password Field -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="password" class="block text-sm font-medium text-gray-900">Password</label>
						<a href="/forgot-password" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">
							Forgot your password?
						</a>
					</div>
					<div class="relative">
						<input
							id="password"
							bind:value={password}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors bg-white text-gray-900 placeholder-gray-500"
							type={passwordVisible ? "text" : "password"}
							placeholder="••••••••"
							required
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
							on:click={togglePasswordVisibility}
						>
							<span class="sr-only">{passwordVisible ? "Hide password" : "Show password"}</span>
							{#if passwordVisible}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
								</svg>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- Login Button -->
				<button 
					type="submit"
					class="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={loading}
				>
					{loading ? 'Logging in...' : 'Login'}
				</button>

				<!-- Sign Up Link -->
				<div class="text-center mt-6">
					<span class="text-sm text-gray-600">Don't have an account?</span>
					<a href="/signup" class="text-sm text-gray-900 hover:underline font-medium ml-1">
						Sign up
					</a>
				</div>
			</form>
		</div>
	</div>

	<!-- Right side: Image (hidden on mobile, visible on tablet/desktop) -->
	<div class="hidden md:block md:h-screen bg-gray-100 relative overflow-hidden">
		<img 
			src="/images/civil-rights-march.jpg" 
			alt="Civil rights march" 
			class="w-full h-full object-cover"
		/>
	</div>
</div>
