<script lang="ts">
	import { afterNavigate } from '$app/navigation';
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
</script>

<h4 class="h3 py-5 px-4" bind:this={titleElement}>{data.title}</h4>

<div class="pb-4 px-4">
	{data.description}
</div>

<iframe class="map-iframe" src={data.url} title={data.title}></iframe>

<div class="p-4">
	{data.html}
	<!-- <CodeBlock lang="html" code={data.html} /> -->
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
