import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// @ts-expect-error works fine
	plugins: [sveltekit()],
	css: {
		postcss: './postcss.config.js'
	}
});
