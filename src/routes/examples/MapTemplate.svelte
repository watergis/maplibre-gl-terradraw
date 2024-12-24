<script lang="ts">
	import { GlobeControl, Map, NavigationControl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import '../../scss/maplibre-gl-terradraw.scss';
	import { untrack, type Snippet } from 'svelte';
	import { CodeBlock } from '@skeletonlabs/skeleton';

	type Props = {
		style: string;
		setTerradraw: (map: Map) => void;
		title: Snippet;
		description: Snippet;
		code: string;
	};
	const { style, title, description, setTerradraw, code }: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

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

			map.addControl(new GlobeControl(), 'bottom-right');

			if (setTerradraw) {
				setTerradraw(map);
			}

			map.once('load', () => {
				map?.resize();
			});
		})
	);
</script>

<h4 class="h3 px-4 py-5">{@render title()}</h4>

<div class="map" bind:this={mapContainer}></div>

<div class="contents">
	<div class="p-4">
		{@render description()}
	</div>
	{#if code}
		<div class="px-4 pb-4">
			<CodeBlock language="js" lineNumbers {code} />
		</div>
	{/if}
</div>

<style lang="scss">
	.map {
		position: relative;
		width: 100%;
		height: 50vh;
		background: linear-gradient(to right, #4286f4, #373b44);
	}

	.contents {
		position: relative;
		width: 100%;
		height: 50vh;
	}
</style>
