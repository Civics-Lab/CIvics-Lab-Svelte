<script lang="ts">
  export let currentUrl: string | undefined = undefined;
  export let onUpload: (url: string) => void = () => {};
  export let workspaceId: string;

  let isDragging = false;
  let fileInput: HTMLInputElement;
  let uploading = false;

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  }

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    uploading = true;

    try {
      // TODO: Implement actual file upload to storage (Supabase, S3, etc.)
      // For now, create a blob URL
      const url = URL.createObjectURL(file);
      onUpload(url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      uploading = false;
    }
  }

  function removeLogo() {
    onUpload('');
  }

  function triggerFileInput() {
    fileInput.click();
  }
</script>

<div class="logo-uploader">
  {#if currentUrl}
    <!-- Logo Preview -->
    <div class="relative inline-block">
      <img
        src={currentUrl}
        alt="Form logo"
        class="h-24 w-auto rounded-lg border border-gray-200"
      />
      <button
        type="button"
        on:click={removeLogo}
        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        aria-label="Remove logo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else}
    <!-- Upload Area -->
    <div
      class="upload-area border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors {isDragging
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400'}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      on:click={triggerFileInput}
      on:keydown={(e) => e.key === 'Enter' && triggerFileInput()}
      role="button"
      tabindex="0"
    >
      {#if uploading}
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-sm text-gray-600">Uploading...</p>
        </div>
      {:else}
        <div class="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-sm font-medium text-gray-700 mb-2">
            Drop your logo here, or click to browse
          </p>
          <p class="text-xs text-gray-500">PNG, JPG, or SVG up to 2MB</p>
        </div>
      {/if}
    </div>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    on:change={handleFileSelect}
    class="hidden"
  />
</div>

<style>
  .upload-area {
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
