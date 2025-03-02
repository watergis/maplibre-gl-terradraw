<script lang="ts">
	import { page } from '$app/state';
	import { AppBar, Modal } from '@skeletonlabs/skeleton-svelte';
	import '../app.css';
	import type { PageData } from './$types';

	let year = new Date().getFullYear();

	let drawerState = $state(false);
	// const drawerStore = getDrawerStore();

	const drawerOpen = () => {
		drawerState = true;
	};

	const drawerClose = () => {
		drawerState = false;
	};

	interface Props {
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
		integrity="sha512-Kc323vGBEqzTmouAECnVceyQqyqdsSiqLQISBL29aUW4U/M7pSPA/gEUZQqv1cwx4OnYxTxve5UMg5GT6L4JJg=="
		crossorigin="anonymous"
		referrerpolicy="no-referrer"
	/>

	<title>{page.data.title}</title>
	<meta property="og:site_name" content={page.data.title} />
	<meta property="og:type" content="article" />
	<meta name="description" content={page.data.description} />
	<meta property="og:description" content={page.data.description} />
	<meta name="twitter:description" content={page.data.description} />
	<meta property="og:title" content={page.data.title} />
	<meta property="og:image" content={page.data.socialImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Maplibre GL Terra Draw" />
	<meta name="twitter:image" content={page.data.socialImage} />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<div class="h-screen grid grid-rows-[auto_1fr_auto]">
	<header class="sticky top-0 z-10">
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
					{#each data.nav as link}
						<a
							type="button"
							class="btn-icon btn-base rounded-full"
							href={link.href}
							target="_blank"
							rel="noreferrer"
							aria-label={link.icon}><span><i class={link.icon}></i></span></a
						>
					{/each}
				</div>
			{/snippet}
		</AppBar>
	</header>

	<Modal
		open={drawerState}
		onOpenChange={(e) => (drawerState = e.open)}
		triggerBase="btn preset-tonal"
		contentBase="bg-surface-100-900 p-4 space-y-4 shadow-xl w-[480px] h-screen"
		positionerJustify="justify-start"
		positionerAlign=""
		positionerPadding=""
		transitionsPositionerIn={{ x: -480, duration: 200 }}
		transitionsPositionerOut={{ x: -480, duration: 200 }}
	>
		{#snippet content()}
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
							<!-- <div class="px-4"><LightSwitch /></div> -->
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
			<footer>
				<button type="button" class="btn preset-filled" onclick={drawerClose}>Close Menu</button>
			</footer>
		{/snippet}
	</Modal>

	<main class="overflow-y-auto">
		{@render children?.()}
	</main>

	<footer class="">
		<div class="space-y-2 py-4">
			<p class="flex justify-center space-x-2">
				<a
					class="text-blue-600 visited:text-purple-600"
					href={data.metadata.contact}
					target="_blank">©{year} {data.metadata.author}</a
				>
			</p>
		</div>
	</footer>
</div>
