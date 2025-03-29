<script lang="ts">
	import { createHighlighterCoreSync } from 'shiki/core';
	import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
	// Themes
	// https://shiki.style/themes
	import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
	// Languages
	// https://shiki.style/languages
	import console from 'shiki/langs/console.mjs';
	import css from 'shiki/langs/css.mjs';
	import html from 'shiki/langs/html.mjs';
	import js from 'shiki/langs/javascript.mjs';

	// https://shiki.style/guide/sync-usage
	const shiki = createHighlighterCoreSync({
		engine: createJavaScriptRegexEngine(),
		// Implement your import theme.
		themes: [themeDarkPlus],
		// Implement your imported and supported languages.
		langs: [console, html, css, js]
	});

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

	let {
		code = '',
		lang = 'console',
		theme = 'dark-plus'
		// Base Style Props
		// base = 'overflow-hidden',
		// rounded = 'rounded-sm',
		// shadow = '',
		// classes = '',
		// // Pre Style Props
		// preBase = '',
		// prePadding = '[&>pre]:p-4',
		// preClasses = ''
	}: CodeBlockProps = $props();

	// Shiki convert to HTML
	const generatedHtml = shiki.codeToHtml(code, { lang, theme });

	// let copied = $state(false);
	// let timeout: ReturnType<typeof setTimeout>;

	// const copyToClipboard = () => {
	// 	navigator.clipboard.writeText(code).then(() => {
	// 		copied = true;
	// 		clearTimeout(timeout);
	// 		timeout = setTimeout(() => (copied = false), 2000);
	// 	});
	// };
</script>

<!-- <div class="group relative {base} {rounded} {shadow} {classes} {preBase} {prePadding} {preClasses}"> -->
<!-- <button
		class="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-sm text-white px-2 py-1 rounded transition transition-opacity opacity-0 group-hover:opacity-100"
		onclick={copyToClipboard}
	>
		{copied ? 'Copied' : 'Copy'}
	</button>

	{@html generatedHtml} -->
<!-- </div> -->

<!-- Output Shiki's Generated HTML -->
<!-- eslint-disable svelte/no-at-html-tags -->
{@html generatedHtml}
