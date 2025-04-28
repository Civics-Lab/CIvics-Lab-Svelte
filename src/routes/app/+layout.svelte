<!-- src/routes/app/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  let loading = true;
  
  onMount(async () => {
    console.log('App layout mounted - verifying authentication');
    loading = true;
    
    // Check for redirect loops
    const loopCount = parseInt(sessionStorage.getItem('redirect_loop_count') || '0');
    sessionStorage.setItem('redirect_loop_count', (loopCount + 1).toString());
    
    console.log('Loading app page, checking authentication');
    
    // If we're in a potential loop, don't redirect automatically
    if (loopCount > 3) {
      console.error('Detected potential redirect loop - breaking the cycle');
      loading = false;
      sessionStorage.removeItem('redirect_loop_count');
      return;
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('No auth token found in localStorage');
      console.log('User not authenticated, redirecting to login page');
      // Add a small delay to prevent immediate redirects
      setTimeout(() => {
        window.location.href = '/login?reason=no_token';
      }, 500);
      return;
    }
    
    // Validate token with server
    try {
      console.log('Validating token with server');
      const isValid = await auth.validateToken();
      
      if (!isValid) {
        console.log('Token validation failed');
        auth.logout(); // Clear any invalid tokens
        console.log('User not authenticated, redirecting to login page');
        setTimeout(() => {
          window.location.href = '/login?reason=invalid_token';
        }, 500);
        return;
      }
      
      console.log('Token validated successfully');
      // Reset the loop counter on success
      sessionStorage.removeItem('redirect_loop_count');
    } catch (error) {
      console.error('Error validating token:', error);
      setTimeout(() => {
        window.location.href = '/login?reason=validation_error';
      }, 500);
      return;
    }
    
    loading = false;
  });
</script>

{#if loading}
  <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-2"></div>
      <p>Loading...</p>
    </div>
  </div>
{/if}
  
<div class="min-h-screen bg-gray-50">
  <slot />
</div>