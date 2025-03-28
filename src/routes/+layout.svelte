<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
	import '../app.postcss';

	import { page } from '$app/state';
	import type { PageData } from './$types';

	let year = new Date().getFullYear();

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

<div class="h-dvh grid grid-rows-[auto_1fr_auto]">
	<header class="sticky top-0 z-10">
		<AppBar>
			{#snippet lead()}
				<div class="flex items-center">
					<a href="/"><strong class="text-xl uppercase">{data.metadata.title}</strong></a>
				</div>
			{/snippet}
		</AppBar>
	</header>

	<main class="overflow-y-auto">
		{@render children?.()}
	</main>

	<footer>
		<hr />
		<div class="flex justify-between items-center px-2">
			<p class="text-left w-full pl-4">
				<a
					class="text-blue-600 visited:text-purple-600"
					href={data.metadata.contact}
					target="_blank"
				>
					©{year}
					{data.metadata.author}
				</a>
			</p>

			<nav class="flex flex-wrap justify-end gap-2 w-full pr-2">
				{#each data.nav as link (link.href)}
					<a
						class="btn hover:preset-tonal px-2"
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
	</footer>
</div>
