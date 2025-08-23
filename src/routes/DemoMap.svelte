<script module lang="ts">
	export interface DemoOptions {
		controlType: 'default' | 'measure' | 'valhalla';
		isOpen: 'open' | 'close' | undefined;
		modes: TerradrawMode[];
		distanceUnit: DistanceUnit;
		distancePrecision: number;
		areaUnit: AreaUnit;
		areaPrecision: number;
		computeElevation: 'enabled' | 'disabled';
		valhallaOptions: ValhallaOptions;
	}
</script>

<script lang="ts">
	import {
		AvailableModes,
		AvailableValhallaModes,
		costingModelOptions,
		getDefaultModeOptions,
		MaplibreMeasureControl,
		MaplibreTerradrawControl,
		MaplibreValhallaControl,
		roundFeatureCoordinates,
		routingDistanceUnitOptions,
		type AreaUnit,
		type costingModelType,
		type DistanceUnit,
		type routingDistanceUnitType,
		type TerradrawMode,
		type TerradrawValhallaMode,
		type ValhallaOptions
	} from '$lib';
	import IconPlus from '@lucide/svelte/icons/plus';
	import IconX from '@lucide/svelte/icons/x';
	import { Accordion, Segment, Slider, TagsInput } from '@skeletonlabs/skeleton-svelte';
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
		options: DemoOptions;
		onchange: (options: DemoOptions) => void;
		onclick?: () => void;
	}

	let {
		styles,
		geojson,
		options = $bindable({
			controlType: 'default',
			isOpen: 'open',
			modes: JSON.parse(JSON.stringify(AvailableModes)),
			distanceUnit: 'kilometers',
			distancePrecision: 2,
			areaUnit: 'metric',
			areaPrecision: 2,
			computeElevation: 'enabled',
			valhallaOptions: {
				url: '',
				routingOptions: {
					costingModel: 'pedestrian',
					distanceUnit: 'kilometers'
				},
				isochroneOptions: {
					contourType: 'time',
					costingModel: 'auto',
					contours: [
						{
							time: 3,
							distance: 1,
							color: 'ff0000'
						},
						{
							time: 5,
							distance: 2,
							color: 'ffff00'
						},
						{
							time: 10,
							distance: 3,
							color: '0000ff'
						},
						{
							time: 15,
							distance: 4,
							color: 'ff00ff'
						}
					]
				}
			}
		}),
		onchange = () => {},
		onclick = () => {}
	}: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state();
	let map: Map | undefined;

	let drawControl: MaplibreTerradrawControl | undefined = $state();
	let selectedFeature: string = $state('');

	let accordionValue = $state(['control-type']);
	let measureAccordionValue = $state([
		'distance-unit',
		'area-unit',
		'distance-precision',
		'area-precision',
		'compute-elevation'
	]);

	let valhallaAccordionValue = $state([
		'valhalla-url',
		'routing-means-of-transport',
		'routing-distance-unit'
	]);

	$effect(() => {
		if (selectedFeature) {
			untrack(() => {
				if (selectedFeature.length > 0) {
					accordionValue = [
						...accordionValue.filter((v) => v !== 'selected-feature'),
						'selected-feature'
					];
				} else {
					accordionValue = accordionValue.filter((v) => v !== 'selected-feature');
				}
			});
		}
	});

	const deleteControl = () => {
		if (!map) return;
		if (drawControl && map.hasControl(drawControl)) {
			map.removeControl(drawControl);
			drawControl = undefined;
		}
	};

	const addControl = () => {
		if (!map) return;

		deleteControl();

		if (options.modes.length === 0) return;

		if (options.controlType === 'measure') {
			drawControl = new MaplibreMeasureControl({
				modes: options.modes,
				open: options.isOpen === 'open',
				distanceUnit: options.distanceUnit,
				distancePrecision: options.distancePrecision,
				areaUnit: options.areaUnit,
				areaPrecision: options.areaPrecision,
				computeElevation: options.computeElevation === 'enabled',
				adapterOptions: {
					prefixId: 'td-measure'
				}
			});
			map.addControl(drawControl, 'top-left');
		} else if (options.controlType === 'valhalla') {
			const modes = options.modes.filter((mode) =>
				AvailableValhallaModes.includes(mode as TerradrawValhallaMode)
			) as TerradrawValhallaMode[];
			options.modes = modes as unknown as TerradrawMode[];
			drawControl = new MaplibreValhallaControl({
				modes: modes,
				open: options.isOpen === 'open',
				adapterOptions: {
					prefixId: 'td-valhalla'
				},
				valhallaOptions: options.valhallaOptions
			});
			map.addControl(drawControl, 'top-left');
		} else {
			drawControl = new MaplibreTerradrawControl({
				modes: options.modes,
				open: options.isOpen === 'open',
				modeOptions: getDefaultModeOptions(),
				adapterOptions: {
					prefixId: 'td-default'
				}
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

		// event listeners
		drawControl.on('mode-changed', (event) => {
			console.log('mode-changed', event);
		});
		drawControl.on('feature-deleted', (event) => {
			console.log('feature-deleted', event);
		});
		drawControl.on('collapsed', () => {
			console.log('collapsed');
		});
		drawControl.on('expanded', () => {
			console.log('expanded');
		});

		initialize_data();
	};

	const initialize_data = () => {
		if (options.modes.length === 0) return;
		if (!map) return;
		if (!drawControl) return;

		const initData = geojson.filter((f) =>
			(options.modes as string[]).includes(f.properties.mode as string)
		) as GeoJSONStoreFeatures[];
		if (initData.length > 0) {
			const drawInstance = drawControl.getTerraDrawInstance();
			if (drawInstance && drawInstance.enabled === false) {
				drawInstance.start();
			}
			const result = drawInstance?.addFeatures(roundFeatureCoordinates(initData));
			if (result) {
				const invalid = result.filter((res) => res.valid !== true);
				if (invalid.length > 0) {
					console.log(invalid);
				}
			}

			if (options.controlType === 'measure') {
				map?.once('idle', () => {
					(drawControl as MaplibreMeasureControl).recalc();
				});
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
			map.addControl(new GlobeControl(), 'bottom-right');
			map.addControl(new ScaleControl(), 'bottom-left');

			const styleSwitcherControl = new MaplibreStyleSwitcherControl(styles);
			map.addControl(styleSwitcherControl, 'bottom-left');

			map.once('load', () => {
				styleSwitcherControl.initialise();

				addControl();
			});
		})
	);
</script>

<div class="demo-container grid grid-cols-[auto_1fr] snap-start">
	<aside class="sidebar col-span-1 h-screen p-4 w-sm overflow-y-auto hidden md:block">
		<Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} multiple>
			<Accordion.Item value="control-type">
				{#snippet control()}
					<p class="font-bold uppercase">Control type</p>
				{/snippet}
				{#snippet panel()}
					<p class="pb-4">
						Default control is MaplibreTerradrawControl. If you want to use more advanced control,
						enable to choose MaplibreMeasureControl or MaplibreValhallaControl.
					</p>

					<Segment
						name="control-type"
						value={options.controlType}
						orientation="horizontal"
						onValueChange={(e) => {
							options.controlType = e.value as 'default' | 'measure';
							addControl();
							onchange(options);

							if (options.controlType === 'default') {
								accordionValue = accordionValue.filter((v) => v !== 'measure-option');
							}
							if (options.controlType === 'measure') {
								accordionValue = [
									...accordionValue.filter((v) => v !== 'measure-option'),
									'measure-option'
								];
							} else {
								accordionValue = [
									...accordionValue.filter((v) => v !== 'valhalla-option'),
									'valhalla-option'
								];
							}
						}}
					>
						<Segment.Item value="default">Default</Segment.Item>
						<Segment.Item value="measure">Measure</Segment.Item>
						<Segment.Item value="valhalla">Valhalla</Segment.Item>
					</Segment>
				{/snippet}
			</Accordion.Item>

			<Accordion.Item value="mode-selection">
				{#snippet control()}
					<p class="font-bold uppercase">Mode selection</p>
				{/snippet}
				{#snippet panel()}
					{@const availableModes =
						options.controlType === 'valhalla'
							? (AvailableValhallaModes as unknown as TerradrawMode[])
							: AvailableModes}
					<p class="pb-4">
						Your chosen options are automatically applied at the demo and the below usage code.
					</p>
					<p class="pb-4">
						By default, all Terra Draw modes will be added to the control. However, you might want
						to remove some drawing modes from your app.
					</p>

					<TagsInput
						name="terradraw-modes"
						placeholder="{options.modes.length === 0
							? 'Select at least a mode. '
							: ''}Select TerraDraw modes to be added"
						value={options.modes}
						onValueChange={(e) => {
							options.modes = e.value as TerradrawMode[];
							addControl();
							onchange(options);
						}}
						validate={(details) => availableModes.includes(details.inputValue as TerradrawMode)}
						editable={false}
					/>

					<nav class="flex flex-row mt-2 gap-2">
						<button
							type="button"
							class="btn preset-filled-primary-500"
							disabled={options.modes.length === availableModes.length}
							onclick={() => {
								options.modes = [
									...options.modes,
									...availableModes.filter((m) => !options.modes.includes(m))
								];
								addControl();
								onchange(options);
							}}
						>
							<IconPlus />
							<span>Add all</span>
						</button>
						<button
							type="button"
							class="btn preset-filled-error-500"
							disabled={options.modes.length === 0}
							onclick={() => {
								options.modes = [];
								addControl();
								onchange(options);
							}}
						>
							<IconX />
							<span>Delete all</span>
						</button>
					</nav>

					{#if options.modes.length < availableModes.length}
						{@const selectSize = availableModes.filter((m) => !options.modes.includes(m)).length}
						<select
							class="select rounded-container mt-2"
							size={selectSize === 1 ? selectSize + 1 : selectSize > 5 ? 5 : selectSize}
							onclick={(e) => {
								if (!(e.target && 'value' in e.target)) return;
								const selected = e.target.value as TerradrawMode;
								options.modes.push(selected);
								addControl();
								onchange(options);
							}}
						>
							{#each availableModes.filter((m) => !options.modes.includes(m)) as mode (mode)}
								<option value={mode}>{mode}</option>
							{/each}
						</select>
					{/if}
				{/snippet}
			</Accordion.Item>

			<Accordion.Item value="open-as-default">
				{#snippet control()}
					<p class="font-bold uppercase">Open as default</p>
				{/snippet}
				{#snippet panel()}
					<p class="pb-4">
						if you want the drawing tool to be always expanded, simplely remove `render` mode from
						constuctor options, then set `true` to `open` property.
					</p>
					<Segment
						name="is-open"
						value={options.isOpen}
						onValueChange={(e) => {
							options.isOpen = e.value as 'open' | 'close';
							addControl();
							onchange(options);
						}}
					>
						<Segment.Item value="open">Open as default</Segment.Item>
						<Segment.Item value="close">Close as default</Segment.Item>
					</Segment>
				{/snippet}
			</Accordion.Item>

			{#if selectedFeature.length > 0}
				<Accordion.Item value="selected-feature">
					{#snippet control()}
						<p class="font-bold uppercase">Selected feature</p>
					{/snippet}
					{#snippet panel()}
						<div class="p-2">
							<p class="text-black">
								For Polygon, use <b>ctrl+s</b> to resize the feature, and use <b>ctrl+r</b> to rotate
								the feature.
							</p>
						</div>
						<div class="code-block">
							<CodeBlock lang="js" code={selectedFeature} base="max-h-64 overflow-y-auto "
							></CodeBlock>
						</div>
					{/snippet}
				</Accordion.Item>
			{/if}

			{#if options.controlType === 'measure'}
				<Accordion.Item value="measure-option">
					{#snippet control()}
						<p class="font-bold uppercase">Measure control options</p>
					{/snippet}
					{#snippet panel()}
						<Accordion
							value={measureAccordionValue}
							onValueChange={(e) => (measureAccordionValue = e.value)}
							multiple
						>
							<Accordion.Item value="distance-unit">
								{#snippet control()}
									<p class="font-bold uppercase italic">Distance unit</p>
								{/snippet}
								{#snippet panel()}
									<Segment
										value={options.distanceUnit}
										onValueChange={(e) => {
											options.distanceUnit = e.value as DistanceUnit;
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).distanceUnit = options.distanceUnit;
											}
											onchange(options);
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
									<p class="font-bold uppercase italic">Area unit</p>
								{/snippet}
								{#snippet panel()}
									<Segment
										value={options.areaUnit}
										onValueChange={(e) => {
											options.areaUnit = e.value as AreaUnit;
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).areaUnit = options.areaUnit;
											}
											onchange(options);
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
									<p class="font-bold uppercase italic">Measure precision</p>
								{/snippet}
								{#snippet panel()}
									<div class="py-4">
										<div class="flex justify-between items-center mb-4">
											<div class="font-bold">Distance precision (Line)</div>
											<div class="text-xs">{options.distancePrecision}</div>
										</div>
										<Slider
											name="range-slider"
											value={[options.distancePrecision]}
											min={0}
											max={10}
											step={1}
											markers={[0, 5, 10]}
											onValueChange={(e) => {
												options.distancePrecision = e.value[0] as number;
												if (drawControl && options.controlType === 'measure') {
													(drawControl as MaplibreMeasureControl).distancePrecision =
														options.distancePrecision;
												}
												onchange(options);
											}}
										></Slider>
										<div class="flex justify-between items-center mt-8 mb-4">
											<div class="font-bold">Area precision (Polygon)</div>
											<div class="text-xs">{options.areaPrecision}</div>
										</div>
										<Slider
											name="range-slider"
											value={[options.areaPrecision]}
											min={0}
											max={10}
											step={1}
											markers={[0, 5, 10]}
											onValueChange={(e) => {
												options.areaPrecision = e.value[0] as number;
												if (drawControl && options.controlType === 'measure') {
													(drawControl as MaplibreMeasureControl).areaPrecision =
														options.areaPrecision;
												}
												onchange(options);
											}}
										></Slider>
									</div>
								{/snippet}
							</Accordion.Item>
							<Accordion.Item value="compute-elevation">
								{#snippet control()}
									<p class="font-bold uppercase italic">Compute elevation</p>
								{/snippet}
								{#snippet panel()}
									<Segment
										value={options.computeElevation}
										onValueChange={(e) => {
											options.computeElevation = e.value as 'enabled' | 'disabled';
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).computeElevation =
													options.computeElevation === 'enabled';
											}
											onchange(options);
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
						</Accordion>
					{/snippet}
				</Accordion.Item>
			{/if}

			{#if options.controlType === 'valhalla'}
				<Accordion.Item value="valhalla-option">
					{#snippet control()}
						<p class="font-bold uppercase">Valhalla control options</p>
					{/snippet}
					{#snippet panel()}
						<Accordion
							value={valhallaAccordionValue}
							onValueChange={(e) => (valhallaAccordionValue = e.value)}
							multiple
						>
							<Accordion.Item value="valhalla-url">
								{#snippet control()}
									<p class="font-bold uppercase italic">Valhalla API URL</p>
								{/snippet}
								{#snippet panel()}
									<input
										type="text"
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										value={options.valhallaOptions.url}
										onchange={(e) => {
											if (e.target) {
												options.valhallaOptions.url = (e.target as HTMLInputElement).value;
												onchange(options);
											}
										}}
									/>
									<p class="pb-4">
										Note. the example api URL of Valhalla control only supports the country of
										Kenya, Uganda and Rwanda in this demo. You need to deploy your own Valhalla API
										server for your application.
									</p>
								{/snippet}
							</Accordion.Item>

							<Accordion.Item value="routing-means-of-transport">
								{#snippet control()}
									<p class="font-bold uppercase italic">Means of transport for routing</p>
								{/snippet}
								{#snippet panel()}
									<Segment
										value={options.valhallaOptions.routingOptions?.costingModel}
										onValueChange={(e) => {
											if (!options.valhallaOptions.routingOptions) {
												options.valhallaOptions.routingOptions = {};
											} else {
												options.valhallaOptions.routingOptions.costingModel =
													e.value as costingModelType;
											}
											if (drawControl && options.controlType === 'valhalla') {
												(drawControl as MaplibreValhallaControl).routingCostingModel =
													options.valhallaOptions.routingOptions.costingModel ?? 'pedestrian';
											}
											onchange(options);
										}}
									>
										{#each costingModelOptions as item (item.value)}
											<Segment.Item value={item.value}>
												{item.label}
											</Segment.Item>
										{/each}
									</Segment>
								{/snippet}
							</Accordion.Item>

							<Accordion.Item value="routing-distance-unit">
								{#snippet control()}
									<p class="font-bold uppercase italic">Distance unit for routing</p>
								{/snippet}
								{#snippet panel()}
									<Segment
										value={options.valhallaOptions.routingOptions?.distanceUnit}
										onValueChange={(e) => {
											if (!options.valhallaOptions.routingOptions) {
												options.valhallaOptions.routingOptions = {};
											} else {
												options.valhallaOptions.routingOptions.distanceUnit =
													e.value as routingDistanceUnitType;
											}
											if (drawControl && options.controlType === 'valhalla') {
												(drawControl as MaplibreValhallaControl).routingDistanceUnit =
													options.valhallaOptions.routingOptions.distanceUnit ?? 'kilometers';
											}
											onchange(options);
										}}
									>
										{#each routingDistanceUnitOptions as item (item.value)}
											<Segment.Item value={item.value}>
												{item.label}
											</Segment.Item>
										{/each}
									</Segment>
								{/snippet}
							</Accordion.Item>
						</Accordion>
					{/snippet}
				</Accordion.Item>
			{/if}
		</Accordion>

		<div class="flex justify-center mt-6">
			<button class="btn btn-lg preset-filled capitalize" {onclick}> Getting started </button>
		</div>
	</aside>
	<main class="map col-span-2 md:col-span-1">
		<div class="map" bind:this={mapContainer}></div>

		<button
			class="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 btn btn-base preset-filled"
			{onclick}
		>
			Getting started
		</button>
	</main>
</div>

<style lang="scss">
	.demo-container {
		position: relative;
		width: 100%;
		height: 100%;

		.sidebar {
			height: 100%;
		}
		.map {
			position: relative;
			width: 100%;
			height: 100%;
			background: linear-gradient(to right, #4286f4, #373b44);
		}
	}
</style>
