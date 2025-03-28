<script lang="ts">
	import { page } from '$app/state';
	import {
		AvailableModes,
		getDefaultModeOptions,
		MaplibreMeasureControl,
		MaplibreTerradrawControl,
		roundFeatureCoordinates,
		type AreaUnit,
		type DistanceUnit,
		type TerradrawMode
	} from '$lib';
	import {
		Accordion,
		AccordionItem,
		RadioGroup,
		RadioItem,
		RangeSlider
	} from '@skeletonlabs/skeleton';
	import MaplibreStyleSwitcherControl from '@undp-data/style-switcher';
	import '@undp-data/style-switcher/dist/maplibre-style-switcher.css';
	import {
		GeolocateControl,
		GlobeControl,
		Map,
		NavigationControl,
		ScaleControl
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { untrack } from 'svelte';
	import type { GeoJSONStoreFeatures } from 'terra-draw';
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
	let distancePrecision: number = $state(2);
	let areaUnit: AreaUnit = $state('metric');
	let areaPrecision: number = $state(2);
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
				(drawControl as MaplibreMeasureControl).distancePrecision = distancePrecision;
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
				(drawControl as MaplibreMeasureControl).areaPrecision = areaPrecision;
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
				style: data.styles[0].uri,
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
			map.addControl(new ScaleControl(), 'bottom-left');

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
					distancePrecision,
					areaPrecision,
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

			const styleSwitcherControl = new MaplibreStyleSwitcherControl(data.styles);
			map.addControl(styleSwitcherControl, 'bottom-left');

			map.once('load', () => {
				styleSwitcherControl.initialise();
				const initData = data.geojson.filter((f) =>
					(terradrawModes as string[]).includes(f.properties.mode)
				) as GeoJSONStoreFeatures[];
				if (initData.length > 0) {
					const result = drawInstance?.addFeatures(roundFeatureCoordinates(initData));
					if (result) {
						const invalid = result.filter((res) => res.valid !== true);
						if (invalid.length > 0) {
							console.log(invalid);
						}
					}

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
			<Accordion autocollapse>
				{#if isMeasure}
					<AccordionItem>
						{#snippet summary()}
							<p>Distance unit</p>
						{/snippet}
						{#snippet content()}
							<RadioGroup>
								{#each ['kilometers', 'miles', 'degrees', 'radians'] as unit (unit)}
									<RadioItem
										bind:group={distanceUnit}
										name="justify"
										value={unit}
										on:change={handleDistanceUnitChanged}
									>
										{#if unit === 'miles'}
											mi
										{:else if unit === 'degrees'}
											°
										{:else if unit === 'radians'}
											rad
										{:else}
											km
										{/if}
									</RadioItem>
								{/each}
							</RadioGroup>
						{/snippet}
					</AccordionItem>
					<AccordionItem>
						{#snippet summary()}
							<p>Area unit</p>
						{/snippet}
						{#snippet content()}
							<RadioGroup>
								{#each ['metric', 'imperial'] as unit (unit)}
									<RadioItem
										bind:group={areaUnit}
										name="justify"
										value={unit}
										on:change={handleAreaUnitChanged}>{unit}</RadioItem
									>
								{/each}
							</RadioGroup>
						{/snippet}
					</AccordionItem>
					<AccordionItem>
						{#snippet summary()}
							<p>Measure precision</p>
						{/snippet}
						{#snippet content()}
							<RangeSlider
								name="range-slider"
								bind:value={distancePrecision}
								min={0}
								max={10}
								step={1}
								ticked
								on:change={handleDistancePrecisionChanged}
							>
								<div class="flex justify-between items-center">
									<div class="font-bold">Distance precision (Line)</div>
									<div class="text-xs">{distancePrecision}</div>
								</div>
							</RangeSlider>

							<RangeSlider
								name="range-slider"
								bind:value={areaPrecision}
								min={0}
								max={10}
								step={1}
								ticked
								on:change={handleAreaPrecisionChanged}
							>
								<div class="flex justify-between items-center">
									<div class="font-bold">Area precision (Polygon)</div>
									<div class="text-xs">{areaPrecision}</div>
								</div>
							</RangeSlider>
						{/snippet}
					</AccordionItem>
					<AccordionItem>
						{#snippet summary()}
							<p>Compute elevation</p>
						{/snippet}
						{#snippet content()}
							<RadioGroup>
								{#each ['enabled', 'disabled'] as option (option)}
									<RadioItem
										bind:group={computeElevation}
										name="justify"
										value={option}
										on:change={handleComputeElevationChanged}
									>
										{option}
									</RadioItem>
								{/each}
							</RadioGroup>
						{/snippet}
					</AccordionItem>
				{/if}
				{#if selectedFeature.length > 0}
					<AccordionItem open>
						{#snippet summary()}
							<p>Selected feature</p>
						{/snippet}
						{#snippet content()}
							<div class="p-2">
								<p class="text-black">
									For Polygon, use <b>ctrl+s</b> to resize the feature, and use <b>ctrl+r</b> to rotate
									the feature.
								</p>
							</div>
							<div class="code-block">
								<CodeBlock lang="js" bind:code={selectedFeature}></CodeBlock>
							</div>
						{/snippet}
					</AccordionItem>
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
