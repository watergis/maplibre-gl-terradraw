<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import CodeBlock from '../../CodeBlock.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};
	const { data }: Props = $props();

	let year = new Date().getFullYear();

	let titleElement: HTMLElement | undefined = $state();

	afterNavigate(() => {
		titleElement?.scrollIntoView();
	});

	const getHtml = async () => {
		const response = await fetch(data.url);
		const text = await response.text();
		return text;
	};
</script>

<h4 class="h3 py-5 px-4" bind:this={titleElement}>{data.title}</h4>

<div class="pb-4 px-4">
	{data.description}
</div>

<iframe class="map-iframe" src={data.url} title={data.title}></iframe>

<div class="p-4">
	{#await getHtml()}
		<ProgressRing
			value={null}
			size="size-14"
			meterStroke="stroke-tertiary-600-400"
			trackStroke="stroke-tertiary-50-950"
		/>
	{:then html}
		<CodeBlock lang="html" code={html} />
	{/await}
</div>

<footer class="bg-gray-200 p-4">
	<p class="text-center w-full">
		<a class="text-blue-600 visited:text-purple-600" href={data.metadata.contact} target="_blank">
			©{year}
			{data.metadata.author}
		</a>
	</p>
</footer>

<style lang="scss">
	.map-iframe {
		position: relative;
		width: 100%;
		height: 50vh;
	}
</style>
