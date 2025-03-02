<script lang="ts">
	import { page } from '$app/state';
	import {
		AvailableModes,
		getDefaultModeOptions,
		MaplibreMeasureControl,
		MaplibreTerradrawControl,
		type AreaUnit,
		type DistanceUnit,
		type TerradrawMode
	} from '$lib';
	import { Accordion, Segment, Slider } from '@skeletonlabs/skeleton-svelte';
	import { GeolocateControl, GlobeControl, Map, NavigationControl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { untrack } from 'svelte';
	import { type GeoJSONStoreFeatures } from 'terra-draw';
	import '../../scss/maplibre-gl-terradraw.scss';
	import CodeBlock from '../CodeBlock.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

	const measure = page.url.searchParams.get('measure') ?? 'false';
	let isMeasure: boolean = measure === 'true';

	let selectedFeature = $state('');
	let distanceUnit: DistanceUnit = $state('kilometers');
	let distancePrecision: number[] = $state([2]);
	let areaUnit: AreaUnit = $state('metric');
	let areaPrecision: number[] = $state([2]);
	let computeElevation: 'enabled' | 'disabled' = $state('enabled');

	let drawControl: MaplibreTerradrawControl;

	const handleDistanceUnitChanged = () => {
		if (drawControl) {
			if (isMeasure) {
				(drawControl as MaplibreMeasureControl).distanceUnit = distanceUnit;
			}
		}
	};

	const handleDistancePrecisionChanged = () => {
		if (drawControl) {
			if (isMeasure) {
				(drawControl as MaplibreMeasureControl).distancePrecision = distancePrecision[0];
			}
		}
	};

	const handleAreaUnitChanged = () => {
		if (drawControl) {
			if (isMeasure) {
				(drawControl as MaplibreMeasureControl).areaUnit = areaUnit;
			}
		}
	};

	const handleAreaPrecisionChanged = () => {
		if (drawControl) {
			if (isMeasure) {
				(drawControl as MaplibreMeasureControl).areaPrecision = areaPrecision[0];
			}
		}
	};

	const handleComputeElevationChanged = () => {
		if (drawControl) {
			if (isMeasure) {
				(drawControl as MaplibreMeasureControl).computeElevation = computeElevation === 'enabled';
			}
		}
	};

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

			const modes = page.url.searchParams.get('modes') || '';
			let terradrawModes: TerradrawMode[] = [];
			if (modes.length > 0) {
				terradrawModes = modes.split(',') as TerradrawMode[];
			}
			if (terradrawModes.length === 0) {
				terradrawModes = ['render', ...AvailableModes.filter((m) => m !== 'render')];
			}

			const open = page.url.searchParams.get('open') || 'true';
			const isOpen = open === 'true' ? true : false;

			if (isMeasure) {
				drawControl = new MaplibreMeasureControl({
					modes: terradrawModes,
					open: isOpen,
					distanceUnit: distanceUnit,
					distancePrecision: distancePrecision[0],
					areaPrecision: areaPrecision[0],
					computeElevation: computeElevation === 'enabled'
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
			drawInstance?.on('select', (id: string | number) => {
				const snapshot = drawInstance.getSnapshot();
				const feature = snapshot?.find((feature: GeoJSONStoreFeatures) => feature.id === id);
				selectedFeature = JSON.stringify(feature, null, 4);
			});

			drawInstance?.on('change', () => {
				const snapshot = drawInstance.getSnapshot();
				const selectedFeatures = snapshot.filter(
					(f: GeoJSONStoreFeatures) => f.properties.selected === true
				);
				if (selectedFeatures.length === 0) {
					selectedFeature = '';
				}
			});

			map.once('load', () => {
				const initData = data.geojson.filter((f) =>
					(terradrawModes as string[]).includes(f.properties.mode)
				) as GeoJSONStoreFeatures[];
				if (initData.length > 0) {
					drawInstance?.addFeatures(initData);

					if (isMeasure) {
						map?.once('idle', () => {
							(drawControl as MaplibreMeasureControl).recalc();
						});
					}
				}
			});
		})
	);
</script>

<div class="map" bind:this={mapContainer}>
	{#if isMeasure || selectedFeature.length > 0}
		<div class="overlay p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
			<Accordion collapsible>
				{#if isMeasure}
					<Accordion.Item value="distanceUnit">
						{#snippet control()}
							<p>Distance unit</p>
						{/snippet}
						{#snippet panel()}
							<Segment
								value={distanceUnit}
								onValueChange={(e) => {
									distanceUnit = e.value as DistanceUnit;
									handleDistanceUnitChanged();
								}}
							>
								{#each ['kilometers', 'miles', 'degrees', 'radians'] as unit}
									<Segment.Item value={unit}>
										{#if unit === 'miles'}
											{'mi'}
										{:else if unit === 'degrees'}
											{'°'}
										{:else if unit === 'radians'}
											{'rad'}
										{:else}
											{'km'}
										{/if}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="areaUnit">
						{#snippet control()}
							<p>Area unit</p>
						{/snippet}
						{#snippet panel()}
							<Segment
								value={areaUnit}
								onValueChange={(e) => {
									areaUnit = e.value as AreaUnit;
									handleAreaUnitChanged();
								}}
							>
								{#each ['metric', 'imperial'] as unit}
									<Segment.Item value={unit}>{unit}</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="measurePrecision">
						{#snippet control()}
							<p>Measure precision</p>
						{/snippet}
						{#snippet panel()}
							<div class="flex justify-between items-center">
								<div class="font-bold">Distance precision (Line)</div>
								<div class="text-xs">{distancePrecision}</div>
							</div>
							<Slider
								name="range-slider"
								value={distancePrecision}
								min={0}
								max={10}
								step={1}
								onValueChange={(e) => {
									distancePrecision = e.value;
									handleDistancePrecisionChanged();
								}}
							></Slider>

							<div class="flex justify-between items-center">
								<div class="font-bold">Area precision (Polygon)</div>
								<div class="text-xs">{areaPrecision}</div>
							</div>
							<Slider
								name="range-slider"
								value={areaPrecision}
								min={0}
								max={10}
								step={1}
								onValueChange={(e) => {
									areaPrecision = e.value;
									handleAreaPrecisionChanged();
								}}
							></Slider>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="computeElevation">
						{#snippet control()}
							<p>Compute elevation</p>
						{/snippet}
						{#snippet panel()}
							<Segment
								value={computeElevation}
								onValueChange={(e) => {
									computeElevation = e.value as 'enabled' | 'disabled';
									handleComputeElevationChanged();
								}}
							>
								{#each ['enabled', 'disabled'] as option}
									<Segment.Item value={option}>
										{option}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
				{/if}
				{#if selectedFeature.length > 0}
					<Accordion.Item value="selectedFeature">
						{#snippet control()}
							<p>Selected feature</p>
						{/snippet}
						{#snippet panel()}
							<div class="p-2">
								<p class="text-black">
									For Polygon, use <b>ctrl+s</b> to resize the feature, and use <b>ctrl+r</b> to rotate
									the feature.
								</p>
							</div>
							<div class="code-block">
								<CodeBlock lang="js" code={selectedFeature}></CodeBlock>
							</div>
						{/snippet}
					</Accordion.Item>
				{/if}
			</Accordion>
		</div>
	{/if}
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
			min-width: 300px;

			height: fit-content;
			width: fit-content;

			.code-block {
				min-height: 200px;
				max-height: 300px;
				width: 100%;
				overflow-y: auto;
			}
		}
	}
</style>
