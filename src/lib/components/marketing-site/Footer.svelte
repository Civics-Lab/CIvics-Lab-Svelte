<!-- src/lib/components/marketing-site/Footer.svelte -->
<script lang="ts">
    import { FacebookIcon, InstagramIcon, YoutubeIcon } from '@lucide/svelte';
  </script>
  
  <footer class="bg-slate-50 px-8 py-10">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-0 md:justify-between">
      <!-- Left - Logo -->
      <div class="flex-shrink-0">
        <img 
          src="/images/logo.svg" 
          alt="Civics Lab" 
          class="w-10 h-10"
        />
      </div>
  
      <!-- Center - Copyright -->
      <div class="text-sm font-medium text-gray-500">
        © {new Date().getFullYear()} Civics Lab, LLC.
      </div>
  
      <!-- Right - Social Icons -->
      <div class="flex items-center gap-4">
        <a href="https://facebook.com" class="text-gray-400 hover:text-gray-600">
          <FacebookIcon class="w-5 h-5" />
        </a>
        <a href="https://bsky.app" class="text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 4.5l7.5 13H4.5L12 6.5z"/>
          </svg>
        </a>
        <a href="https://instagram.com" class="text-gray-400 hover:text-gray-600">
          <InstagramIcon class="w-5 h-5" />
        </a>
        <a href="https://youtube.com" class="text-gray-400 hover:text-gray-600">
          <YoutubeIcon class="w-5 h-5" />
        </a>
      </div>
    </div>
  </footer>