<script lang="ts">
	import { AppShell, AppBar, LightSwitch } from '@skeletonlabs/skeleton';
	import { autoModeWatcher } from '@skeletonlabs/skeleton';
	import '../app.postcss';

	// Highlight JS
	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import json from 'highlight.js/lib/languages/json';
	import shell from 'highlight.js/lib/languages/shell';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('shell', shell);
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types.js';

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	let year = new Date().getFullYear();

	initializeStores();

	const drawerStore = getDrawerStore();

	const drawerOpen = () => {
		drawerStore.open({});
	};

	const drawerClose = () => {
		drawerStore.close();
	};

	interface Props {
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	$effect(() => {
		autoModeWatcher();
	});
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
		integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg=="
		crossorigin="anonymous"
		referrerpolicy="no-referrer"
	/>
</svelte:head>

<!-- App Shell -->
<AppShell>
	{#snippet header()}
		<!-- App Bar -->
		<AppBar>
			{#snippet lead()}
				<div class="flex items-center">
					<button
						class="md:hidden btn btn-sm mr-4"
						aria-label={data.metadata.title}
						onclick={drawerOpen}
					>
						<span>
							<svg viewBox="0 0 100 80" class="fill-token w-4 h-4">
								<rect width="100" height="20" />
								<rect y="30" width="100" height="20" />
								<rect y="60" width="100" height="20" />
							</svg>
						</span>
					</button>
					<a href="/"><strong class="text-xl uppercase">{data.metadata.title}</strong></a>
				</div>
			{/snippet}
			{#snippet trail()}
				<div class="hidden md:inline-block">
					<LightSwitch />
				</div>
				<div class="hidden md:inline-block">
					{#each data.nav as link}
						<a
							class="btn btn-sm variant-ghost-surface ml-2"
							href={link.href}
							target="_blank"
							rel="noreferrer"
							aria-label={link.icon}
						>
							<span><i class={link.icon}></i></span>
						</a>
					{/each}
				</div>
			{/snippet}
		</AppBar>
	{/snippet}

	<Drawer>
		<h2 class="p-4">{data.metadata.title}</h2>
		<hr />

		<nav class="list-nav p-4">
			<ul>
				<li><a href="/" onclick={drawerClose}>Homepage</a></li>
				<li><a href="/demo" onclick={drawerClose}>Demo</a></li>
				<li><a href="/examples" onclick={drawerClose}>Examples</a></li>
				<li>
					<a href="https://watergis.github.io/maplibre-gl-terradraw" onclick={drawerClose}
						>API Docs</a
					>
				</li>

				<li>
					<div class="flex items-center py-2">
						<div class="px-4"><LightSwitch /></div>
						{#each data.nav as link}
							<a href={link.href} target="_blank" onclick={drawerClose} aria-label={link.icon}>
								<span><i class={link.icon}></i></span>
							</a>
						{/each}
					</div>
				</li>
				<li>
					<p class="px-4 py-2">©{year} {data.metadata.author}</p>
				</li>
				{#each data.metadata.licenses as license}
					<li>
						<p class="px-4 py-2">{license}</p>
					</li>
				{/each}
			</ul>
		</nav>
	</Drawer>

	{@render children?.()}

	{#snippet footer()}
		<div class="space-y-2 py-4">
			<p class="flex justify-center space-x-2">©{year} {data.metadata.author}</p>
		</div>
	{/snippet}
</AppShell>
