<script lang="ts">
	import { GeolocateControl, Map, NavigationControl, GlobeControl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {
		MaplibreTerradrawControl,
		type TerradrawMode,
		AvailableModes,
		getDefaultModeOptions,
		AvailableMeasureModes,
		MaplibreMeasureControl,
		type MeasureControlMode
	} from '$lib/index.js';
	import '../../scss/maplibre-gl-terradraw.scss';
	import type { PageData } from './$types.js';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import { page } from '$app/state';
	import { untrack } from 'svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

	let selectedFeature = $state('');

	$effect(() =>
		untrack(() => {
			if (!mapContainer) return;
			map = new Map({
				container: mapContainer,
				style: data.style,
				center: [18.28, 6.25],
				zoom: 2.5,
				maxPitch: 85
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
			map.addControl(new GlobeControl(), 'bottom-right');

			const measure = page.url.searchParams.get('measure') ?? 'false';
			let isMeasure: boolean = measure === 'true';

			const modes = page.url.searchParams.get('modes') || '';
			let terradrawModes: TerradrawMode[] = [];
			if (modes.length > 0) {
				terradrawModes = modes.split(',') as TerradrawMode[];
			}
			if (terradrawModes.length === 0) {
				terradrawModes = [
					'render',
					...(isMeasure ? AvailableMeasureModes : AvailableModes).filter((m) => m !== 'render')
				];
			}

			const open = page.url.searchParams.get('open') || 'true';
			const isOpen = open === 'true' ? true : false;

			let drawControl: MaplibreTerradrawControl;
			if (isMeasure) {
				drawControl = new MaplibreMeasureControl({
					modes: terradrawModes as unknown as MeasureControlMode[],
					open: isOpen
				});
				map.addControl(drawControl, 'top-left');
			} else {
				drawControl = new MaplibreTerradrawControl({
					modes: terradrawModes,
					open: isOpen,
					modeOptions: getDefaultModeOptions()
				});
				map.addControl(drawControl, 'top-left');
			}

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

			map.once('load', () => {
				const initData = data.geojson.filter((f) =>
					(terradrawModes as string[]).includes(f.properties.mode)
				);
				if (initData.length > 0) {
					drawInstance?.addFeatures(initData);
				}
			});
		})
	);
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
		background: linear-gradient(to right, #4286f4, #373b44);

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
