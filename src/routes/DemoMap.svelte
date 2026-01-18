<script module lang="ts">
	export interface DemoOptions {
		controlType: 'default' | 'measure' | 'valhalla';
		isOpen: 'open' | 'close' | undefined;
		showDeleteConfirmation: boolean | undefined;
		modes: TerradrawMode[];
		measureUnitType: MeasureUnitType;
		distancePrecision: number;
		forceDistanceUnit: MetricDistanceUnit | ImperialDistanceUnit | 'auto';
		areaPrecision: number;
		forceAreaUnit: forceAreaUnitType;
		computeElevation: 'enabled' | 'disabled';
		valhallaOptions: ValhallaOptions;
	}
</script>

<script lang="ts">
	import {
		AvailableModes,
		AvailableValhallaModes,
		costingModelOptions,
		defaultMeasureUnitSymbols,
		getDefaultModeOptions,
		MaplibreMeasureControl,
		MaplibreTerradrawControl,
		MaplibreValhallaControl,
		roundFeatureCoordinates,
		routingDistanceUnitOptions,
		type Contour,
		type ContourType,
		type costingModelType,
		type forceAreaUnitType,
		type forceDistanceUnitType,
		type ImperialDistanceUnit,
		type MeasureUnitType,
		type MetricDistanceUnit,
		type routingDistanceUnitType,
		type TerradrawMode,
		type TerradrawValhallaMode,
		type ValhallaOptions
	} from '$lib';
	import Info from '@lucide/svelte/icons/info';
	import IconPlus from '@lucide/svelte/icons/plus';
	import IconX from '@lucide/svelte/icons/x';
	import {
		Accordion,
		Combobox,
		Portal,
		Slider,
		Switch,
		Tabs,
		Tooltip,
		useListCollection
	} from '@skeletonlabs/skeleton-svelte';
	import MaplibreStyleSwitcherControl, { type StyleDefinition } from '@undp-data/style-switcher';
	import '@undp-data/style-switcher/dist/maplibre-style-switcher.css';
	import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';
	import {
		GeolocateControl,
		GlobeControl,
		Map,
		NavigationControl,
		ScaleControl,
		TerrainControl
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount, untrack } from 'svelte';
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
			showDeleteConfirmation: false,
			modes: JSON.parse(JSON.stringify(AvailableModes)),
			measureUnitType: 'metric',
			distancePrecision: 2,
			forceDistanceUnit: 'auto',
			areaUnit: 'metric',
			areaPrecision: 2,
			forceAreaUnit: 'auto',
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
							color: '#ff0000'
						},
						{
							time: 5,
							distance: 2,
							color: '#ffff00'
						},
						{
							time: 10,
							distance: 3,
							color: '#0000ff'
						},
						{
							time: 15,
							distance: 4,
							color: '#ff00ff'
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
	let modeSearchText: string = $state('');

	let accordionValue = $state(['control-type']);
	let measureAccordionValue = $state([
		'measure-unit-type',
		'distance-precision',
		'area-precision',
		'force-distance-unit',
		'force-area-unit',
		'compute-elevation'
	]);

	let valhallaAccordionValue = $state([
		'valhalla-url',
		'routing-means-of-transport',
		'routing-distance-unit',
		'isochrone-means-of-transport',
		'isochrone-contour-type',
		'isochrone-contours'
	]);

	let valhallaGroup: 'routing' | 'isochrone' = $state('routing');

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
				showDeleteConfirmation: options.showDeleteConfirmation,
				measureUnitType: options.measureUnitType,
				forceDistanceUnit:
					options.forceDistanceUnit === 'auto' ? undefined : options.forceDistanceUnit,
				distancePrecision: options.distancePrecision,
				areaPrecision: options.areaPrecision,
				forceAreaUnit: options.forceAreaUnit,
				computeElevation: options.computeElevation === 'enabled',
				adapterOptions: {
					prefixId: 'td-measure'
				}
			});
			(drawControl as MaplibreMeasureControl).fontGlyphs = ['Noto Sans Medium'];
			map.addControl(drawControl, 'top-left');
		} else if (options.controlType === 'valhalla') {
			const modes = options.modes.filter((mode) =>
				AvailableValhallaModes.includes(mode as (typeof AvailableValhallaModes)[number])
			) as TerradrawValhallaMode[];
			options.modes = modes as unknown as TerradrawMode[];
			drawControl = new MaplibreValhallaControl({
				modes: modes,
				open: options.isOpen === 'open',
				showDeleteConfirmation: options.showDeleteConfirmation,
				adapterOptions: {
					prefixId: 'td-valhalla'
				},
				valhallaOptions: options.valhallaOptions
			});
			(drawControl as MaplibreValhallaControl).fontGlyphs = ['Noto Sans Medium'];
			map.addControl(drawControl, 'top-left');
		} else {
			drawControl = new MaplibreTerradrawControl({
				modes: options.modes,
				open: options.isOpen === 'open',
				showDeleteConfirmation: options.showDeleteConfirmation,
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
		drawControl.on('setting-changed', () => {
			console.log('setting-changed');
			onchange(options);
		});

		// event listeners
		drawControl.on('mode-changed', (event) => {
			console.log('mode-changed', event);
		});
		drawControl.on('feature-deleted', (event) => {
			console.log('feature-deleted', event);
		});
		drawControl.on('collapsed', () => {
			if (drawControl) {
				options.isOpen = drawControl.isExpanded ? 'open' : 'close';
			}
			onchange(options);
			console.log('collapsed');
		});
		drawControl.on('expanded', () => {
			if (drawControl) {
				options.isOpen = drawControl.isExpanded ? 'open' : 'close';
			}
			onchange(options);
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

	onMount(() => {
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

		/**
		 * Function to add terrain source
		 */
		const addTerrainSource = () => {
			if (!map) return;
			if (!map.getSource('mapterhorn')) {
				map.addSource('mapterhorn', {
					type: 'raster-dem',
					url: 'https://tiles.mapterhorn.com/tilejson.json'
				});
				map.addSource('hillshadeSource', {
					type: 'raster-dem',
					url: 'https://tiles.mapterhorn.com/tilejson.json'
				});
				map.addLayer({
					id: 'hillshade',
					type: 'hillshade',
					source: 'hillshadeSource'
				});
			}
			if (!map.getTerrain()) {
				map.setTerrain({ source: 'mapterhorn', exaggeration: 1 });
			}
		};

		/**
		 * Add terrain source when style is loaded/changed
		 */
		map.on('styledata', () => {
			if (map?.isStyleLoaded()) {
				addTerrainSource();
			}
		});

		import('@watergis/maplibre-gl-export').then(
			({ MaplibreExportControl, DPI, Format, PageOrientation, Size }) => {
				if (!map) return;
				const exportControl = new MaplibreExportControl({
					PageSize: Size.A4,
					PageOrientation: PageOrientation.Landscape,
					Format: Format.PNG,
					DPI: DPI[96],
					Crosshair: true,
					PrintableArea: true,
					Local: 'en'
				});
				map.addControl(exportControl, 'bottom-right');
			}
		);

		map.once('load', () => {
			styleSwitcherControl.initialise();

			if (!map) return;
			addTerrainSource();
			map.addControl(new TerrainControl({ source: 'mapterhorn' }), 'bottom-right');

			addControl();
		});
	});
</script>

<div class="demo-container grid grid-cols-[auto_1fr] snap-start">
	<aside class="sidebar col-span-1 h-screen p-4 w-sm overflow-y-auto hidden md:block">
		<Accordion value={accordionValue} onValueChange={(e) => (accordionValue = e.value)} multiple>
			<Tooltip positioning={{ placement: 'bottom' }}>
				<Tooltip.Trigger>
					<div class="flex items-center gap-2">
						<p class="font-bold uppercase">Control type</p>
						<Info size={16} />
					</div>
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner class="z-20!">
						<Tooltip.Content class="card p-4 preset-filled-surface-950-50 max-w-xs">
							<span>
								Default control is MaplibreTerradrawControl. If you want to use more advanced
								control, enable to choose MaplibreMeasureControl or MaplibreValhallaControl.
							</span>
							<Tooltip.Arrow
								class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
							>
								<Tooltip.ArrowTip />
							</Tooltip.Arrow>
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip>

			<Tabs
				value={options.controlType}
				orientation="horizontal"
				onValueChange={(details) => {
					options.controlType = details.value as 'default' | 'measure' | 'valhalla';
					addControl();
					onchange(options);

					if (options.controlType === 'default') {
						accordionValue = accordionValue.filter(
							(v) => v !== 'measure-option' && v !== 'valhalla-option'
						);
					} else if (options.controlType === 'measure') {
						accordionValue = [
							...accordionValue.filter((v) => v !== 'measure-option' && v !== 'valhalla-option'),
							'measure-option'
						];
					} else if (options.controlType === 'valhalla') {
						accordionValue = [
							...accordionValue.filter((v) => v !== 'measure-option' && v !== 'valhalla-option'),
							'valhalla-option'
						];
					}
				}}
			>
				<Tabs.List>
					<Tabs.Trigger class="flex-1" value="default">Default</Tabs.Trigger>
					<Tabs.Trigger class="flex-1" value="measure">Measure</Tabs.Trigger>
					<Tabs.Trigger class="flex-1" value="valhalla">Valhalla</Tabs.Trigger>
					<Tabs.Indicator />
				</Tabs.List>
			</Tabs>

			<Accordion.Item value="mode-selection">
				<Accordion.ItemTrigger>
					<Tooltip positioning={{ placement: 'bottom' }}>
						<Tooltip.Trigger>
							<div class="flex items-center gap-2">
								<p class="font-bold uppercase">Mode selection</p>
								<Info size={16} />
							</div>
						</Tooltip.Trigger>
						<Portal>
							<Tooltip.Positioner class="z-20!">
								<Tooltip.Content class="card p-4 preset-filled-surface-950-50 max-w-xs">
									<p class="pb-4">
										Your chosen options are automatically applied at the demo and the below usage
										code.
									</p>
									<p>
										By default, all Terra Draw modes will be added to the control. However, you
										might want to remove some drawing modes from your app.
									</p>
									<Tooltip.Arrow
										class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
									>
										<Tooltip.ArrowTip />
									</Tooltip.Arrow>
								</Tooltip.Content>
							</Tooltip.Positioner>
						</Portal>
					</Tooltip>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					{@const availableModes =
						options.controlType === 'valhalla'
							? (AvailableValhallaModes as unknown as TerradrawMode[])
							: AvailableModes}
					{@const modeData = availableModes.map((mode) => ({ label: mode, value: mode }))}
					{@const filteredModeData = modeSearchText
						? modeData.filter((item) =>
								item.label.toLowerCase().includes(modeSearchText.toLowerCase())
							)
						: modeData}
					{@const collection = useListCollection({
						items: filteredModeData,
						itemToString: (item) => item.label,
						itemToValue: (item) => item.value
					})}

					<div class="grid gap-2 w-full">
						<Combobox
							placeholder="Search Terra Draw modes..."
							{collection}
							value={options.modes}
							onInputValueChange={(e) => {
								modeSearchText = e.inputValue;
							}}
							onValueChange={(e) => {
								options.modes = e.value as TerradrawMode[];
								addControl();
								onchange(options);
							}}
							multiple
						>
							<Combobox.Control>
								<Combobox.Input />
								<Combobox.Trigger />
							</Combobox.Control>
							<Portal>
								<Combobox.Positioner class="z-[1]!">
									<Combobox.Content class="max-h-[200px] overflow-y-auto">
										{#each filteredModeData as item (item.value)}
											<Combobox.Item {item}>
												<Combobox.ItemText>{item.label}</Combobox.ItemText>
												<Combobox.ItemIndicator />
											</Combobox.Item>
										{/each}
									</Combobox.Content>
								</Combobox.Positioner>
							</Portal>
						</Combobox>
						<div class="flex flex-wrap gap-2">
							{#each options.modes as mode (mode)}
								<button
									class="badge preset-filled cursor-pointer hover:opacity-80 transition-opacity"
									type="button"
									onclick={() => {
										options.modes = options.modes.filter((m) => m !== mode);
										addControl();
										onchange(options);
									}}
								>
									<span>{mode}</span>
									<IconX size={16} />
								</button>
							{/each}
						</div>
					</div>

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
				</Accordion.ItemContent>
			</Accordion.Item>

			<Accordion.Item value="open-as-default">
				<Accordion.ItemTrigger>
					<Tooltip positioning={{ placement: 'bottom' }}>
						<Tooltip.Trigger>
							<div class="flex items-center gap-2">
								<p class="font-bold uppercase">Open as default</p>
								<Info size={16} />
							</div>
						</Tooltip.Trigger>
						<Portal>
							<Tooltip.Positioner class="z-20!">
								<Tooltip.Content class="card p-4 preset-filled-surface-950-50 max-w-xs">
									<p>
										if you want the drawing tool to be always expanded, simply remove `render` mode
										from constuctor options, then set `true` to `open` property.
									</p>
									<Tooltip.Arrow
										class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
									>
										<Tooltip.ArrowTip />
									</Tooltip.Arrow>
								</Tooltip.Content>
							</Tooltip.Positioner>
						</Portal>
					</Tooltip>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					<Switch
						checked={options.isOpen === 'open'}
						onCheckedChange={(details: { checked: boolean }) => {
							options.isOpen = details.checked ? 'open' : 'close';
							if (drawControl) {
								drawControl.isExpanded = options.isOpen === 'open';
							}
							onchange(options);
						}}
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Switch.Label>
							{options.isOpen === 'open' ? 'Open' : 'Close'} as default
						</Switch.Label>
						<Switch.HiddenInput />
					</Switch>
				</Accordion.ItemContent>
			</Accordion.Item>

			<Accordion.Item value="show-delete-confirmation">
				<Accordion.ItemTrigger>
					<Tooltip positioning={{ placement: 'bottom' }}>
						<Tooltip.Trigger>
							<div class="flex items-center gap-2">
								<p class="font-bold uppercase">Show delete confirmation</p>
								<Info size={16} />
							</div>
						</Tooltip.Trigger>
						<Portal>
							<Tooltip.Positioner class="z-20!">
								<Tooltip.Content class="card p-4 preset-filled-surface-950-50 max-w-xs">
									<p>
										If you want to show a confirmation dialog before deleting features, enable this
										option. Default is false.
									</p>
									<Tooltip.Arrow
										class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
									>
										<Tooltip.ArrowTip />
									</Tooltip.Arrow>
								</Tooltip.Content>
							</Tooltip.Positioner>
						</Portal>
					</Tooltip>
				</Accordion.ItemTrigger>
				<Accordion.ItemContent>
					<Switch
						checked={options.showDeleteConfirmation}
						onCheckedChange={(details: { checked: boolean }) => {
							options.showDeleteConfirmation = details.checked;
							if (drawControl) {
								drawControl.showDeleteConfirmation = options.showDeleteConfirmation;
							}
							onchange(options);
						}}
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
						<Switch.Label>
							{options.showDeleteConfirmation ? 'Show' : 'Hide'} delete confirmation
						</Switch.Label>
						<Switch.HiddenInput />
					</Switch>
				</Accordion.ItemContent>
			</Accordion.Item>

			{#if selectedFeature.length > 0}
				<Accordion.Item value="selected-feature">
					<Accordion.ItemTrigger>
						<p class="font-bold uppercase">Selected feature</p>
					</Accordion.ItemTrigger>
					<Accordion.ItemContent>
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
					</Accordion.ItemContent>
				</Accordion.Item>
			{/if}

			{#if options.controlType === 'measure'}
				<Accordion.Item value="measure-option">
					<Accordion.ItemTrigger>
						<p class="font-bold uppercase">Measure control options</p>
					</Accordion.ItemTrigger>
					<Accordion.ItemContent>
						<Accordion
							value={measureAccordionValue}
							onValueChange={(e) => (measureAccordionValue = e.value)}
							multiple
						>
							<Accordion.Item value="measure-unit-type">
								<Accordion.ItemTrigger>
									<p class="font-bold uppercase italic">Measure unit</p>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
									<select
										class="select"
										value={options.measureUnitType}
										onchange={(e) => {
											options.measureUnitType = (e.target as HTMLSelectElement)
												.value as MeasureUnitType;
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).measureUnitType =
													options.measureUnitType;
											}
											onchange(options);
										}}
									>
										{#each ['metric', 'imperial'] as unit (unit)}
											<option value={unit}>
												{unit}
											</option>
										{/each}
									</select>
								</Accordion.ItemContent>
							</Accordion.Item>

							<Accordion.Item value="force-distance-unit">
								<Accordion.ItemTrigger>
									<p class="font-bold uppercase italic">Force Distance unit</p>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
									<select
										class="select"
										value={options.forceDistanceUnit}
										onchange={(e) => {
											const value = (e.target as HTMLSelectElement).value as
												| MetricDistanceUnit
												| ImperialDistanceUnit
												| 'auto';
											options.forceDistanceUnit = value;
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).forceDistanceUnit =
													value === 'auto' ? undefined : (value as forceDistanceUnitType);
											}
											onchange(options);
										}}
									>
										{#each ['auto', 'kilometer', 'meter', 'centimeter', 'mile', 'foot', 'inch'] as item (item)}
											<option value={item}>
												{item}
												{#if item !== 'auto'}
													({defaultMeasureUnitSymbols[
														item as keyof typeof defaultMeasureUnitSymbols
													]})
												{/if}
											</option>
										{/each}
									</select>
								</Accordion.ItemContent>
							</Accordion.Item>

							<Accordion.Item value="force-area-unit">
								<Accordion.ItemTrigger>
									<p class="font-bold uppercase italic">Force Area unit</p>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
									<select
										class="select"
										value={options.forceAreaUnit}
										onchange={(e) => {
											options.forceAreaUnit = (e.target as HTMLSelectElement)
												.value as forceAreaUnitType;
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).forceAreaUnit =
													options.forceAreaUnit;
											}
											onchange(options);
										}}
									>
										{#each ['auto', 'square meters', 'square kilometers', 'ares', 'hectares', 'square feet', 'square yards', 'acres', 'square miles'] as item (item)}
											<option value={item}>
												{item}
												{#if item !== 'auto'}
													({defaultMeasureUnitSymbols[
														item as keyof typeof defaultMeasureUnitSymbols
													]})
												{/if}
											</option>
										{/each}
									</select>
								</Accordion.ItemContent>
							</Accordion.Item>

							<Accordion.Item value="distance-precision">
								<Accordion.ItemTrigger>
									<p class="font-bold uppercase italic">Measure precision</p>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
									<div class="py-4">
										<div class="flex justify-between items-center mb-4">
											<div class="font-bold">Distance precision (Line)</div>
											<div class="text-xs">{options.distancePrecision}</div>
										</div>
										<Slider
											defaultValue={[options.distancePrecision]}
											name="range-slider"
											min={0}
											max={10}
											step={1}
											onValueChange={(e) => {
												options.distancePrecision = e.value[0] as number;
												if (drawControl && options.controlType === 'measure') {
													(drawControl as MaplibreMeasureControl).distancePrecision =
														options.distancePrecision;
												}
												onchange(options);
											}}
										>
											<Slider.Control>
												<Slider.Track>
													<Slider.Range class="bg-primary-500" />
												</Slider.Track>
												<Slider.Thumb index={0}>
													<Slider.HiddenInput />
												</Slider.Thumb>
											</Slider.Control>
											<Slider.MarkerGroup>
												<Slider.Marker value={0} />
												<Slider.Marker value={5} />
												<Slider.Marker value={10} />
											</Slider.MarkerGroup>
										</Slider>
										<div class="flex justify-between items-center mt-8 mb-4">
											<div class="font-bold">Area precision (Polygon)</div>
											<div class="text-xs">{options.areaPrecision}</div>
										</div>
										<Slider
											defaultValue={[options.areaPrecision]}
											name="range-slider"
											min={0}
											max={10}
											step={1}
											onValueChange={(e) => {
												options.areaPrecision = e.value[0] as number;
												if (drawControl && options.controlType === 'measure') {
													(drawControl as MaplibreMeasureControl).areaPrecision =
														options.areaPrecision;
												}
												onchange(options);
											}}
										>
											<Slider.Control>
												<Slider.Track>
													<Slider.Range class="bg-primary-500" />
												</Slider.Track>
												<Slider.Thumb index={0}>
													<Slider.HiddenInput />
												</Slider.Thumb>
											</Slider.Control>
											<Slider.MarkerGroup>
												<Slider.Marker value={0} />
												<Slider.Marker value={5} />
												<Slider.Marker value={10} />
											</Slider.MarkerGroup>
										</Slider>
									</div>
								</Accordion.ItemContent>
							</Accordion.Item>
							<Accordion.Item value="compute-elevation">
								<Accordion.ItemTrigger>
									<p class="font-bold uppercase italic">Compute elevation</p>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
									<Switch
										checked={options.computeElevation === 'enabled'}
										onCheckedChange={(details: { checked: boolean }) => {
											options.computeElevation = details.checked ? 'enabled' : 'disabled';
											if (drawControl && options.controlType === 'measure') {
												(drawControl as MaplibreMeasureControl).computeElevation =
													options.computeElevation === 'enabled';
											}
											onchange(options);
										}}
									>
										<Switch.Control>
											<Switch.Thumb />
										</Switch.Control>
										<Switch.Label>
											{options.computeElevation === 'enabled' ? 'Enabled' : 'Disabled'}
										</Switch.Label>
										<Switch.HiddenInput />
									</Switch>
								</Accordion.ItemContent>
							</Accordion.Item>
						</Accordion>
					</Accordion.ItemContent>
				</Accordion.Item>
			{/if}

			{#if options.controlType === 'valhalla'}
				<Accordion.Item value="valhalla-option">
					<Accordion.ItemTrigger>
						<p class="font-bold uppercase">Valhalla control options</p>
					</Accordion.ItemTrigger>
					<Accordion.ItemContent>
						<Accordion
							value={valhallaAccordionValue}
							onValueChange={(e) => (valhallaAccordionValue = e.value)}
							multiple
						>
							<Accordion.Item value="valhalla-url">
								<Accordion.ItemTrigger>
									<Tooltip positioning={{ placement: 'bottom' }}>
										<Tooltip.Trigger>
											<div class="flex items-center gap-2">
												<p class="font-bold uppercase">Valhalla API URL</p>
												<Info size={16} />
											</div>
										</Tooltip.Trigger>
										<Portal>
											<Tooltip.Positioner class="z-20!">
												<Tooltip.Content class="card p-4 preset-filled-surface-950-50 max-w-xs">
													<p>
														The example api URL of Valhalla control only supports the country of
														Kenya, Uganda and Rwanda in this demo. You need to deploy your own
														Valhalla API server for your application.
													</p>
													<Tooltip.Arrow
														class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
													>
														<Tooltip.ArrowTip />
													</Tooltip.Arrow>
												</Tooltip.Content>
											</Tooltip.Positioner>
										</Portal>
									</Tooltip>
								</Accordion.ItemTrigger>
								<Accordion.ItemContent>
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
								</Accordion.ItemContent>
							</Accordion.Item>

							<Tabs
								defaultValue={valhallaGroup}
								onValueChange={(e) => (valhallaGroup = e.value as 'routing' | 'isochrone')}
							>
								<Tabs.List>
									<Tabs.Trigger value="routing">Routing</Tabs.Trigger>
									<Tabs.Trigger value="isochrone">Isochrone</Tabs.Trigger>
									<Tabs.Indicator />
								</Tabs.List>
								<Tabs.Content value="routing">
									<Accordion.Item value="routing-means-of-transport">
										<Accordion.ItemTrigger>
											<p class="font-bold uppercase italic">Means of transport</p>
										</Accordion.ItemTrigger>
										<Accordion.ItemContent>
											<select
												class="select"
												value={options.valhallaOptions.routingOptions?.costingModel}
												onchange={(e) => {
													if (!options.valhallaOptions.routingOptions) {
														options.valhallaOptions.routingOptions = {};
													} else {
														options.valhallaOptions.routingOptions.costingModel = (
															e.target as HTMLSelectElement
														).value as costingModelType;
													}
													if (drawControl && options.controlType === 'valhalla') {
														(drawControl as MaplibreValhallaControl).routingCostingModel =
															options.valhallaOptions.routingOptions.costingModel ?? 'pedestrian';
													}
													onchange(options);
												}}
											>
												{#each costingModelOptions as item (item.value)}
													<option value={item.value}>
														{item.label}
													</option>
												{/each}
											</select>
										</Accordion.ItemContent>
									</Accordion.Item>

									<Accordion.Item value="routing-distance-unit">
										<Accordion.ItemTrigger>
											<p class="font-bold uppercase italic">Distance unit</p>
										</Accordion.ItemTrigger>
										<Accordion.ItemContent>
											<select
												class="select"
												value={options.valhallaOptions.routingOptions?.distanceUnit}
												onchange={(e) => {
													if (!options.valhallaOptions.routingOptions) {
														options.valhallaOptions.routingOptions = {};
													} else {
														options.valhallaOptions.routingOptions.distanceUnit = (
															e.target as HTMLSelectElement
														).value as routingDistanceUnitType;
													}
													if (drawControl && options.controlType === 'valhalla') {
														(drawControl as MaplibreValhallaControl).routingDistanceUnit =
															options.valhallaOptions.routingOptions.distanceUnit ?? 'kilometers';
													}
													onchange(options);
												}}
											>
												{#each routingDistanceUnitOptions as item (item.value)}
													<option value={item.value}>
														{item.label}
													</option>
												{/each}
											</select>
										</Accordion.ItemContent>
									</Accordion.Item>
								</Tabs.Content>
								<Tabs.Content value="isochrone">
									<Accordion.Item value="isochrone-contour-type">
										<Accordion.ItemTrigger>
											<p class="font-bold uppercase italic">Type of contour</p>
										</Accordion.ItemTrigger>
										<Accordion.ItemContent>
											<select
												class="select"
												value={options.valhallaOptions.isochroneOptions?.contourType}
												onchange={(e) => {
													if (!options.valhallaOptions.isochroneOptions) {
														options.valhallaOptions.isochroneOptions = {};
													} else {
														options.valhallaOptions.isochroneOptions.contourType = (
															e.target as HTMLSelectElement
														).value as ContourType;
													}
													if (drawControl && options.controlType === 'valhalla') {
														(drawControl as MaplibreValhallaControl).isochroneContourType =
															options.valhallaOptions.isochroneOptions.contourType ?? 'time';
													}
													onchange(options);
												}}
											>
												<option value="time">Time</option>
												<option value="distance">Distance</option>
											</select>
										</Accordion.ItemContent>
									</Accordion.Item>
									<Accordion.Item value="isochrone-means-of-transport">
										<Accordion.ItemTrigger>
											<p class="font-bold uppercase italic">Means of transport</p>
										</Accordion.ItemTrigger>
										<Accordion.ItemContent>
											<select
												class="select"
												value={options.valhallaOptions.isochroneOptions?.costingModel}
												onchange={(e) => {
													if (!options.valhallaOptions.isochroneOptions) {
														options.valhallaOptions.isochroneOptions = {};
													} else {
														options.valhallaOptions.isochroneOptions.costingModel = (
															e.target as HTMLSelectElement
														).value as costingModelType;
													}
													if (drawControl && options.controlType === 'valhalla') {
														(drawControl as MaplibreValhallaControl).isochroneCostingModel =
															options.valhallaOptions.isochroneOptions.costingModel ?? 'pedestrian';
													}
													onchange(options);
												}}
											>
												{#each costingModelOptions as item (item.value)}
													<option value={item.value}>
														{item.label}
													</option>
												{/each}
											</select>
										</Accordion.ItemContent>
									</Accordion.Item>
									<Accordion.Item value="isochrone-contours">
										<Accordion.ItemTrigger>
											<p class="font-bold uppercase italic">Contours</p>
										</Accordion.ItemTrigger>
										<Accordion.ItemContent>
											{@const contours = options.valhallaOptions.isochroneOptions
												?.contours as Contour[]}

											<button
												type="button"
												class="btn preset-filled"
												hidden={contours.length > 3}
												onclick={() => {
													const lastContour = contours[contours.length - 1];
													contours.push(JSON.parse(JSON.stringify(lastContour)));
												}}
											>
												<IconPlus size={18} />
												<span>Add contour</span>
											</button>

											<div class="table-wrap">
												<table class="table table-fixed w-full max-w-md">
													<colgroup>
														<col class="w-20" />
														<col class="w-20" />
														<col class="w-20" />
														<col />
													</colgroup>
													<thead>
														<tr>
															<th class="text-xs">Color</th>
															<th class="text-xs">Time (min)</th>
															<th class="text-xs">Distance (km)</th>
															<th>&nbsp;</th>
														</tr>
													</thead>
													<tbody class="[&>tr]:hover:preset-tonal-primary">
														{#each contours as row, index (index)}
															<tr>
																<td
																	><input
																		type="color"
																		bind:value={row.color}
																		class="cursor-pointer w-10 h-6"
																	/></td
																>
																<td
																	><input
																		type="number"
																		bind:value={row.time}
																		class="cursor-pointer w-10 text-xs px-1"
																	/></td
																>
																<td
																	><input
																		type="number"
																		bind:value={row.distance}
																		class="cursor-pointer w-10 text-xs px-1"
																	/></td
																>
																<td class="text-right">
																	{#if index > 0}
																		<button
																			class="btn btn-sm preset-filled rounded-full"
																			onclick={() => {
																				if (options.valhallaOptions.isochroneOptions?.contours) {
																					options.valhallaOptions.isochroneOptions.contours.splice(
																						index,
																						1
																					);
																				}
																			}}
																		>
																			<IconX size={16} />
																		</button>
																	{/if}
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											</div>
										</Accordion.ItemContent>
									</Accordion.Item>
								</Tabs.Content>
							</Tabs>
						</Accordion>
					</Accordion.ItemContent>
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
