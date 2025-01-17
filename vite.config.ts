import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['maplibre-gl', 'swagger-ui-dist']
	},
	server: {
		fs: {
			allow: ['./dist']
		}
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler'
			}
		}
	},
	esbuild: {
		platform: 'node',
		exclude: ['path', 'tty', 'util', 'os']
	}
});
