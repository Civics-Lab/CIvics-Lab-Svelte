<!-- src/routes/app/settings/account/general/+page.svelte -->
<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { writable, derived } from 'svelte/store';
    import { auth } from '$lib/auth/client';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    // User profile form state
    const profile = writable({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      avatar_url: ''
    });
    
    // Store original values to detect changes
    const originalProfile = writable({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      avatar_url: ''
    });
    
    // Determine if form has changes
    const hasChanges = derived([profile, originalProfile], ([$profile, $originalProfile]) => {
      return $profile.username !== $originalProfile.username
         || $profile.first_name !== $originalProfile.first_name
         || $profile.last_name !== $originalProfile.last_name
         || $profile.email !== $originalProfile.email;
    });
    
    // Password change form state
    const passwordForm = writable({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    
    // Username validation
    const usernameStatus = writable<'valid' | 'invalid' | 'checking' | 'unchanged' | null>(null);
    const usernameError = writable<string | null>(null);
    const usernameCheckTimeout = writable<NodeJS.Timeout | null>(null);
    
    // Loading states
    const isLoadingProfile = writable(true);
    const isUpdatingProfile = writable(false);
    const isChangingPassword = writable(false);
    const showPasswordForm = writable(false);
    
    // Error states
    const profileError = writable<string | null>(null);
    const passwordError = writable<string | null>(null);
    
    // Fetch user profile
    async function fetchUserProfile() {
      if (!$auth.user) return;
      
      isLoadingProfile.set(true);
      profileError.set(null);
      
      try {
        // Use the user data from the auth store
        const userData = $auth.user;
        
        const profileData = {
          username: userData.username || '',
          first_name: userData.displayName?.split(' ')[0] || '',
          last_name: userData.displayName?.split(' ').slice(1).join(' ') || '',
          email: userData.email || '',
          avatar_url: userData.avatar || ''  // Use the avatar from the auth store
        };
        
        profile.set(profileData);
        originalProfile.set({...profileData});
      } catch (err) {
        console.error('Error fetching user profile:', err);
        profileError.set('Failed to load profile');
      } finally {
        isLoadingProfile.set(false);
      }
    }
    
    // Check if username is available
    async function checkUsernameAvailability() {
      // Clear any existing timeout
      if ($usernameCheckTimeout) {
        clearTimeout($usernameCheckTimeout);
      }
      
      // Reset status if username is unchanged
      if ($profile.username === $originalProfile.username) {
        usernameStatus.set('unchanged');
        usernameError.set(null);
        return;
      }
      
      // Validate username format
      if (!$profile.username || $profile.username.length < 3) {
        usernameStatus.set('invalid');
        usernameError.set('Username must be at least 3 characters');
        return;
      }
      
      // Set timeout to avoid too many requests while typing
      const timeoutId = setTimeout(async () => {
        usernameStatus.set('checking');
        
        try {
          const response = await fetch('/api/auth/check-username', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${$auth.token}`
            },
            body: JSON.stringify({ username: $profile.username })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            if (data.available) {
              usernameStatus.set('valid');
              usernameError.set(null);
            } else {
              usernameStatus.set('invalid');
              usernameError.set('Username is already taken');
            }
          } else {
            throw new Error(data.error || 'Failed to check username');
          }
        } catch (err) {
          console.error('Error checking username:', err);
          usernameStatus.set('invalid');
          usernameError.set('Error checking username availability');
        }
      }, 500);
      
      usernameCheckTimeout.set(timeoutId);
    }
    
    // Update user profile
    async function updateProfile() {
      if (!$auth.user) return;
      
      // Validate username if it has changed
      if ($profile.username !== $originalProfile.username) {
        // Get the current status value
        let currentStatus = null;
        const unsubscribe = usernameStatus.subscribe(value => {
          currentStatus = value;
        });
        unsubscribe();
        
        // If checking, wait for it to finish
        if (currentStatus === 'checking') {
          await new Promise(resolve => {
            const statusWatcher = usernameStatus.subscribe(value => {
              if (value !== 'checking') {
                statusWatcher();
                resolve(value);
              }
            });
          });
          
          // Get updated status
          let unsubscribe2 = usernameStatus.subscribe(value => {
            currentStatus = value;
          });
          unsubscribe2();
        }
        
        // Only proceed if username is valid
        if (currentStatus !== 'valid' && currentStatus !== 'unchanged') {
          toastStore.error('Please correct the username issues before saving.');
          return;
        }
      }
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        // Prepare the update payload
        const updates: Record<string, any> = {};
        
        // Handle username update if changed
        if ($profile.username !== $originalProfile.username) {
          updates.username = $profile.username;
        }
        
        // Handle name update if changed
        if ($profile.first_name !== $originalProfile.first_name || 
            $profile.last_name !== $originalProfile.last_name) {
          
          updates.displayName = `${$profile.first_name} ${$profile.last_name}`.trim();
        }
        
        // Make the API request to update the user profile
        const response = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${$auth.token}`
          },
          body: JSON.stringify(updates)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update profile');
        }
        
        // Update auth store with new user data using the setUser method
        if (data.user && data.token) {
          auth.setUser(data.user, data.token);
        }
        
        // Update original profile values
        originalProfile.set({...$profile});
        
        toastStore.success('Profile updated successfully');
      } catch (err) {
        console.error('Error updating profile:', err);
        profileError.set(err instanceof Error ? err.message : 'Failed to update profile');
      } finally {
        isUpdatingProfile.set(false);
      }
    }
    
    // Update user email
    async function updateEmail() {
      if (!$auth.user || $profile.email === $originalProfile.email) return;
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        const response = await fetch('/api/auth/update-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${$auth.token}`
          },
          body: JSON.stringify({ email: $profile.email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update email');
        }
        
        // Update auth store with new user data
        if (data.user && data.token) {
          auth.setUser(data.user, data.token);
        }
        
        originalProfile.update(p => ({ ...p, email: $profile.email }));
        
        toastStore.success('Verification email sent to your new email address');
      } catch (err) {
        console.error('Error updating email:', err);
        profileError.set(err instanceof Error ? err.message : 'Failed to update email');
      } finally {
        isUpdatingProfile.set(false);
      }
    }
    
    // Toggle password change form
    function togglePasswordForm() {
      showPasswordForm.update(value => !value);
      
      if (!$showPasswordForm) {
        // Reset password form on close
        passwordForm.set({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        passwordError.set(null);
      }
    }
    
    // Change password
    async function changePassword() {
      if (!$auth.user) return;
      
      // Validate form
      if (!$passwordForm.current_password || !$passwordForm.new_password || !$passwordForm.confirm_password) {
        passwordError.set('All fields are required');
        return;
      }
      
      if ($passwordForm.new_password !== $passwordForm.confirm_password) {
        passwordError.set('New passwords do not match');
        return;
      }
      
      if ($passwordForm.new_password.length < 6) {
        passwordError.set('Password must be at least 6 characters');
        return;
      }
      
      isChangingPassword.set(true);
      passwordError.set(null);
      
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${$auth.token}`
          },
          body: JSON.stringify({
            current_password: $passwordForm.current_password,
            new_password: $passwordForm.new_password
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to change password');
        }
        
        toastStore.success('Password updated successfully');
        togglePasswordForm();
      } catch (err) {
        console.error('Error changing password:', err);
        passwordError.set(err instanceof Error ? err.message : 'Failed to change password');
      } finally {
        isChangingPassword.set(false);
      }
    }
    
    // Reset form to original values
    function resetForm() {
      profile.set({...$originalProfile});
      usernameStatus.set('unchanged');
      usernameError.set(null);
    }
    
    // Upload avatar
    async function uploadAvatar(event: Event): Promise<void> {
      if (!$auth.user) return;
      
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toastStore.error('Invalid file type. Only JPG, PNG, GIF, and WebP are supported.');
        return;
      }
      
      // Validate file size (limit to 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toastStore.error('File size exceeds the 2MB limit.');
        return;
      }
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        // Create form data to send the file
        const formData = new FormData();
        formData.append('avatar', file);
        
        // Upload to server
        const response = await fetch('/api/auth/upload-avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${$auth.token}`
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload avatar');
        }
        
        // Update auth store with new user data that includes the avatar
        if (data.user && data.token) {
          auth.setUser(data.user, data.token);
        }
        
        toastStore.success('Avatar uploaded successfully');
        
        // Reset the file input
        target.value = '';
      } catch (err) {
        console.error('Error uploading avatar:', err);
        profileError.set(err instanceof Error ? err.message : 'Failed to upload avatar');
      } finally {
        isUpdatingProfile.set(false);
      }
    }
    
    // Remove avatar
    async function removeAvatar(): Promise<void> {
      if (!$auth.user || !$auth.user.avatar) return;
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        // Update the user profile to remove the avatar
        const response = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${$auth.token}`
          },
          body: JSON.stringify({
            avatar: null // Set avatar to null to remove it
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to remove avatar');
        }
        
        // Update auth store
        if (data.user && data.token) {
          auth.setUser(data.user, data.token);
        }
        
        toastStore.success('Avatar removed successfully');
      } catch (err) {
        console.error('Error removing avatar:', err);
        profileError.set(err instanceof Error ? err.message : 'Failed to remove avatar');
      } finally {
        isUpdatingProfile.set(false);
      }
    }
    
    // Watch for username changes to validate
    $: if ($profile && $profile.username !== $originalProfile.username) {
      checkUsernameAvailability();
    }
    
    onMount(() => {
      if ($auth.user) {
        fetchUserProfile();
      }
    });
    
    // Update form when user changes
    $: if ($auth.user) {
      fetchUserProfile();
    }
  </script>
  
  <svelte:head>
    <title>Account Settings | Civics Lab</title>
  </svelte:head>
  
  <div class="p-6">
    <h2 class="text-xl font-bold mb-6">Account Settings</h2>
    
    {#if $isLoadingProfile}
      <div class="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    {:else if $profileError}
      <div class="bg-red-50 p-4 rounded-md mb-6">
        <p class="text-red-700">{$profileError}</p>
      </div>
    {:else}
      <!-- Profile Photo -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Profile Photo</h3>
        </div>
        <div class="p-6">
          <div class="flex items-center space-x-6">
            <div class="flex-shrink-0">
              {#if $auth.user?.avatar}
                <img class="h-24 w-24 rounded-full object-cover" src={$auth.user.avatar} alt="Profile avatar" />
              {:else}
                <div class="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                  <span class="text-3xl font-medium text-slate-800">
                    {($profile.first_name?.[0] || $profile.username?.[0] || '?').toUpperCase()}
                  </span>
                </div>
              {/if}
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Profile Picture</label>
              <div class="mt-1 flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  id="avatar-upload"
                  on:change={uploadAvatar}
                  disabled={$isUpdatingProfile}
                />
                <label
                  for="avatar-upload"
                  class="cursor-pointer py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Upload
                </label>
                {#if $auth.user?.avatar}
                  <button
                    type="button"
                    class="ml-3 py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    on:click={removeAvatar}
                    disabled={$isUpdatingProfile}
                  >
                    Remove
                  </button>
                {/if}
              </div>
              <p class="mt-2 text-xs text-gray-500">
                JPG, PNG, GIF or WebP. Max size 2MB.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Account Information -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Account Information</h3>
        </div>
        <div class="p-6">
          <form on:submit|preventDefault={updateProfile} class="space-y-6">
            <!-- Username Field -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div class="mt-1 relative">
                <input
                  id="username"
                  type="text"
                  bind:value={$profile.username}
                  class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md {$usernameStatus === 'invalid' ? 'border-red-300' : ''} {$usernameStatus === 'valid' ? 'border-green-300' : ''}"
                  disabled={$isUpdatingProfile}
                  placeholder="Enter username"
                />
                {#if $usernameStatus === 'checking'}
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <LoadingSpinner size="sm" />
                  </div>
                {:else if $usernameStatus === 'valid' && $profile.username !== $originalProfile.username}
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                {/if}
              </div>
              {#if $usernameError}
                <p class="mt-1 text-sm text-red-600">{$usernameError}</p>
              {:else}
                <p class="mt-1 text-xs text-gray-500">Your username is used to login to your account.</p>
              {/if}
            </div>
            
            <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-3">
                <label for="first-name" class="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <div class="mt-1">
                  <input
                    id="first-name"
                    type="text"
                    bind:value={$profile.first_name}
                    class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isUpdatingProfile}
                    placeholder="Enter first name"
                  />
                </div>
              </div>
  
              <div class="sm:col-span-3">
                <label for="last-name" class="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <div class="mt-1">
                  <input
                    id="last-name"
                    type="text"
                    bind:value={$profile.last_name}
                    class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isUpdatingProfile}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3">
              {#if $hasChanges}
                <button
                  type="button"
                  class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  disabled={$isUpdatingProfile}
                  on:click={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                  disabled={$isUpdatingProfile || ($usernameStatus === 'invalid' || $usernameStatus === 'checking') && $profile.username !== $originalProfile.username}
                >
                  {#if $isUpdatingProfile}
                    <div class="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span class="ml-2">Saving...</span>
                    </div>
                  {:else}
                    Save Changes
                  {/if}
                </button>
              {/if}
            </div>
          </form>
        </div>
      </div>
      
      <!-- Email Address -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Email Address</h3>
        </div>
        <div class="p-6">
          <form on:submit|preventDefault={updateEmail} class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  type="email"
                  bind:value={$profile.email}
                  class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  disabled={$isUpdatingProfile}
                />
              </div>
              <p class="mt-2 text-xs text-gray-500">
                Changing your email will require verification from the new address.
              </p>
            </div>
            
            <div class="flex justify-end">
              <button
                type="submit"
                class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                disabled={$isUpdatingProfile || $profile.email === $originalProfile.email}
              >
                {#if $isUpdatingProfile}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Updating...</span>
                  </div>
                {:else}
                  Update Email
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Password -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Password</h3>
        </div>
        <div class="p-6">
          {#if $showPasswordForm}
            <form on:submit|preventDefault={changePassword} class="space-y-6">
              {#if $passwordError}
                <div class="rounded-md bg-red-50 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800">{$passwordError}</h3>
                    </div>
                  </div>
                </div>
              {/if}
              
              <div>
                <label for="current-password" class="block text-sm font-medium text-gray-700">
                  Current password
                </label>
                <div class="mt-1">
                  <input
                    id="current-password"
                    type="password"
                    bind:value={$passwordForm.current_password}
                    class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isChangingPassword}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label for="new-password" class="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div class="mt-1">
                  <input
                    id="new-password"
                    type="password"
                    bind:value={$passwordForm.new_password}
                    class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isChangingPassword}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <div class="mt-1">
                  <input
                    id="confirm-password"
                    type="password"
                    bind:value={$passwordForm.confirm_password}
                    class="shadow-sm focus:ring-slate-500 focus:border-slate-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isChangingPassword}
                    required
                  />
                </div>
              </div>
              
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  on:click={togglePasswordForm}
                  disabled={$isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                  disabled={$isChangingPassword}
                >
                  {#if $isChangingPassword}
                    <div class="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span class="ml-2">Changing Password...</span>
                    </div>
                  {:else}
                    Change Password
                  {/if}
                </button>
              </div>
            </form>
          {:else}
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">
                  Update your password regularly to keep your account secure.
                </p>
              </div>
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                on:click={togglePasswordForm}
              >
                Change Password
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
