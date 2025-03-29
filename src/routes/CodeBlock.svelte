<script module lang="ts">
	import { createHighlighterCoreSync, type HighlighterCore } from 'shiki/core';
	import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
	// Themes
	// https://shiki.style/themes
	import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
	// Languages
	// https://shiki.style/languages
	import console from 'shiki/langs/console.mjs';
	import css from 'shiki/langs/css.mjs';
	import html from 'shiki/langs/html.mjs';
	import js from 'shiki/langs/javascript.mjs';
	import { onMount } from 'svelte';

	interface CodeBlockProps {
		code?: string;
		lang?: 'console' | 'html' | 'css' | 'js';
		theme?: 'dark-plus';
		// Base Style Props
		base?: string;
		rounded?: string;
		shadow?: string;
		classes?: string;
		// Pre Style Props
		preBase?: string;
		prePadding?: string;
		preClasses?: string;
	}

	// https://shiki.style/guide/sync-usage
	let shiki: HighlighterCore | undefined = $state();
</script>

<script lang="ts">
	let {
		code = '',
		lang = 'console',
		theme = 'dark-plus',
		// Base Style Props
		base = 'overflow-hidden',
		rounded = 'rounded-sm',
		shadow = '',
		classes = '',
		// Pre Style Props
		preBase = '',
		prePadding = '[&>pre]:p-4',
		preClasses = ''
	}: CodeBlockProps = $props();

	// Shiki convert to HTML
	let generatedHtml = $state('');

	let copied = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	const copyToClipboard = () => {
		navigator.clipboard.writeText(code).then(() => {
			copied = true;
			clearTimeout(timeout);
			timeout = setTimeout(() => (copied = false), 2000);
		});
	};

	onMount(async () => {
		if (!shiki) {
			const engine = await createOnigurumaEngine(import('shiki/wasm'));
			shiki = createHighlighterCoreSync({
				engine: engine,
				// Implement your import theme.
				themes: [themeDarkPlus],
				// Implement your imported and supported languages.
				langs: [console, html, css, js]
			});
		}

		generatedHtml = shiki.codeToHtml(code, { lang, theme });
	});
</script>

<div class="group relative {base} {rounded} {shadow} {classes} {preBase} {prePadding} {preClasses}">
	<button
		class="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-sm text-white px-2 py-1 rounded transition transition-opacity opacity-0 group-hover:opacity-100"
		onclick={copyToClipboard}
	>
		{copied ? 'Copied' : 'Copy'}
	</button>

	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html generatedHtml}
</div>
