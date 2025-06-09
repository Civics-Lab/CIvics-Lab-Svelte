import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	optimizeDeps: {
		include: ['@hono/zod-validator'],
		exclude: []
	},
	build: {
		rollupOptions: {
			external: [
				'postgres',
				'drizzle-orm/postgres-js',
				'perf_hooks',
				'crypto',
				'stream'
			]
		}
	},
	ssr: {
		noExternal: ['@hono/zod-validator'],
	}
});
