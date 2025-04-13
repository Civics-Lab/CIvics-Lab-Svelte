<!-- src/routes/signup/+page.svelte -->
<script lang="ts">
	import { auth } from '$lib/auth/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	let email = data.invite?.email || '';
	let firstName = '';
	let lastName = '';
	let username = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let passwordVisible = false;
	let confirmPasswordVisible = false;
	let error = data.error || '';
	let success = false;
	let successMessage = '';

	// Whether this is an invite signup
	const isInviteSignup = !!data.invite;
	const inviteToken = data.invite?.token || $page.url.searchParams.get('invite');

	async function handleSignup() {
		// Reset status
		error = '';
		success = false;
		successMessage = '';

		// Form validation
		if (!email) {
			error = 'Email is required';
			return;
		}
		if (!firstName) {
			error = 'First name is required';
			return;
		}
		if (!lastName) {
			error = 'Last name is required';
			return;
		}
		if (!username) {
			error = 'Username is required';
			return;
		}
		if (!password) {
			error = 'Password is required';
			return;
		}
		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		try {
			loading = true;
			// Create display name from first and last name
			const displayName = `${firstName} ${lastName}`;
			
			// Pass the invite token if available
			const result = await auth.signup(email, username, password, displayName, inviteToken);
			
			// Signup successful - show success message
			success = true;
			
			// Message based on whether there were invites
			if (result.hasAcceptedInvites) {
				successMessage = 'Account created successfully! Connecting to your workspace...';
			} else {
				successMessage = 'Account created successfully! Redirecting to onboarding...';
			}
			
			// If user has accepted invites, redirect to app, otherwise to onboarding
			const redirectPath = result.hasAcceptedInvites ? '/app' : '/onboarding';
			
			// Redirect after a short delay to show the success message
			setTimeout(() => {
				goto(redirectPath);
			}, 1500);
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create account';
		} finally {
			loading = false;
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
	<title>Sign Up | Civics Lab</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-8">
	<div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
		<h1 class="text-2xl font-bold mb-4">Create an Account</h1>
		
		{#if isInviteSignup}
			<div class="bg-blue-100 border border-blue-500 text-blue-800 p-3 mb-4 rounded">
				<p class="font-medium">You've been invited to join a workspace!</p>
				<p>Complete this form to accept your invitation.</p>
			</div>
		{:else}
			<p class="text-gray-600 mb-6">Sign up to get started with Civics Lab</p>
		{/if}
		
		{#if error}
		<div class="bg-red-100 border border-red-500 text-red-800 p-3 mb-4 rounded">
			{error}
		</div>
		{/if}
		
		{#if success}
		<div class="bg-green-100 border border-green-500 text-green-800 p-3 mb-4 rounded">
			{successMessage}
		</div>
		{/if}
		
		<div class="mb-4">
			<label for="email" class="block text-sm font-medium mb-1">Email address</label>
			<input
				id="email"
				bind:value={email}
				class="w-full p-2 border rounded {isInviteSignup ? 'bg-gray-100' : ''}"
				type="email"
				placeholder="Your email"
				required
				readonly={isInviteSignup}
			/>
			{#if isInviteSignup}
				<p class="text-xs text-gray-500 mt-1">Email is set by your invitation</p>
			{/if}
		</div>
		
		<div class="grid grid-cols-2 gap-4 mb-4">
			<div>
				<label for="firstName" class="block text-sm font-medium mb-1">First Name</label>
				<input
					id="firstName"
					bind:value={firstName}
					class="w-full p-2 border rounded"
					type="text"
					placeholder="First name"
					required
				/>
			</div>
			
			<div>
				<label for="lastName" class="block text-sm font-medium mb-1">Last Name</label>
				<input
					id="lastName"
					bind:value={lastName}
					class="w-full p-2 border rounded"
					type="text"
					placeholder="Last name"
					required
				/>
			</div>
		</div>
		
		<div class="mb-4">
			<label for="username" class="block text-sm font-medium mb-1">Username</label>
			<input
				id="username"
				bind:value={username}
				class="w-full p-2 border rounded"
				type="text"
				placeholder="Choose a username"
				required
			/>
		</div>
		
		<div class="mb-4">
			<label for="password" class="block text-sm font-medium mb-1">Password</label>
			<div class="relative">
				<input
					id="password"
					bind:value={password}
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
		</div>
		
		<div class="mb-6">
			<label for="confirmPassword" class="block text-sm font-medium mb-1">Confirm Password</label>
			<div class="relative">
				<input
					id="confirmPassword"
					bind:value={confirmPassword}
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
		</div>
		
		<div class="mb-6">
			<button 
				on:click|preventDefault={handleSignup}
				class="w-full p-2 bg-slate-950 text-white rounded hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={loading || success}
			>
				{#if loading}
					Creating account...
				{:else if success}
					Account created!
				{:else if isInviteSignup}
					Accept Invitation & Sign up
				{:else}
					Sign up
				{/if}
			</button>
		</div>
		
		<div class="text-center text-sm">
			<p>Already have an account? <a href="/login" class="text-blue-600 hover:underline">Sign in</a></p>
		</div>
	</div>
</div>
