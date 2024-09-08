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
	import shell from 'highlight.js/lib/languages/shell';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('shell', shell);
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
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

	export let data: PageData;

	onMount(() => {
		autoModeWatcher();
	});
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<div class="flex items-center">
					<button class="md:hidden btn btn-sm mr-4" on:click={drawerOpen}>
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
			</svelte:fragment>
			<svelte:fragment slot="trail">
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
						>
							{link.title}
						</a>
					{/each}
				</div>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>

	<Drawer>
		<h2 class="p-4">{data.metadata.title}</h2>
		<hr />

		<nav class="list-nav p-4">
			<ul>
				<li><a href="/" on:click={drawerClose}>Homepage</a></li>
				<li><a href="/demo" on:click={drawerClose}>Demo</a></li>
				{#each data.nav as link}
					<li>
						<a href={link.href} target="_blank" on:click={drawerClose}> {link.title} </a>
					</li>
				{/each}
				<li>
					<div class="flex items-center px-4">
						<span class="pr-4">Light/Dark switch</span>
						<span><LightSwitch /></span>
					</div>
				</li>
			</ul>
		</nav>

		<hr />
		<p class="px-8">©{year} {data.metadata.author}</p>
		{#each data.metadata.licenses as license}
			<p class="px-8">{license}</p>
		{/each}
	</Drawer>

	<slot />

	<svelte:fragment slot="footer">
		<div class="space-y-2 py-4">
			<p class="flex justify-center space-x-2">©{year} {data.metadata.author}</p>
		</div>
	</svelte:fragment>
</AppShell>
