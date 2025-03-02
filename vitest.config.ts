import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	test: {
		include: ['src/lib/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTest.ts'],
		coverage: {
			include: ['src/lib/**/*.{js,ts}'],
			exclude: ['src/lib/**/index.{js,ts}', 'src/lib/interfaces/**/*.{js,ts}'],
			reporter: ['text', 'json', 'html']
		}
	}
});
