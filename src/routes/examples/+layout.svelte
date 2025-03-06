<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}
	import { page } from '$app/stores';

	let { children }: Props = $props();

	let breadcrumbs: { title: string; href: string }[] = $state([]);

	$effect(() => {
		breadcrumbs = $page.data.breadcrumbs;
	});
</script>

<div class="px-4">
	<ol class="breadcrumb">
		{#each breadcrumbs as bc, index (bc.title)}
			{#if index === breadcrumbs.length - 1}
				<li>{bc.title}</li>
			{:else}
				<li class="crumb"><a class="anchor" href={bc.href}>{bc.title}</a></li>
				<li class="crumb-separator">/</li>
			{/if}
		{/each}
	</ol>

	{@render children?.()}
</div>
