<script lang="ts">
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
	import { Accordion, Segment, Slider } from '@skeletonlabs/skeleton-svelte';
	import MaplibreStyleSwitcherControl, { type StyleDefinition } from '@undp-data/style-switcher';
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
	import '../scss/maplibre-gl-terradraw.scss';
	import CodeBlock from './CodeBlock.svelte';

	interface Props {
		styles: StyleDefinition[];
		geojson: GeoJSONStoreFeatures[];
		controlType: 'default' | 'measure';
		modes: TerradrawMode[];
		isOpen: boolean;
	}

	let {
		styles,
		geojson,
		controlType = 'default',
		modes = JSON.parse(JSON.stringify(AvailableModes)),
		isOpen = true
	}: Props = $props();
	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

	let isMeasure: boolean = controlType === 'measure';

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
				style: styles[0].uri,
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

			if (isMeasure) {
				drawControl = new MaplibreMeasureControl({
					modes: modes,
					open: isOpen,
					distanceUnit: distanceUnit,
					distancePrecision: distancePrecision[0],
					areaPrecision: areaPrecision[0],
					computeElevation: computeElevation === 'enabled'
				});
				map.addControl(drawControl, 'top-left');
			} else {
				drawControl = new MaplibreTerradrawControl({
					modes: modes,
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

			const styleSwitcherControl = new MaplibreStyleSwitcherControl(styles);
			map.addControl(styleSwitcherControl, 'bottom-left');

			map.once('load', () => {
				styleSwitcherControl.initialise();
				const initData = geojson.filter((f) =>
					(modes as string[]).includes(f.properties.mode as string)
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

	let accodrionValue: string[] = $state(['selected-feature']);
</script>

<div class="map" bind:this={mapContainer}>
	{#if isMeasure || selectedFeature.length > 0}
		<div class="overlay p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
			<Accordion
				value={accodrionValue}
				onValueChange={(e) => (accodrionValue = e.value)}
				collapsible
			>
				{#if isMeasure}
					<Accordion.Item value="distance-unit">
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
								{#each ['kilometers', 'miles', 'degrees', 'radians'] as unit (unit)}
									<Segment.Item value={unit}>
										{#if unit === 'miles'}
											mi
										{:else if unit === 'degrees'}
											°
										{:else if unit === 'radians'}
											rad
										{:else}
											km
										{/if}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="area-unit">
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
								{#each ['metric', 'imperial'] as unit (unit)}
									<Segment.Item value={unit}>
										{unit}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="distance-precision">
						{#snippet control()}
							<p>Measure precision</p>
						{/snippet}
						{#snippet panel()}
							<div class="py-4">
								<div class="flex justify-between items-center mb-4">
									<div class="font-bold">Distance precision (Line)</div>
									<div class="text-xs">{distancePrecision}</div>
								</div>
								<Slider
									name="range-slider"
									value={distancePrecision}
									min={0}
									max={10}
									step={1}
									markers={[0, 5, 10]}
									onValueChange={(e) => {
										distancePrecision = e.value as number[];
										handleDistancePrecisionChanged();
									}}
								></Slider>
								<div class="flex justify-between items-center mt-8 mb-4">
									<div class="font-bold">Area precision (Polygon)</div>
									<div class="text-xs">{areaPrecision}</div>
								</div>
								<Slider
									name="range-slider"
									value={areaPrecision}
									min={0}
									max={10}
									step={1}
									markers={[0, 5, 10]}
									onValueChange={(e) => {
										areaPrecision = e.value as number[];
										handleAreaPrecisionChanged();
									}}
								></Slider>
							</div>
						{/snippet}
					</Accordion.Item>
					<Accordion.Item value="compute-elevation">
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
								{#each ['enabled', 'disabled'] as option (option)}
									<Segment.Item value={option}>
										{option}
									</Segment.Item>
								{/each}
							</Segment>
						{/snippet}
					</Accordion.Item>
				{/if}
				{#if selectedFeature.length > 0}
					<Accordion.Item value="selected-feature">
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
