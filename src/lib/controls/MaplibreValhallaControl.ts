import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { defaultValhallaControlOptions } from '../constants';
import type {
	TerradrawMode,
	TerradrawValhallaMode,
	ValhallaControlOptions,
	ValhallaOptions
} from '../interfaces';
import {
	GeoJSONSource,
	type CircleLayerSpecification,
	type FillLayerSpecification,
	type GeoJSONSourceSpecification,
	type LineLayerSpecification,
	type Map,
	type StyleSpecification,
	type SymbolLayerSpecification
} from 'maplibre-gl';
import type { GeoJSONStoreFeatures, TerraDrawExtend } from 'terra-draw';
import {
	debounce,
	ModalDialog,
	routingDistanceUnitOptions,
	type routingDistanceUnitType,
	costingModelOptions,
	type costingModelType,
	TERRADRAW_SOURCE_IDS,
	cleanMaplibreStyle,
	type Contour
} from '../helpers';
import { TerraDrawValhallaRoutingMode } from '../modes/TerraDrawValhallaRoutingMode';
import { TerraDrawValhallaTimeIsochroneMode } from '../modes/TerraDrawValhallaTimeIsochroneMode';
import { TerraDrawValhallaDistanceIsochroneMode } from '../modes/TerraDrawValhallaDistanceIsochroneMode';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreValhallaControl extends MaplibreTerradrawControl {
	private controlOptions: ValhallaControlOptions;
	private valhallaOptions: ValhallaOptions;
	private _modalDialog: ModalDialog | undefined;

	/**
	 * Get the URL of Valhalla API
	 */
	get valhallaUrl() {
		return this.valhallaOptions.url as string;
	}
	/**
	 * Set the URL of Valhalla API
	 * @param value URL of Valhalla API
	 */
	set valhallaUrl(value: string) {
		this.valhallaOptions.url = value;
		const modeOpts = this.controlOptions.modeOptions;
		if (modeOpts?.['routing'] instanceof TerraDrawValhallaRoutingMode) {
			modeOpts['routing'].url = value;
		}
		if (modeOpts?.['time-isochrone'] instanceof TerraDrawValhallaTimeIsochroneMode) {
			modeOpts['time-isochrone'].url = value;
		}
		if (modeOpts?.['distance-isochrone'] instanceof TerraDrawValhallaDistanceIsochroneMode) {
			modeOpts['distance-isochrone'].url = value;
		}
	}

	/**
	 * Get the means of transport for Valhalla routing api
	 * @returns costingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get routingCostingModel() {
		return this.valhallaOptions.routingOptions?.costingModel as costingModelType;
	}
	/**
	 * Set the means of transport for Valhalla routing api
	 * @param value costingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set routingCostingModel(value: costingModelType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.costingModel = value;
		const mode = this.controlOptions.modeOptions?.['routing'];
		if (mode instanceof TerraDrawValhallaRoutingMode) {
			mode.costingModel = value;
		}
		this.createSettingsDialog();
	}

	/**
	 * Get the distance unit for Valhalla routing api
	 * @returns routingDistanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	get routingDistanceUnit() {
		return this.valhallaOptions.routingOptions?.distanceUnit as routingDistanceUnitType;
	}

	/**
	 * Set the distance unit for Valhalla routing api
	 * @param value routingDistanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	set routingDistanceUnit(value: routingDistanceUnitType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.distanceUnit = value;
		const mode = this.controlOptions.modeOptions?.['routing'];
		if (mode instanceof TerraDrawValhallaRoutingMode) {
			mode.distanceUnit = value;
		}
		this.createSettingsDialog();
	}

	/**
	 * Get the means of transport for Valhalla time isochrone api
	 * @returns isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get timeIsochroneCostingModel() {
		return this.valhallaOptions.isochroneOptions?.timeCostingModel as costingModelType;
	}
	/**
	 * Set the means of transport for Valhalla time isochrone api
	 * @param value isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set timeIsochroneCostingModel(value: costingModelType) {
		if (!this.valhallaOptions.isochroneOptions) {
			this.valhallaOptions.isochroneOptions = {};
		}
		this.valhallaOptions.isochroneOptions.timeCostingModel = value;
		const mode = this.controlOptions.modeOptions?.['time-isochrone'];
		if (mode instanceof TerraDrawValhallaTimeIsochroneMode) {
			mode.costingModel = value;
		}
		this.createSettingsDialog();
	}

	/**
	 * Get the means of transport for Valhalla distance isochrone api
	 * @returns isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get distanceIsochroneCostingModel() {
		return this.valhallaOptions.isochroneOptions?.distanceCostingModel as costingModelType;
	}
	/**
	 * Set the means of transport for Valhalla distance isochrone api
	 * @param value isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set distanceIsochroneCostingModel(value: costingModelType) {
		if (!this.valhallaOptions.isochroneOptions) {
			this.valhallaOptions.isochroneOptions = {};
		}
		this.valhallaOptions.isochroneOptions.distanceCostingModel = value;
		const mode = this.controlOptions.modeOptions?.['distance-isochrone'];
		if (mode instanceof TerraDrawValhallaDistanceIsochroneMode) {
			mode.costingModel = value;
		}
		this.createSettingsDialog();
	}

	/**
	 * Get the list of contours for Valhalla isochrone api
	 * @returns Contour[]
	 */
	get isochroneContours() {
		return this.valhallaOptions.isochroneOptions?.contours as Contour[];
	}

	/**
	 * Set the list of contours for Valhalla isochrone api
	 * @param value Contour[]
	 */
	set isochroneContours(value: Contour[]) {
		if (!this.valhallaOptions.isochroneOptions) {
			this.valhallaOptions.isochroneOptions = {};
		}
		this.valhallaOptions.isochroneOptions.contours = value;
		const timeMode = this.controlOptions.modeOptions?.['time-isochrone'];
		if (timeMode instanceof TerraDrawValhallaTimeIsochroneMode) {
			timeMode.contours = value;
		}
		const distMode = this.controlOptions.modeOptions?.['distance-isochrone'];
		if (distMode instanceof TerraDrawValhallaDistanceIsochroneMode) {
			distMode.contours = value;
		}
		this.createSettingsDialog();
	}

	/**
	 * Get/Set font glyph for valhalla control layers
	 *
	 * As default, this maesure control uses maplibre's default font glyphs(`Open Sans Regular,Arial Unicode MS Regular`) described at https://maplibre.org/maplibre-style-spec/layers/#text-font
	 *
	 * If you are using your own maplibre style or different map privider, you probably need to set the font glyphs to match your maplibre style.
	 *
	 * Font glyph availability depends on what types of glyphs are supported by your maplibre style (e.g., Carto, Openmap tiles, Protomap, Maptiler, etc.)
	 * Please make sure the font glyphs are available in your maplibre style.
	 *
	 * Usage:
	 *
	 * ```js
	 * const drawControl = new MaplibreValhallaControl()
	 * drawControl.fontGlyphs = ['Open Sans Italic']
	 * map.addControl(drawControl)
	 * ```
	 */
	get fontGlyphs() {
		const layers = [this.controlOptions.routingLineLayerNodeLabelSpec];
		const firstLayer = layers[0];
		return (firstLayer &&
			firstLayer.layout &&
			firstLayer.layout['text-font']) as unknown as string[];
	}

	set fontGlyphs(fontNames: string[]) {
		// also apply to the TextMode label layer via the base implementation
		super.fontGlyphs = fontNames;
		this.applyFontGlyphs(fontNames, [this.controlOptions.routingLineLayerNodeLabelSpec]);
	}

	/**
	 * Get the dialog instance for settings
	 */
	get settingDialog(): ModalDialog {
		return this._modalDialog as ModalDialog;
	}
	/**
	 * Set the dialog instance for settings
	 */
	set settingDialog(value: ModalDialog) {
		this._modalDialog = value;
	}

	/**
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: ValhallaControlOptions) {
		let _options: ValhallaControlOptions = {
			...JSON.parse(JSON.stringify(defaultValhallaControlOptions)),
			modeOptions: { ...defaultValhallaControlOptions.modeOptions }
		};
		if (options) {
			_options = Object.assign(_options, options);
			_options.valhallaOptions = Object.assign(
				JSON.parse(JSON.stringify(defaultValhallaControlOptions.valhallaOptions)),
				_options.valhallaOptions as ValhallaOptions
			);
		}

		// replace {prefix} with prefixId for sources and layers
		if (!_options.adapterOptions) {
			_options.adapterOptions = {};
		}
		_options.adapterOptions.prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		const prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		(_options.routingLineLayerNodeLabelSpec as SymbolLayerSpecification).id =
			_options.routingLineLayerNodeLabelSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.routingLineLayerNodeLabelSpec as SymbolLayerSpecification).source =
			_options.routingLineLayerNodeLabelSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.routingLineLayerNodeSpec as CircleLayerSpecification).id =
			_options.routingLineLayerNodeSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.routingLineLayerNodeSpec as CircleLayerSpecification).source =
			_options.routingLineLayerNodeSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.timeIsochronePolygonLayerSpec as FillLayerSpecification).id =
			_options.timeIsochronePolygonLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.timeIsochronePolygonLayerSpec as FillLayerSpecification).source =
			_options.timeIsochronePolygonLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.timeIsochroneLineLayerSpec as LineLayerSpecification).id =
			_options.timeIsochroneLineLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.timeIsochroneLineLayerSpec as LineLayerSpecification).source =
			_options.timeIsochroneLineLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).id =
			_options.timeIsochroneLabelLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).source =
			_options.timeIsochroneLabelLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.distanceIsochronePolygonLayerSpec as FillLayerSpecification).id =
			_options.distanceIsochronePolygonLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source =
			_options.distanceIsochronePolygonLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.distanceIsochroneLineLayerSpec as LineLayerSpecification).id =
			_options.distanceIsochroneLineLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.distanceIsochroneLineLayerSpec as LineLayerSpecification).source =
			_options.distanceIsochroneLineLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification).id =
			_options.distanceIsochroneLabelLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification).source =
			_options.distanceIsochroneLabelLayerSpec?.source.replace('{prefix}', prefixId) as string;

		super({
			modes: _options.modes as unknown as TerradrawMode[],
			open: _options.open,
			modeOptions: _options.modeOptions,
			adapterOptions: _options.adapterOptions
		});
		this.valhallaOptions = _options.valhallaOptions as ValhallaOptions;

		if (!this.valhallaOptions.url) {
			throw new Error(
				'Valhalla URL is required for this control. Please set valhallaOptions.url in options.'
			);
		}
		this._cssPrefix = 'valhalla-';
		this.controlOptions = _options;

		this.syncValhallaOptionsToModes(_options);
	}

	private syncValhallaOptionsToModes(_options: ValhallaControlOptions) {
		const modeOpts = _options.modeOptions;
		const vo = this.valhallaOptions;
		if (modeOpts?.['routing'] instanceof TerraDrawValhallaRoutingMode) {
			modeOpts['routing'].url = vo.url!;
			modeOpts['routing'].costingModel = vo.routingOptions?.costingModel ?? 'auto';
			modeOpts['routing'].distanceUnit = vo.routingOptions?.distanceUnit ?? 'kilometers';
		}
		if (modeOpts?.['time-isochrone'] instanceof TerraDrawValhallaTimeIsochroneMode) {
			modeOpts['time-isochrone'].url = vo.url!;
			modeOpts['time-isochrone'].costingModel = vo.isochroneOptions?.timeCostingModel ?? 'auto';
			modeOpts['time-isochrone'].contours = vo.isochroneOptions?.contours ?? [];
		}
		if (modeOpts?.['distance-isochrone'] instanceof TerraDrawValhallaDistanceIsochroneMode) {
			modeOpts['distance-isochrone'].url = vo.url!;
			modeOpts['distance-isochrone'].costingModel =
				vo.isochroneOptions?.distanceCostingModel ?? 'auto';
			modeOpts['distance-isochrone'].contours = vo.isochroneOptions?.contours ?? [];
		}
	}

	/**
	 * add the plugin control to maplibre
	 * @param map Maplibre Map object
	 * @returns HTML Element
	 */
	public onAdd(map: Map): HTMLElement {
		this.controlContainer = super.onAdd(map);
		this.createSettingsDialog();
		return this.controlContainer;
	}

	/**
	 * Remove the plugin control from maplibre
	 * @returns void
	 */
	public onRemove(): void {
		this.unregisterValhallaControl();
		super.onRemove();
	}

	/**
	 * Activate Terra Draw to start drawing
	 */
	public activate() {
		super.activate();
		this.registerValhallaControl();
	}

	/**
	 * clean maplibre style to filter only for terradraw related layers or without them.
	 * If options are not set, returns original style given to the function.
	 *
	 * This can be useful incase users only want to get terradraw related layers or without it.
	 *
	 * Usage:
	 * `cleanStyle(map.getStyle, { excludeTerraDrawLayers: true})`
	 * `cleanStyle(map.getStyle, { onlyTerraDrawLayers: true})`
	 *
	 * @param style maplibre style spec
	 * @param options.excludeTerraDrawLayers return maplibre style without terradraw layers and sources
	 * @param options.onlyTerraDrawLayers return maplibre style with only terradraw layers and sources
	 * @returns
	 */
	public cleanStyle(
		style: StyleSpecification,
		options?: { excludeTerraDrawLayers?: boolean; onlyTerraDrawLayers?: boolean }
	) {
		const sourceIds = TERRADRAW_SOURCE_IDS;

		const pointSource = this.controlOptions.routingLineLayerNodeSpec?.source;
		if (pointSource) sourceIds.push(pointSource);

		const timeIsochronePolygonSource = this.controlOptions.timeIsochronePolygonLayerSpec?.source;
		if (timeIsochronePolygonSource) sourceIds.push(timeIsochronePolygonSource);

		const distanceIsochronePolygonSource =
			this.controlOptions.distanceIsochronePolygonLayerSpec?.source;
		if (distanceIsochronePolygonSource) sourceIds.push(distanceIsochronePolygonSource);

		return cleanMaplibreStyle(style, options, sourceIds, this.options.adapterOptions?.prefixId);
	}

	/**
	 * Create the settings dialog for Valhalla control
	 */
	private createSettingsDialog() {
		this.settingDialog = new ModalDialog(
			`maplibregl-terradraw-${this.cssPrefix}settings-dialog`,
			'Settings'
		);
		this.settingDialog.create(
			this.map?.getContainer().parentElement as HTMLElement,
			(content: HTMLDivElement) => {
				// Tab container
				const tabContainer = document.createElement('div');
				tabContainer.classList.add('tab-container');

				// Tab buttons
				const tabButtons = document.createElement('div');
				tabButtons.classList.add('tab-buttons');

				const routingTab = document.createElement('button');
				routingTab.type = 'button';
				routingTab.classList.add('tab-button', 'active');
				routingTab.textContent = 'Routing';
				routingTab.addEventListener('click', (e) => {
					e.stopPropagation();
					this.switchTab('routing', tabButtons, tabContents);
				});
				tabButtons.appendChild(routingTab);

				const isochroneTab = document.createElement('button');
				isochroneTab.type = 'button';
				isochroneTab.classList.add('tab-button');
				isochroneTab.textContent = 'Isochrone';
				isochroneTab.addEventListener('click', (e) => {
					e.stopPropagation();
					this.switchTab('isochrone', tabButtons, tabContents);
				});
				tabButtons.appendChild(isochroneTab);

				tabContainer.appendChild(tabButtons);

				// Tab contents container
				const tabContents = document.createElement('div');
				tabContents.classList.add('tab-contents');

				// Routing content
				const routingContent = this.createRoutingContent();
				routingContent.classList.add('tab-content', 'active');
				routingContent.setAttribute('data-tab', 'routing');
				tabContents.appendChild(routingContent);

				// Isochrone content
				const isochroneContent = this.createIsochroneContent();
				isochroneContent.classList.add('tab-content');
				isochroneContent.setAttribute('data-tab', 'isochrone');
				tabContents.appendChild(isochroneContent);

				tabContainer.appendChild(tabContents);
				content.appendChild(tabContainer);

				return content;
			}
		);
	}

	/**
	 * Switch between tabs
	 */
	private switchTab(tabName: string, tabButtons: HTMLElement, tabContents: HTMLElement) {
		// Update tab buttons
		tabButtons.querySelectorAll('.tab-button').forEach((btn) => btn.classList.remove('active'));
		tabButtons
			.querySelector(`[data-tab="${tabName}"], :nth-child(${tabName === 'routing' ? '1' : '2'})`)
			?.classList.add('active');

		// Update tab contents
		tabContents
			.querySelectorAll('.tab-content')
			.forEach((content) => content.classList.remove('active'));
		tabContents.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
	}

	/**
	 * Create routing tab content
	 */
	private createRoutingContent(): HTMLDivElement {
		const container = document.createElement('div');

		// Means of Transport section
		const transportSection = document.createElement('div');
		transportSection.classList.add('setting-section');

		const transportLabel = document.createElement('label');
		transportLabel.textContent = 'Means of Transport';
		transportLabel.classList.add('setting-label');
		transportSection.appendChild(transportLabel);

		transportSection.appendChild(
			this.settingDialog.createSegmentButtons(
				costingModelOptions as unknown as { value: string; label: string }[],
				this.routingCostingModel,
				(value: string) => {
					if (!this.valhallaOptions.routingOptions) {
						this.valhallaOptions.routingOptions = {};
					}
					this.valhallaOptions.routingOptions.costingModel = value as costingModelType;
					this.dispatchEvent('setting-changed');
				}
			)
		);
		container.appendChild(transportSection);

		// Distance Unit section
		const unitSection = document.createElement('div');
		unitSection.classList.add('setting-section');

		const unitLabel = document.createElement('label');
		unitLabel.textContent = 'Distance Unit';
		unitLabel.classList.add('setting-label');
		unitSection.appendChild(unitLabel);

		unitSection.appendChild(
			this.settingDialog.createSegmentButtons(
				routingDistanceUnitOptions as unknown as { value: string; label: string }[],
				this.routingDistanceUnit,
				(value: string) => {
					if (!this.valhallaOptions.routingOptions) {
						this.valhallaOptions.routingOptions = {};
					}
					this.valhallaOptions.routingOptions.distanceUnit = value as routingDistanceUnitType;
					this.dispatchEvent('setting-changed');
				}
			)
		);
		container.appendChild(unitSection);

		return container;
	}

	/**
	 * Create isochrone tab content
	 */
	private createIsochroneContent(): HTMLDivElement {
		const container = document.createElement('div');

		// Means of Transport (time) section
		const timeTransportSection = document.createElement('div');
		timeTransportSection.classList.add('setting-section');

		const timeTransportLabel = document.createElement('label');
		timeTransportLabel.textContent = 'Means of Transport (Time)';
		timeTransportLabel.classList.add('setting-label');
		timeTransportSection.appendChild(timeTransportLabel);

		timeTransportSection.appendChild(
			this.settingDialog.createSegmentButtons(
				costingModelOptions as unknown as { value: string; label: string }[],
				this.controlOptions.valhallaOptions?.isochroneOptions?.timeCostingModel || 'auto',
				(value: string) => {
					if (!this.valhallaOptions.isochroneOptions) {
						this.valhallaOptions.isochroneOptions = {};
					}
					this.valhallaOptions.isochroneOptions.timeCostingModel = value as costingModelType;
					this.dispatchEvent('setting-changed');
				}
			)
		);
		container.appendChild(timeTransportSection);

		// Means of Transport (distance) section
		const distanceTransportSection = document.createElement('div');
		distanceTransportSection.classList.add('setting-section');

		const distanceTransportLabel = document.createElement('label');
		distanceTransportLabel.textContent = 'Means of Transport (Distance)';
		distanceTransportLabel.classList.add('setting-label');
		distanceTransportSection.appendChild(distanceTransportLabel);

		distanceTransportSection.appendChild(
			this.settingDialog.createSegmentButtons(
				costingModelOptions as unknown as { value: string; label: string }[],
				this.controlOptions.valhallaOptions?.isochroneOptions?.distanceCostingModel || 'auto',
				(value: string) => {
					if (!this.valhallaOptions.isochroneOptions) {
						this.valhallaOptions.isochroneOptions = {};
					}
					this.valhallaOptions.isochroneOptions.distanceCostingModel = value as costingModelType;
					this.dispatchEvent('setting-changed');
				}
			)
		);
		container.appendChild(distanceTransportSection);

		// Contours section
		const contoursSection = document.createElement('div');
		contoursSection.classList.add('setting-section');

		const contoursLabel = document.createElement('label');
		contoursLabel.textContent = 'Contours';
		contoursLabel.classList.add('setting-label');
		contoursSection.appendChild(contoursLabel);

		const contoursTable = this.createContoursTable();
		contoursSection.appendChild(contoursTable);

		container.appendChild(contoursSection);

		return container;
	}

	/**
	 * Create contours table
	 */
	private createContoursTable(): HTMLDivElement {
		const tableContainer = document.createElement('div');
		tableContainer.classList.add('contours-table');

		const table = document.createElement('table');
		table.classList.add('contours-table-element');

		// Header
		const thead = document.createElement('thead');
		const headerRow = document.createElement('tr');

		const colorHeader = document.createElement('th');
		colorHeader.textContent = 'Color';
		headerRow.appendChild(colorHeader);

		const timeHeader = document.createElement('th');
		timeHeader.textContent = 'Time (min)';
		headerRow.appendChild(timeHeader);

		const distanceHeader = document.createElement('th');
		distanceHeader.textContent = 'Distance (km)';
		headerRow.appendChild(distanceHeader);

		const actionHeader = document.createElement('th');
		headerRow.appendChild(actionHeader);

		thead.appendChild(headerRow);
		table.appendChild(thead);

		// Body
		const tbody = document.createElement('tbody');

		const currentContours = this.controlOptions.valhallaOptions?.isochroneOptions
			?.contours as Contour[];

		currentContours.forEach((contour, index) => {
			const row = this.createContourRow(contour, index);
			tbody.appendChild(row);
		});

		table.appendChild(tbody);
		tableContainer.appendChild(table);

		// Add contour button
		const addButton = document.createElement('button');
		addButton.type = 'button';
		addButton.classList.add('add-row-button');
		addButton.textContent = 'Add Contour';
		addButton.hidden = currentContours.length >= 4;
		addButton.addEventListener('click', (e) => {
			e.stopPropagation();

			const latestContours = this.valhallaOptions.isochroneOptions?.contours as Contour[];

			const newContour = JSON.parse(JSON.stringify(latestContours[latestContours.length - 1]));
			const index = tbody.children.length;
			const row = this.createContourRow(newContour, index);
			tbody.appendChild(row);
			latestContours.push(newContour);
			this.updateAddRowButtonState();
			this.dispatchEvent('setting-changed');
		});
		tableContainer.appendChild(addButton);

		return tableContainer;
	}

	/**
	 * Create a single contour row
	 */
	private createContourRow(contour: Contour, index: number): HTMLTableRowElement {
		const row = document.createElement('tr');
		row.setAttribute('data-index', index.toString());

		// Color cell
		const colorCell = document.createElement('td');
		const colorInput = document.createElement('input');
		colorInput.type = 'color';
		colorInput.value = contour.color;
		colorInput.classList.add('color-picker');
		colorInput.addEventListener('change', (e) => {
			e.stopPropagation();
			if (!this.valhallaOptions.isochroneOptions?.contours) return;
			this.valhallaOptions.isochroneOptions.contours[index].color = (
				e.target as HTMLInputElement
			).value;
			this.dispatchEvent('setting-changed');
		});
		colorCell.appendChild(colorInput);
		row.appendChild(colorCell);

		// Time cell
		const timeCell = document.createElement('td');
		const timeInput = document.createElement('input');
		timeInput.type = 'number';
		timeInput.value = (contour.time as number).toString();
		timeInput.min = '1';
		timeInput.classList.add('number-input');
		timeInput.addEventListener('change', (e) => {
			e.stopPropagation();
			if (!this.valhallaOptions.isochroneOptions?.contours) return;
			this.valhallaOptions.isochroneOptions.contours[index].time = parseFloat(
				(e.target as HTMLInputElement).value
			);
			this.dispatchEvent('setting-changed');
		});
		timeCell.appendChild(timeInput);
		row.appendChild(timeCell);

		// Distance cell
		const distanceCell = document.createElement('td');
		const distanceInput = document.createElement('input');
		distanceInput.type = 'number';
		distanceInput.value = (contour.distance as number).toString();
		distanceInput.min = '0.1';
		distanceInput.step = '0.1';
		distanceInput.classList.add('number-input');
		distanceInput.addEventListener('change', (e) => {
			e.stopPropagation();
			if (!this.valhallaOptions.isochroneOptions?.contours) return;
			this.valhallaOptions.isochroneOptions.contours[index].distance = parseFloat(
				(e.target as HTMLInputElement).value
			);
			this.dispatchEvent('setting-changed');
		});
		distanceCell.appendChild(distanceInput);
		row.appendChild(distanceCell);

		// Action cell
		const actionCell = document.createElement('td');
		if (index > 0) {
			const deleteButton = document.createElement('button');
			deleteButton.type = 'button';
			deleteButton.textContent = '×';
			deleteButton.classList.add('delete-button');
			deleteButton.addEventListener('click', (e) => {
				e.stopPropagation();
				const index = parseInt(row.getAttribute('data-index') || '0');
				row.remove();

				// Remove from options
				if (this.valhallaOptions.isochroneOptions?.contours) {
					this.valhallaOptions.isochroneOptions.contours.splice(index, 1);
				}

				// Update indices
				const tbody = row.parentElement as HTMLTableSectionElement;
				if (tbody) {
					Array.from(tbody.children).forEach((row, newIndex) => {
						(row as HTMLElement).setAttribute('data-index', newIndex.toString());
					});
				}

				this.updateAddRowButtonState();
				this.dispatchEvent('setting-changed');
			});
			actionCell.appendChild(deleteButton);
		}

		row.appendChild(actionCell);

		return row;
	}

	private updateAddRowButtonState = () => {
		const addButtons = document.getElementsByClassName('add-row-button');
		if (addButtons && addButtons.length > 0) {
			const addButton = addButtons.item(0) as HTMLButtonElement;
			if (addButton) {
				const currentContours = this.controlOptions.valhallaOptions?.isochroneOptions
					?.contours as Contour[];
				addButton.hidden = currentContours.length >= 4;
			}
		}
	};

	/**
	 * Add Terra Draw drawing mode button
	 * @param mode Terra Draw mode name
	 */
	protected addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.type = 'button';
		this.modeButtons[mode] = btn;

		if ((mode as TerradrawValhallaMode) === 'settings') {
			btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}add-control`);
			btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
			btn.addEventListener('click', this.handleSettingDialog.bind(this));
		} else {
			super.addTerradrawButton(mode);
		}
	}

	/**
	 * Handle the click event of the settings button
	 */
	private handleSettingDialog() {
		this.settingDialog?.open();
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private registerValhallaControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) => ['routing'].includes(m));

		if (lineModes && lineModes.length > 0) {
			// add GeoJSON source for line node
			if (
				!this.map.getSource(
					(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for distance label node appearance
			if (
				!this.map.getLayer(
					(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.routingLineLayerNodeLabelSpec as SymbolLayerSpecification).id
				)
			) {
				this.map.addLayer(
					this.controlOptions.routingLineLayerNodeLabelSpec as SymbolLayerSpecification
				);
			}
		}

		const pointModes = this.options.modes?.filter((m) =>
			['time-isochrone', 'distance-isochrone'].includes(m)
		);

		if (pointModes && pointModes.length > 0) {
			// add GeoJSON source for time isochrone features
			if (
				!this.map.getSource(
					(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for time isochrone appearance
			if (
				!this.map.getLayer(
					(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).id
				)
			) {
				this.map.addLayer(
					this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification
				);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.timeIsochroneLineLayerSpec as LineLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.timeIsochroneLineLayerSpec as LineLayerSpecification);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).id
				)
			) {
				this.map.addLayer(
					this.controlOptions.timeIsochroneLabelLayerSpec as SymbolLayerSpecification
				);
			}

			// add GeoJSON source for distance isochrone features
			if (
				!this.map.getSource(
					(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for distance isochrone appearance
			if (
				!this.map.getLayer(
					(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).id
				)
			) {
				this.map.addLayer(
					this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification
				);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.distanceIsochroneLineLayerSpec as LineLayerSpecification).id
				)
			) {
				this.map.addLayer(
					this.controlOptions.distanceIsochroneLineLayerSpec as LineLayerSpecification
				);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification).id
				)
			) {
				this.map.addLayer(
					this.controlOptions.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification
				);
			}
		}

		if (
			((lineModes && lineModes.length > 0) || (pointModes && pointModes.length > 0)) &&
			this.map
		) {
			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe change event of TerraDraw to calc distance
				drawInstance.on('finish', this.handleTerradrawFeatureReady.bind(this));
				// subscribe feature-deleted event for the plugin control
				this.on('feature-deleted', this.onFeatureDeleted.bind(this));
			}
		}
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private unregisterValhallaControl() {
		this.off('feature-deleted', this.onFeatureDeleted.bind(this));
		if (!this.map) return;

		if (
			this.map.getLayer(
				(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id
			);
		}
		if (
			this.map.getLayer(
				(this.controlOptions.routingLineLayerNodeLabelSpec as SymbolLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.routingLineLayerNodeLabelSpec as SymbolLayerSpecification).id
			);
		}
		if (
			this.map.getSource(
				(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source
			)
		) {
			this.map.removeSource(
				(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source
			);
		}

		if (
			this.map.getLayer(
				(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).id
			);
		}
		if (
			this.map.getLayer(
				(this.controlOptions.timeIsochroneLineLayerSpec as LineLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.timeIsochroneLineLayerSpec as LineLayerSpecification).id
			);
		}
		if (
			this.map.getLayer(
				(this.controlOptions.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).id
			);
		}

		if (
			this.map.getSource(
				(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).source
			)
		) {
			this.map.removeSource(
				(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).source
			);
		}

		if (
			this.map.getLayer(
				(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).id
			);
		}
		if (
			this.map.getLayer(
				(this.controlOptions.distanceIsochroneLineLayerSpec as LineLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.distanceIsochroneLineLayerSpec as LineLayerSpecification).id
			);
		}
		if (
			this.map.getLayer(
				(this.controlOptions.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification).id
			);
		}

		if (
			this.map.getSource(
				(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source
			)
		) {
			this.map.removeSource(
				(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source
			);
		}

		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			// subscribe change event of TerraDraw to calc distance
			drawInstance.off('finish', this.handleTerradrawFeatureReady.bind(this));
		}
	}

	/**
	 * Handle finish event of terradraw. Reads pre-computed results from feature properties
	 * and updates the external MapLibre GeoJSON sources.
	 * @param id Feature ID
	 */
	private handleTerradrawFeatureReady = debounce((id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;

		const feature = this.terradraw?.getSnapshotFeature(id);
		if (!feature) return;

		if (feature.properties.routeResult) {
			const pointFeatures = JSON.parse(
				feature.properties.routeResult as string
			) as unknown as GeoJSONStoreFeatures[];
			this.updateRoutingSource(id, pointFeatures);
		}

		if (feature.properties.result && feature.properties.contourType) {
			const isochroneFeatures = JSON.parse(
				feature.properties.result as string
			) as unknown as GeoJSONStoreFeatures[];
			if (feature.properties.contourType === 'time') {
				this.updateTimeIsochroneSource(id, isochroneFeatures);
			} else {
				this.updateDistanceIsochroneSource(id, isochroneFeatures);
			}
		}
	}, 300);

	private updateRoutingSource(
		id: TerraDrawExtend.FeatureId,
		pointFeatures: GeoJSONStoreFeatures[]
	) {
		if (!this.map) return;

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source
		] as GeoJSONSourceSpecification;
		if (geojsonSource) {
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features = geojsonSource.data.features.filter(
					(f) => f.properties?.originalId !== id
				);
			}
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features.push(...pointFeatures);
			}

			(
				this.map.getSource(
					(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).source
				) as GeoJSONSource
			)?.setData(geojsonSource.data);
			this.map.moveLayer(
				(this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification).id,
				this.options.adapterOptions?.renderBelowLayerId
			);
			this.map.moveLayer(
				(this.controlOptions.routingLineLayerNodeLabelSpec as SymbolLayerSpecification).id,
				this.options.adapterOptions?.renderBelowLayerId
			);
		}
	}

	private updateTimeIsochroneSource(
		id: TerraDrawExtend.FeatureId,
		features: GeoJSONStoreFeatures[]
	) {
		if (!this.map) return;

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).source
		] as GeoJSONSourceSpecification;
		if (geojsonSource) {
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features = geojsonSource.data.features.filter(
					(f) => f.properties?.originalId !== id
				);
			}
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features.push(...features);
			}

			(
				this.map.getSource(
					(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).source
				) as GeoJSONSource
			)?.setData(geojsonSource.data);
		}
	}

	private updateDistanceIsochroneSource(
		id: TerraDrawExtend.FeatureId,
		features: GeoJSONStoreFeatures[]
	) {
		if (!this.map) return;

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source
		] as GeoJSONSourceSpecification;
		if (geojsonSource) {
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features = geojsonSource.data.features.filter(
					(f) => f.properties?.originalId !== id
				);
			}
			if (
				typeof geojsonSource.data !== 'string' &&
				geojsonSource.data.type === 'FeatureCollection'
			) {
				geojsonSource.data.features.push(...features);
			}

			(
				this.map.getSource(
					(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).source
				) as GeoJSONSource
			)?.setData(geojsonSource.data);
		}
		this.map.moveLayer(
			(this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification).id,
			this.options.adapterOptions?.renderBelowLayerId
		);
		this.map.moveLayer(
			(this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification).id,
			this.options.adapterOptions?.renderBelowLayerId
		);

		this.map.moveLayer(
			(this.controlOptions.timeIsochroneLineLayerSpec as LineLayerSpecification).id,
			this.options.adapterOptions?.renderBelowLayerId
		);
		this.map.moveLayer(
			(this.controlOptions.distanceIsochroneLineLayerSpec as LineLayerSpecification).id,
			this.options.adapterOptions?.renderBelowLayerId
		);

		this.map.moveLayer(
			(this.controlOptions.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).id,
			this.options.adapterOptions?.renderBelowLayerId
		);
		this.map.moveLayer(
			(this.controlOptions.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification).id,
			this.options.adapterOptions?.renderBelowLayerId
		);
	}

	/**
	 * Event definition when feature is deleted by terradraw
	 */
	private onFeatureDeleted(args: unknown) {
		if (!this.map) return;
		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			let deletedIds: string[] = [];
			if (typeof args === 'object' && args !== null && 'deletedIds' in args) {
				deletedIds = (args as { deletedIds: string[] }).deletedIds;
			}

			const sources = [
				this.controlOptions.routingLineLayerNodeSpec as CircleLayerSpecification,
				this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification,
				this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification
			];
			const sourceIds = sources.map((src) => src.source);
			if (deletedIds && deletedIds.length > 0) {
				// delete only features by IDs
				this.clearExtendedFeatures(sourceIds, deletedIds);
			} else {
				// delete all features
				this.clearExtendedFeatures(sourceIds, undefined);
			}
		}
	}

	/**
	 * get GeoJSON features
	 * @param onlySelected If true, returns only selected features. Default is false.
	 * @returns FeatureCollection in GeoJSON format
	 */
	public getFeatures(onlySelected = false) {
		const fc = super.getFeatures(onlySelected);
		if (!fc) return fc;
		if (!this.terradraw) return fc;
		if (!this.map) return fc;

		// Check if map style and sources are available
		const style = this.map.getStyle();
		if (!style || !style.sources) return fc;

		const timeSourceId = (
			this.controlOptions.timeIsochronePolygonLayerSpec as FillLayerSpecification
		).source;
		if (!timeSourceId || !style.sources[timeSourceId]) return fc;
		const distanceSourceId = (
			this.controlOptions.distanceIsochronePolygonLayerSpec as FillLayerSpecification
		).source;
		if (!distanceSourceId || !style.sources[distanceSourceId]) return fc;

		const geojsonTimeSource: GeoJSONSourceSpecification = style.sources[
			timeSourceId
		] as GeoJSONSourceSpecification;

		const geojsonDistanceSource: GeoJSONSourceSpecification = style.sources[
			distanceSourceId
		] as GeoJSONSourceSpecification;

		const features: GeoJSONStoreFeatures[] = [];

		for (let i = 0; i < fc.features.length; i++) {
			const feature = fc.features[i];
			const geomType = feature.geometry.type;
			if (geomType === 'Point') {
				const fid = feature.id;

				if (geojsonTimeSource) {
					if (
						typeof geojsonTimeSource.data !== 'string' &&
						geojsonTimeSource.data.type === 'FeatureCollection'
					) {
						const filtered = geojsonTimeSource.data.features.filter(
							(f) => f.properties?.originalId === fid
						) as unknown as GeoJSONStoreFeatures[];
						features.push(feature);
						if (filtered.length > 0) {
							features.push(...filtered);
						}
					}
				}

				if (geojsonDistanceSource) {
					if (
						typeof geojsonDistanceSource.data !== 'string' &&
						geojsonDistanceSource.data.type === 'FeatureCollection'
					) {
						const filtered = geojsonDistanceSource.data.features.filter(
							(f) => f.properties?.originalId === fid
						) as unknown as GeoJSONStoreFeatures[];
						features.push(feature);
						if (filtered.length > 0) {
							features.push(...filtered);
						}
					}
				}
			} else {
				features.push(feature);
			}
		}
		return {
			type: 'FeatureCollection',
			features: features
		};
	}
}
