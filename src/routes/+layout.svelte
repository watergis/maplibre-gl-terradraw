<script lang="ts">
	import '../app.css';

	import { page } from '$app/state';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();
</script>

<svelte:head>
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

<div class="h-dvh grid grid-rows-[auto_1fr_auto]">
	<header class="sticky top-0 z-10 bg-gray-200 p-4">
		<div class="flex justify-between items-center">
			<a href="/"><strong class="text-xl text-nowrap uppercase">{data.metadata.title}</strong></a>

			<nav class="flex justify-end gap-1">
				{#each data.nav as link (link.href)}
					<a
						class="btn hover:preset-tonal px-1"
						href={link.href}
						target="_blank"
						title={link.icon}
						aria-label={link.icon}
					>
						<span><i class={link.icon}></i></span>
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<main class="w-screen overflow-y-auto">
		{@render children?.()}
	</main>
</div>
