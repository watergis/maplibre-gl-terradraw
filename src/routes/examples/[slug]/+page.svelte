<script lang="ts">
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import { afterNavigate } from '$app/navigation';

	type Props = {
		data: PageData;
	};
	const { data }: Props = $props();

	let titleElement: HTMLElement | undefined = $state();

	afterNavigate(() => {
		titleElement?.scrollIntoView();
	});
</script>

<h4 class="h3 px-4 py-5" bind:this={titleElement}>{data.title}</h4>

<div class="px-4 pb-4">
	{data.description}
</div>

<iframe class="map-iframe" src={data.url} title={data.title}></iframe>

<div class="contents">
	<div class="py-4">
		<CodeBlock language="html" lineNumbers code={data.html} />
	</div>
</div>

<style lang="scss">
	.map-iframe {
		position: relative;
		width: 100%;
		height: 50vh;
	}

	.contents {
		position: relative;
		width: 100%;
		height: 50vh;
	}
</style>
