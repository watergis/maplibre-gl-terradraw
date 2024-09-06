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
	import Navigation from './Navigation.svelte';

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

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	let title = 'Maplibre GL Terra Draw';
	let year = new Date().getFullYear();

	initializeStores();

	const drawerStore = getDrawerStore();

	const drawerOpen = () => {
		drawerStore.open({});
	};

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
					<a href="/"><strong class="text-xl uppercase">{title}</strong></a>
				</div>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<div class="hidden md:inline-block">
					<LightSwitch />
				</div>
				<div class="hidden md:inline-block">
					<a
						class="btn btn-sm variant-ghost-surface"
						href="https://twitter.com/j_igarashi"
						target="_blank"
						rel="noreferrer"
					>
						Twitter
					</a>
					<a
						class="btn btn-sm variant-ghost-surface"
						href="https://github.com/watergis/maplibre-gl-terradraw"
						target="_blank"
						rel="noreferrer"
					>
						GitHub
					</a>
				</div>
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>

	<Drawer>
		<h2 class="p-4">{title}</h2>
		<hr />
		<Navigation />
		<hr />
		<p class="px-8">Maintained by JinIgarashi</p>
		<p class="px-8">The source code is licensed MIT</p>
		<p class="px-8">The website content is licensed CC BY NC SA 4.0</p>
	</Drawer>

	<slot />

	<svelte:fragment slot="footer">
		<div class="space-y-2 py-4">
			<p class="flex justify-center space-x-2">©{year} Jin Igarashi</p>
		</div>
	</svelte:fragment>
</AppShell>
