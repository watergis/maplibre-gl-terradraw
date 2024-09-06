<script lang="ts">
	import { Map, NavigationControl } from 'maplibre-gl';
	import { onMount } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { MaplibreTerradrawControl } from '$lib/MaplibreTerradrawControl.js';
	import '../scss/maplibre-gl-terradraw.scss';

	let mapContainer: HTMLDivElement;
	let map: Map;

	let selectedFeature = '';

	onMount(() => {
		map = new Map({
			container: mapContainer,
			style: 'https://demotiles.maplibre.org/style.json',
			center: [0, 0],
			zoom: 1,
			maxPitch: 85
		});

		map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');

		const drawControl = new MaplibreTerradrawControl({});
		map.addControl(drawControl, 'top-left');

		const drawInstance = drawControl.getTerraDrawInstance();
		drawInstance?.on('select', (id: string) => {
			const snapshot = drawInstance.getSnapshot();
			const feature = snapshot?.find((feature) => feature.id === id);
			selectedFeature = JSON.stringify(feature, null, 4);
		});
	});
</script>

<svelte:head>
	<style>
		html,
		body {
			padding: 0;
			margin: 0;
		}
	</style>
</svelte:head>

<div class="map" bind:this={mapContainer}>
	<div class="overlay" hidden={selectedFeature.length === 0}>
		<textarea class="selected-geometry" bind:value={selectedFeature} />
	</div>
</div>

<style lang="scss">
	.map {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
		z-index: 10;

		.overlay {
			position: absolute;
			bottom: 5px;
			left: 5px;
			z-index: 10;

			.selected-geometry {
				height: fit-content;
				min-height: 200px;
				max-height: 300px;
				width: 350px;
				overflow-y: auto;
				resize: none;
			}
		}
	}
</style>
