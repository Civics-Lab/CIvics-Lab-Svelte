<script lang="ts">
  import type { EditorJsData, EditorJsBlock } from '$lib/types/form';

  export let blocks: EditorJsData | undefined;
  export let bindings: Record<string, string> = {};

  /**
   * Replace field bindings in text
   */
  function replaceBindings(text: string): string {
    if (!bindings || Object.keys(bindings).length === 0) {
      return text;
    }

    let result = text;
    for (const [key, value] of Object.entries(bindings)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Render a single block based on its type
   */
  function renderBlock(block: EditorJsBlock): string {
    switch (block.type) {
      case 'header':
        const level = block.data.level || 2;
        const headerText = replaceBindings(block.data.text || '');
        return `<h${level} class="text-${5 - level}xl font-bold mb-4">${headerText}</h${level}>`;

      case 'paragraph':
        const paragraphText = replaceBindings(block.data.text || '');
        return `<p class="mb-4 leading-relaxed">${paragraphText}</p>`;

      case 'list':
        const items = block.data.items || [];
        const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
        const listClass = block.data.style === 'ordered' ? 'list-decimal' : 'list-disc';
        const listItems = items
          .map((item: string) => `<li>${replaceBindings(item)}</li>`)
          .join('');
        return `<${listType} class="${listClass} ml-6 mb-4 space-y-2">${listItems}</${listType}>`;

      case 'quote':
        const quoteText = replaceBindings(block.data.text || '');
        const caption = block.data.caption
          ? `<cite class="text-sm text-gray-600">${replaceBindings(block.data.caption)}</cite>`
          : '';
        return `<blockquote class="border-l-4 border-gray-300 pl-4 italic mb-4">${quoteText}${caption}</blockquote>`;

      case 'delimiter':
        return '<hr class="my-8 border-t border-gray-300" />';

      case 'image':
        const imageUrl = block.data.file?.url || '';
        const imageCaption = block.data.caption
          ? `<figcaption class="text-sm text-gray-600 text-center mt-2">${replaceBindings(block.data.caption)}</figcaption>`
          : '';
        return `<figure class="mb-6">
          <img src="${imageUrl}" alt="${block.data.caption || ''}" class="w-full rounded-lg" />
          ${imageCaption}
        </figure>`;

      case 'embed':
        const embedUrl = block.data.embed || '';
        const embedCaption = block.data.caption
          ? `<p class="text-sm text-gray-600 text-center mt-2">${replaceBindings(block.data.caption)}</p>`
          : '';
        return `<div class="mb-6">
          <div class="aspect-video">
            <iframe src="${embedUrl}" class="w-full h-full rounded-lg" frameborder="0" allowfullscreen></iframe>
          </div>
          ${embedCaption}
        </div>`;

      case 'code':
        const code = block.data.code || '';
        return `<pre class="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto"><code>${code}</code></pre>`;

      case 'linkTool':
        const linkUrl = block.data.link || '';
        const linkMeta = block.data.meta || {};
        return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="block p-4 border rounded-lg mb-4 hover:bg-gray-50">
          ${linkMeta.image ? `<img src="${linkMeta.image.url}" alt="" class="w-full h-48 object-cover rounded mb-2" />` : ''}
          <h3 class="font-semibold">${linkMeta.title || linkUrl}</h3>
          ${linkMeta.description ? `<p class="text-sm text-gray-600">${linkMeta.description}</p>` : ''}
        </a>`;

      default:
        console.warn('Unknown block type:', block.type);
        return '';
    }
  }
</script>

{#if blocks && blocks.blocks}
  <div class="block-renderer prose prose-sm max-w-none">
    {#each blocks.blocks as block (block.id || Math.random())}
      {@html renderBlock(block)}
    {/each}
  </div>
{:else}
  <p class="text-gray-400 italic">No content available</p>
{/if}

<style>
  .block-renderer {
    color: rgb(31 41 55);
  }

  :global(.block-renderer h1) {
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
  }

  :global(.block-renderer h2) {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
  }

  :global(.block-renderer h3) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    margin-top: 1.25rem;
  }

  :global(.block-renderer h4) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    margin-top: 1rem;
  }

  :global(.block-renderer a) {
    color: rgb(37 99 235);
    text-decoration: underline;
  }

  :global(.block-renderer a:hover) {
    color: rgb(30 64 175);
  }

  :global(.block-renderer strong) {
    font-weight: 700;
  }

  :global(.block-renderer em) {
    font-style: italic;
  }
</style>
