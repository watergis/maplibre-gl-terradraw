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

	interface Props {
		styles: StyleDefinition[];
		geojson: GeoJSONStoreFeatures[];
		controlType: 'default' | 'measure';
		modes: TerradrawMode[];
		isOpen: boolean;
		selectedFeature: string;
		distanceUnit: DistanceUnit;
		distancePrecision: number;
		areaUnit: AreaUnit;
		areaPrecision: number;
		computeElevation: 'enabled' | 'disabled';
	}

	let {
		styles,
		geojson,
		controlType = 'default',
		modes = JSON.parse(JSON.stringify(AvailableModes)),
		isOpen = true,
		selectedFeature = $bindable(''),
		distanceUnit = $bindable('kilometers'),
		distancePrecision = $bindable(2),
		areaUnit = $bindable('metric'),
		areaPrecision = $bindable(2),
		computeElevation = $bindable('enabled')
	}: Props = $props();
	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

	let isMeasure: boolean = $derived(controlType === 'measure');

	let drawControl: MaplibreTerradrawControl;

	$effect(() => {
		if (distanceUnit) {
			untrack(() => {
				if (drawControl && isMeasure) {
					(drawControl as MaplibreMeasureControl).distanceUnit = distanceUnit;
				}
			});
		}
	});

	$effect(() => {
		if (distancePrecision) {
			untrack(() => {
				if (drawControl && isMeasure) {
					(drawControl as MaplibreMeasureControl).distancePrecision = distancePrecision;
				}
			});
		}
	});

	$effect(() => {
		if (areaUnit) {
			untrack(() => {
				if (drawControl && isMeasure) {
					(drawControl as MaplibreMeasureControl).areaUnit = areaUnit;
				}
			});
		}
	});

	$effect(() => {
		if (areaPrecision) {
			untrack(() => {
				if (drawControl && isMeasure) {
					(drawControl as MaplibreMeasureControl).areaPrecision = areaPrecision;
				}
			});
		}
	});

	$effect(() => {
		if (computeElevation) {
			untrack(() => {
				if (drawControl && isMeasure) {
					(drawControl as MaplibreMeasureControl).computeElevation = computeElevation === 'enabled';
				}
			});
		}
	});

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

			const styleSwitcherControl = new MaplibreStyleSwitcherControl(styles);
			map.addControl(styleSwitcherControl, 'bottom-left');

			if (modes.length > 0) {
				if (isMeasure) {
					drawControl = new MaplibreMeasureControl({
						modes: modes,
						open: isOpen,
						distanceUnit: distanceUnit,
						distancePrecision: distancePrecision,
						areaPrecision: areaPrecision,
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
			}

			map.once('load', () => {
				styleSwitcherControl.initialise();
				if (modes.length === 0) return;
				const initData = geojson.filter((f) =>
					(modes as string[]).includes(f.properties.mode as string)
				) as GeoJSONStoreFeatures[];
				if (initData.length > 0) {
					const drawInstance = drawControl.getTerraDrawInstance();
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

<div class="map" bind:this={mapContainer}></div>

<style lang="scss">
	.map {
		position: relative;
		width: 100%;
		height: 100%;
		background: linear-gradient(to right, #4286f4, #373b44);
	}
</style>
