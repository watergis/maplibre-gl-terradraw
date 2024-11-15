<script lang="ts">
	import { GeolocateControl, Map, NavigationControl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { MaplibreTerradrawControl } from '$lib/MaplibreTerradrawControl.js';
	import '../../scss/maplibre-gl-terradraw.scss';
	import type { PageData } from './$types.js';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import type { TerradrawMode } from '$lib/interfaces/TerradrawMode.js';
	import { AvailableModes } from '$lib/constants/AvailableModes.js';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map;

	let selectedFeature = $state('');

	$effect(() => {
		if (!mapContainer) return;
		map = new Map({
			container: mapContainer,
			style: data.style,
			center: [0, 0],
			zoom: 1,
			maxPitch: 85,
			hash: true
		});

		map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');
		map.addControl(
			new GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			}),
			'bottom-right'
		);

		const modes = $page.url.searchParams.get('modes') || '';
		let terradrawModes: TerradrawMode[] = [];
		if (modes.length > 0) {
			terradrawModes = modes.split(',') as TerradrawMode[];
		}
		if (terradrawModes.length === 0) {
			terradrawModes = ['render', ...AvailableModes.filter((m) => m !== 'render')];
		}

		const open = $page.url.searchParams.get('open') || 'true';
		const isOpen = open === 'true' ? true : false;

		const drawControl = new MaplibreTerradrawControl({
			modes: terradrawModes,
			open: isOpen
		});
		map.addControl(drawControl, 'top-left');

		const drawInstance = drawControl.getTerraDrawInstance();
		drawInstance?.on('select', (id: string) => {
			const snapshot = drawInstance.getSnapshot();
			const feature = snapshot?.find((feature) => feature.id === id);
			selectedFeature = JSON.stringify(feature, null, 4);
		});

		drawInstance?.on('change', () => {
			const snapshot = drawInstance.getSnapshot();
			const selectedFeatures = snapshot.filter((f) => f.properties.selected === true);
			if (selectedFeatures.length === 0) {
				selectedFeature = '';
			}
		});
	});
</script>

<div class="map" bind:this={mapContainer}>
	<div class="overlay" hidden={selectedFeature.length === 0}>
		<div class="p-2">
			<p class="text-black">
				For Polygon, use <b>ctrl+s</b> to resize the feature, and use <b>ctrl+r</b> to rotate the feature.
			</p>
		</div>
		<CodeBlock language="javascript" bind:code={selectedFeature}></CodeBlock>
	</div>
</div>

<style lang="scss">
	.map {
		position: relative;
		width: 100%;
		height: 100%;

		.overlay {
			position: absolute;
			top: 5px;
			right: 5px;
			z-index: 10;

			height: fit-content;
			min-height: 200px;
			max-height: 300px;
			width: 350px;
			overflow-y: auto;

			background-color: white;
		}
	}
</style>
