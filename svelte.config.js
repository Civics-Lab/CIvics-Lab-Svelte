import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Serverless function options
			runtime: 'nodejs18.x',
			
			// Ensure proper environment variable handling
			env: {
				publicPrefix: 'PUBLIC_',
				privatePrefix: ''
			},
			
			// Always external allows for proper handling of server dependencies
			external: ['postgres', 'drizzle-orm']
		})
	}
};

export default config;
