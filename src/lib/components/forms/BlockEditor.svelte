<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { EditorJsData } from '$lib/types/form';
  import EditorJS from '@editorjs/editorjs';
  import Header from '@editorjs/header';
  import List from '@editorjs/list';
  import Paragraph from '@editorjs/paragraph';
  import Quote from '@editorjs/quote';
  import Delimiter from '@editorjs/delimiter';
  import Image from '@editorjs/image';
  import Link from '@editorjs/link';
  import Embed from '@editorjs/embed';
  import Code from '@editorjs/code';

  export let initialData: EditorJsData | undefined = undefined;
  export let onChange: ((data: EditorJsData) => void) | undefined = undefined;
  export let readOnly: boolean = false;
  export let placeholder: string = 'Start typing...';
  export let editorId: string = 'editorjs';

  let editor: EditorJS | null = null;
  let editorContainer: HTMLElement;

  /**
   * Initialize Editor.js
   */
  onMount(async () => {
    if (!editorContainer) return;

    editor = new EditorJS({
      holder: editorId,
      readOnly,
      placeholder,
      data: initialData,
      onChange: async () => {
        if (onChange && editor) {
          try {
            const data = await editor.save();
            onChange(data as EditorJsData);
          } catch (error) {
            console.error('Error saving editor data:', error);
          }
        }
      },
      tools: {
        header: {
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4],
            defaultLevel: 2
          }
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote author'
          }
        },
        delimiter: Delimiter,
        image: {
          class: Image,
          config: {
            uploader: {
              async uploadByFile(file: File) {
                // TODO: Implement image upload to storage
                return {
                  success: 1,
                  file: {
                    url: URL.createObjectURL(file)
                  }
                };
              },
              async uploadByUrl(url: string) {
                return {
                  success: 1,
                  file: { url }
                };
              }
            }
          }
        },
        link: {
          class: Link,
          config: {
            endpoint: '/api/link-preview' // Optional: for link previews
          }
        },
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              vimeo: true,
              twitter: true
            }
          }
        },
        code: Code
      }
    });

    await editor.isReady;
  });

  /**
   * Clean up Editor.js instance
   */
  onDestroy(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });

  /**
   * Expose save method for parent components
   */
  export async function save(): Promise<EditorJsData | null> {
    if (!editor) return null;

    try {
      const data = await editor.save();
      return data as EditorJsData;
    } catch (error) {
      console.error('Error saving editor:', error);
      return null;
    }
  }

  /**
   * Clear editor content
   */
  export async function clear(): Promise<void> {
    if (!editor) return;

    try {
      await editor.clear();
    } catch (error) {
      console.error('Error clearing editor:', error);
    }
  }
</script>

<div
  bind:this={editorContainer}
  id={editorId}
  class="block-editor prose prose-sm max-w-none"
></div>

<style>
  .block-editor {
    min-height: 200px;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
  }

  :global(.block-editor .codex-editor__redactor) {
    padding-bottom: 0 !important;
  }

  :global(.block-editor .ce-block__content) {
    max-width: 100%;
  }

  :global(.block-editor .ce-toolbar__content) {
    max-width: 100%;
  }
</style>
