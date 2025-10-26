<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import CodeBlock from '../../CodeBlock.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};
	const { data }: Props = $props();

	let titleElement: HTMLElement | undefined = $state();

	afterNavigate(() => {
		titleElement?.scrollIntoView();
	});
</script>

<h4 class="h3 py-5 px-4" bind:this={titleElement}>{data.title}</h4>

<div class="pb-4 px-4">
	{data.description}
</div>

<iframe class="map-iframe" src={data.url} title={data.title}></iframe>

<div class="p-4">
	<CodeBlock lang="html" code={data.html} />
</div>

<style lang="scss">
	.map-iframe {
		position: relative;
		width: 100%;
		height: 50vh;
	}
</style>
