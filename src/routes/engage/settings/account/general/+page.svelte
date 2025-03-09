<!-- src/routes/engage/settings/account/general/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { userStore } from '$lib/stores/userStore';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    // User profile form state
    const profile = writable({
      first_name: '',
      last_name: '',
      email: '',
      avatar_url: ''
    });
    
    // Password change form state
    const passwordForm = writable({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    
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
      if (!$userStore.user) return;
      
      isLoadingProfile.set(true);
      profileError.set(null);
      
      try {
        // In a real app, this would fetch from a profiles table
        // For now, use data from the user object
        const userData = $userStore.user;
        
        profile.set({
          first_name: userData.user_metadata?.first_name || '',
          last_name: userData.user_metadata?.last_name || '',
          email: userData.email || '',
          avatar_url: userData.user_metadata?.avatar_url || ''
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        profileError.set('Failed to load profile');
      } finally {
        isLoadingProfile.set(false);
      }
    }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        profileError.set('Failed to load profile');
      } finally {
        isLoadingProfile.set(false);
      }
    }
    
    // Update user profile
    async function updateProfile() {
      if (!$userStore.user) return;
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        // Update user metadata
        const { error } = await data.supabase.auth.updateUser({
          data: {
            first_name: $profile.first_name,
            last_name: $profile.last_name
          }
        });
        
        if (error) throw error;
        
        // Update local user store if needed
        if ($userStore.user) {
          userStore.setUser({
            ...$userStore.user,
            user_metadata: {
              ...$userStore.user.user_metadata,
              first_name: $profile.first_name,
              last_name: $profile.last_name
            }
          });
        }
        
        toastStore.success('Profile updated successfully');
      } catch (err) {
        console.error('Error updating profile:', err);
        profileError.set('Failed to update profile');
      } finally {
        isUpdatingProfile.set(false);
      }
    }
    }
    
    // Update user email
    async function updateEmail() {
      if (!$userStore.user || $profile.email === $userStore.user.email) return;
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        const { error } = await data.supabase.auth.updateUser({
          email: $profile.email
        });
        
        if (error) throw error;
        
        toastStore.success('Verification email sent to your new email address');
      } catch (err) {
        console.error('Error updating email:', err);
        profileError.set('Failed to update email');
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
      if (!$userStore.user) return;
      
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
        const { error } = await data.supabase.auth.updateUser({
          password: $passwordForm.new_password
        });
        
        if (error) throw error;
        
        toastStore.success('Password updated successfully');
        togglePasswordForm();
      } catch (err) {
        console.error('Error changing password:', err);
        passwordError.set('Failed to change password');
      } finally {
        isChangingPassword.set(false);
      }
    }
    
    // Upload avatar
    async function uploadAvatar(event) {
      if (!$userStore.user) return;
      
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${$userStore.user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      isUpdatingProfile.set(true);
      profileError.set(null);
      
      try {
        // Upload to storage
        const { error: uploadError } = await data.supabase.storage
          .from('avatars')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = data.supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        if (!urlData.publicUrl) throw new Error('Failed to get public URL for avatar');
        
        // Update user metadata with new avatar URL
        const { error: updateError } = await data.supabase.auth.updateUser({
          data: {
            avatar_url: urlData.publicUrl
          }
        });
        
        if (updateError) throw updateError;
        
        // Update local user store
        if ($userStore.user) {
          userStore.setUser({
            ...$userStore.user,
            user_metadata: {
              ...$userStore.user.user_metadata,
              avatar_url: urlData.publicUrl
            }
          });
        }
        
        // Update local state
        profile.update(p => ({ ...p, avatar_url: urlData.publicUrl }));
        
        toastStore.success('Avatar updated successfully');
      } catch (err) {
        console.error('Error uploading avatar:', err);
        profileError.set('Failed to upload avatar');
      } finally {
        isUpdatingProfile.set(false);
      }
    }
    
    onMount(() => {
      if ($userStore.user) {
        fetchUserProfile();
      }
    });
    
    // Update form when user changes
    $: if ($userStore.user) {
      fetchUserProfile();
    }
  </script>
  
  <svelte:head>
    <title>Account Settings | Engage</title>
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
              {#if $profile.avatar_url}
                <img class="h-24 w-24 rounded-full object-cover" src={$profile.avatar_url} alt="Profile avatar" />
              {:else}
                <div class="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center">
                  <span class="text-3xl font-medium text-teal-800">
                    {($profile.first_name?.[0] || $profile.email?.[0] || '?').toUpperCase()}
                  </span>
                </div>
              {/if}
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Change photo</label>
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
                  class="cursor-pointer py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Upload
                </label>
                {#if $profile.avatar_url}
                  <button
                    type="button"
                    class="ml-3 py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    on:click={() => profile.update(p => ({ ...p, avatar_url: '' }))}
                    disabled={$isUpdatingProfile}
                  >
                    Remove
                  </button>
                {/if}
              </div>
              <p class="mt-2 text-xs text-gray-500">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Personal Information -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium">Personal Information</h3>
        </div>
        <div class="p-6">
          <form on:submit|preventDefault={updateProfile} class="space-y-6">
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
                    class="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isUpdatingProfile}
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
                    class="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isUpdatingProfile}
                  />
                </div>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button
                type="submit"
                class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                disabled={$isUpdatingProfile}
              >
                {#if $isUpdatingProfile}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Saving...</span>
                  </div>
                {:else}
                  Save
                {/if}
              </button>
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
                  class="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                disabled={$isUpdatingProfile || $profile.email === $userStore.user?.email}
              >
                {#if $isUpdatingProfile}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Saving...</span>
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
                    class="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                    class="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                    class="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    disabled={$isChangingPassword}
                    required
                  />
                </div>
              </div>
              
              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  class="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  on:click={togglePasswordForm}
                  disabled={$isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
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
                  Password last changed: Never
                </p>
              </div>
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                on:click={togglePasswordForm}
              >
                Change Password
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Account Deletion -->
      <div class="bg-white border rounded-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h3 class="text-lg font-medium text-red-600">Delete Account</h3>
        </div>
        <div class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <div class="flex justify-between items-center">
              <div>
                <h4 class="text-base font-medium text-red-800">Delete your account</h4>
                <p class="text-sm text-red-700 mt-1">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <button
                type="button"
                class="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>