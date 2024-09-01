<script lang="ts">
	import { Map, NavigationControl } from 'maplibre-gl';
	import { onMount } from 'svelte';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { MaplibreTerradrawControl } from '$lib/MaplibreTerradrawControl.js';
	import '../scss/maplibre-gl-terradraw.scss';

	let mapContainer: HTMLDivElement;
	let map: Map;

	onMount(() => {
		map = new Map({
			container: mapContainer,
			style: 'https://demotiles.maplibre.org/style.json',
			center: [0, 0],
			zoom: 1,
			maxPitch: 85
		});

		map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');

		map.addControl(new MaplibreTerradrawControl(), 'top-left');
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

<div class="map" bind:this={mapContainer}></div>

<style lang="scss">
	.map {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100%;
		z-index: 10;
	}
</style>
