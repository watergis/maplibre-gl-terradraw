import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: 'maplibre-gl'
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
	resolve: {
		alias: {
			$api: resolve('./src/api')
		}
	}
});
