import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Consult https://kit.svelte.dev/docs/integrations#preprocessors
			// for more information about preprocessors
			preprocess: vitePreprocess(),
			adapter: adapter()
		})
	],
	build: { minify: 'esbuild' },
	ssr: { noExternal: 'maplibre-gl' },
	server: { fs: { allow: ['./dist'] }, host: true },
	optimizeDeps: { include: ['maplibre-gl'] }
});
