<!-- Timeline component for displaying recent workspace activity -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { 
    fetchRecentWorkspaceStreams, 
    type InteractionStream 
  } from '$lib/services/interactionStreamService';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { 
    MessageCircle, 
    Phone, 
    Mail, 
    Users, 
    StickyNote,
    Building2,
    User
  } from '@lucide/svelte';

  // Props
  export let limit = 10;

  // State
  const streams = writable<InteractionStream[]>([]);
  const isLoading = writable(true);
  const error = writable<string | null>(null);

  // Interaction type configuration
  const interactionTypes = {
    note: { icon: StickyNote, color: 'bg-blue-100 text-blue-600', label: 'Note' },
    call: { icon: Phone, color: 'bg-green-100 text-green-600', label: 'Call' },
    email: { icon: Mail, color: 'bg-purple-100 text-purple-600', label: 'Email' },
    in_person: { icon: Users, color: 'bg-orange-100 text-orange-600', label: 'In Person' }
  };

  // Helper functions
  function getInteractionTypeInfo(type: string) {
    return interactionTypes[type] || interactionTypes.note;
  }

  function formatDate(date: string | Date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }

  function formatFullDate(date: string | Date) {
    return new Date(date).toLocaleString();
  }

  function getEntityName(stream: InteractionStream) {
    if (stream.contactFirstName && stream.contactLastName) {
      return `${stream.contactFirstName} ${stream.contactLastName}`;
    }
    if (stream.businessName) {
      return stream.businessName;
    }
    return 'Unknown';
  }

  function getEntityType(stream: InteractionStream) {
    return stream.contactId ? 'contact' : 'business';
  }

  function getEntityIcon(stream: InteractionStream) {
    return stream.contactId ? User : Building2;
  }

  // Load recent streams
  async function loadRecentStreams() {
    if (!$workspaceStore.currentWorkspace) return;

    isLoading.set(true);
    error.set(null);

    try {
      const recentStreams = await fetchRecentWorkspaceStreams(
        $workspaceStore.currentWorkspace.id,
        limit
      );
      streams.set(recentStreams);
    } catch (err) {
      console.error('Error loading recent streams:', err);
      error.set('Failed to load recent activity');
    } finally {
      isLoading.set(false);
    }
  }

  // Initialize
  onMount(() => {
    loadRecentStreams();
  });

  // Reload when workspace changes
  $: if ($workspaceStore.currentWorkspace) {
    loadRecentStreams();
  }
</script>

<div class="bg-white p-6 rounded-lg shadow">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
    <button
      type="button"
      class="text-sm text-blue-600 hover:text-blue-700 font-medium"
      on:click={loadRecentStreams}
    >
      Refresh
    </button>
  </div>

  {#if $isLoading}
    <div class="flex justify-center py-8">
      <LoadingSpinner size="md" />
    </div>
  {:else if $error}
    <div class="text-center py-8">
      <p class="text-red-600 mb-2">{$error}</p>
      <button
        type="button"
        class="text-sm text-blue-600 hover:text-blue-700"
        on:click={loadRecentStreams}
      >
        Try again
      </button>
    </div>
  {:else if $streams.length === 0}
    <div class="text-center py-8 text-gray-500">
      <MessageCircle size={48} class="mx-auto mb-4 text-gray-400" />
      <p class="text-lg">No recent activity</p>
      <p class="text-sm">Interactions will appear here as you add them to contacts and businesses.</p>
    </div>
  {:else}
    <!-- Timeline -->
    <div class="space-y-4">
      {#each $streams as stream (stream.id)}
        <div class="flex gap-3">
          <!-- Timeline indicator -->
          <div class="flex flex-col items-center">
            {#if stream.interactionType}
              {@const typeInfo = getInteractionTypeInfo(stream.interactionType)}
              <div class="flex h-8 w-8 items-center justify-center rounded-full {typeInfo.color}">
                <svelte:component this={typeInfo.icon} size={16} />
              </div>
            {/if}
            {#if stream !== $streams[$streams.length - 1]}
              <div class="w-px h-6 bg-gray-200 mt-2"></div>
            {/if}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pb-4">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <!-- Header -->
                <div class="flex items-center gap-2 mb-1">
                  {#if stream.contactId || stream.businessId}
                    {@const EntityIcon = getEntityIcon(stream)}
                    <svelte:component this={EntityIcon} size={14} class="text-gray-500" />
                  {/if}
                  <span class="text-sm font-medium text-gray-900">
                    {getEntityName(stream)}
                  </span>
                  <span class="text-xs text-gray-500">•</span>
                  {#if stream.interactionType}
                    {@const typeInfo = getInteractionTypeInfo(stream.interactionType)}
                    <span class="text-xs text-gray-500 capitalize">
                      {typeInfo.label}
                    </span>
                  {/if}
                </div>

                <!-- Title -->
                <h4 class="text-sm font-medium text-gray-900 mb-1">
                  {stream.title}
                </h4>

                <!-- Content preview -->
                <p class="text-sm text-gray-600 line-clamp-2">
                  {stream.content}
                </p>
              </div>

              <!-- Timestamp -->
              <div class="flex-shrink-0 ml-4">
                <time 
                  class="text-xs text-gray-500"
                  title={formatFullDate(stream.interactionDate)}
                >
                  {formatDate(stream.interactionDate)}
                </time>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Show more button if at limit -->
    {#if $streams.length === limit}
      <div class="text-center mt-4 pt-4 border-t border-gray-200">
        <p class="text-sm text-gray-500">
          Showing {limit} most recent interactions
        </p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>