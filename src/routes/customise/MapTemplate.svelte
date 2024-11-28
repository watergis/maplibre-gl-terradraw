<script lang="ts">
	import { Map, NavigationControl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import '../../scss/maplibre-gl-terradraw.scss';
	import { untrack, type Snippet } from 'svelte';
	import { CodeBlock } from '@skeletonlabs/skeleton';

	type Props = {
		style: string;
		setTerradraw: (map: Map) => void;
		title: Snippet;
		description: Snippet;
	};
	const { style, title, description, setTerradraw }: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map;

	let codeSnippet = $state('');

	$effect(() =>
		untrack(() => {
			if (!mapContainer) return;
			map = new Map({
				container: mapContainer,
				style: style,
				center: [0, 0],
				zoom: 1,
				maxPitch: 85
			});

			map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');

			if (setTerradraw) {
				setTerradraw(map);

				codeSnippet = setTerradraw
					.toString()
					.replace(/^[^{]*{\s*/, '')
					.replace(/}\s*$/, '')
					.replace(/\t/g, '  ');
			}

			setTimeout(() => {
				map.resize();
			}, 500);
		})
	);
</script>

<h4 class="h3 px-4 py-5">{@render title()}</h4>

<div class="map" bind:this={mapContainer}></div>

<div class="contents">
	<div class="p-4">
		{@render description()}
	</div>
	{#if codeSnippet}
		<div class="px-4 pb-4">
			<CodeBlock language="js" lineNumbers code={codeSnippet} />
		</div>
	{/if}
</div>

<style lang="scss">
	.map {
		position: relative;
		width: 100%;
		height: 50%;
	}

	.contents {
		position: relative;
		width: 100%;
		height: 50%;
	}
</style>
