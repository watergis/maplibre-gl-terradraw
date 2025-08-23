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
	LngLat,
	type CircleLayerSpecification,
	type FillLayerSpecification,
	type GeoJSONSourceSpecification,
	type LineLayerSpecification,
	type Map,
	type StyleSpecification,
	type SymbolLayerSpecification
} from 'maplibre-gl';
import type { GeoJSONStoreFeatures, GeoJSONStoreGeometries, TerraDrawExtend } from 'terra-draw';
import {
	debounce,
	ModalDialog,
	routingDistanceUnitOptions,
	type routingDistanceUnitType,
	costingModelOptions,
	ValhallaRouting,
	type costingModelType,
	TERRADRAW_SOURCE_IDS,
	cleanMaplibreStyle,
	ValhallaIsochrone,
	type Contour,
	type ContourType,
	contourTypeOptions
} from '../helpers';

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
		this.createSettingsDialog();
	}

	/**
	 * Get the contour type for Valhalla isochrone api
	 * @returns ContourType
	 * @example 'time', 'distance'
	 */
	get isochroneContourType() {
		return this.valhallaOptions.isochroneOptions?.contourType as ContourType;
	}
	/**
	 * Set the contour type for Valhalla isochrone api
	 * @param value ContourType
	 * @example 'time', 'distance'
	 */
	set isochroneContourType(value: ContourType) {
		if (!this.valhallaOptions.isochroneOptions) {
			this.valhallaOptions.isochroneOptions = {};
		}
		this.valhallaOptions.isochroneOptions.contourType = value;
		this.createSettingsDialog();
	}

	/**
	 * Get the means of transport for Valhalla isochrone api
	 * @returns isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get isochroneCostingModel() {
		return this.valhallaOptions.isochroneOptions?.costingModel as costingModelType;
	}
	/**
	 * Set the means of transport for Valhalla isochrone api
	 * @param value isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set isochroneCostingModel(value: costingModelType) {
		if (!this.valhallaOptions.isochroneOptions) {
			this.valhallaOptions.isochroneOptions = {};
		}
		this.valhallaOptions.isochroneOptions.costingModel = value;
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
		const layers = [this.controlOptions.lineLayerNodeLabelSpec];
		const firstLayer = layers[0];
		return (firstLayer &&
			firstLayer.layout &&
			firstLayer.layout['text-font']) as unknown as string[];
	}

	set fontGlyphs(fontNames: string[]) {
		const layers = [this.controlOptions.lineLayerNodeLabelSpec];
		for (const layer of layers) {
			if (layer && layer.layout) {
				layer.layout['text-font'] = fontNames;
			}
			// layer exists in maplibre, update glyphs as well
			if (this.map && layer && this.map.getLayer(layer.id)) {
				this.map.setLayoutProperty(layer.id, 'text-font', fontNames);
			}
		}
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
		}

		// replace {prefix} with prefixId for sources and layers
		if (!_options.adapterOptions) {
			_options.adapterOptions = {};
		}
		_options.adapterOptions.prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		const prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		(_options.lineLayerNodeLabelSpec as SymbolLayerSpecification).id =
			_options.lineLayerNodeLabelSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.lineLayerNodeLabelSpec as SymbolLayerSpecification).source =
			_options.lineLayerNodeLabelSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.lineLayerNodeSpec as CircleLayerSpecification).id =
			_options.lineLayerNodeSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.lineLayerNodeSpec as CircleLayerSpecification).source =
			_options.lineLayerNodeSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.isochronePolygonLayerSpec as FillLayerSpecification).id =
			_options.isochronePolygonLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.isochronePolygonLayerSpec as FillLayerSpecification).source =
			_options.isochronePolygonLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.isochroneLineLayerSpec as LineLayerSpecification).id =
			_options.isochroneLineLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.isochroneLineLayerSpec as LineLayerSpecification).source =
			_options.isochroneLineLayerSpec?.source.replace('{prefix}', prefixId) as string;

		(_options.isochroneLabelLayerSpec as SymbolLayerSpecification).id =
			_options.isochroneLabelLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.isochroneLabelLayerSpec as SymbolLayerSpecification).source =
			_options.isochroneLabelLayerSpec?.source.replace('{prefix}', prefixId) as string;

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

		const pointSource = this.controlOptions.lineLayerNodeSpec?.source;
		if (pointSource) sourceIds.push(pointSource);

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

		// Contour Type section
		const contourTypeSection = document.createElement('div');
		contourTypeSection.classList.add('setting-section');

		const contourTypeLabel = document.createElement('label');
		contourTypeLabel.textContent = 'Contour Type';
		contourTypeLabel.classList.add('setting-label');
		contourTypeSection.appendChild(contourTypeLabel);

		contourTypeSection.appendChild(
			this.settingDialog.createSegmentButtons(
				contourTypeOptions as unknown as { value: string; label: string }[],
				this.controlOptions.valhallaOptions?.isochroneOptions?.contourType || 'time',
				(value: string) => {
					if (!this.valhallaOptions.isochroneOptions) {
						this.valhallaOptions.isochroneOptions = {};
					}
					this.valhallaOptions.isochroneOptions.contourType = value as ContourType;
					this.dispatchEvent('setting-changed');
				}
			)
		);
		container.appendChild(contourTypeSection);

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
				this.controlOptions.valhallaOptions?.isochroneOptions?.costingModel || 'auto',
				(value: string) => {
					if (!this.valhallaOptions.isochroneOptions) {
						this.valhallaOptions.isochroneOptions = {};
					}
					this.valhallaOptions.isochroneOptions.costingModel = value as costingModelType;
					this.dispatchEvent('setting-changed');
				}
			)
		);
		container.appendChild(transportSection);

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

		const lineModes = this.options.modes?.filter((m) => ['linestring'].includes(m));

		if (lineModes && lineModes.length > 0) {
			// add GeoJSON source for line node
			if (
				!this.map.getSource(
					(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for distance label node appearance
			if (
				!this.map.getLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id)
			) {
				this.map.addLayer(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification);
			}
		}

		const pointModes = this.options.modes?.filter((m) => ['point'].includes(m));

		if (pointModes && pointModes.length > 0) {
			// add GeoJSON source for polygon features
			if (
				!this.map.getSource(
					(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source
				)
			) {
				this.map.addSource(
					(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source,
					{
						type: 'geojson',
						data: { type: 'FeatureCollection', features: [] }
					}
				);
			}

			// add GeoJSON layer for isochrone appearance
			if (
				!this.map.getLayer(
					(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.isochroneLineLayerSpec as LineLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.isochroneLineLayerSpec as LineLayerSpecification);
			}
			if (
				!this.map.getLayer(
					(this.controlOptions.isochroneLabelLayerSpec as SymbolLayerSpecification).id
				)
			) {
				this.map.addLayer(this.controlOptions.isochroneLabelLayerSpec as SymbolLayerSpecification);
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

		if (this.map.getLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id)) {
			this.map.removeLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id);
		}
		if (
			this.map.getLayer((this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id)
		) {
			this.map.removeLayer(
				(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id
			);
		}
		if (
			this.map.getSource((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source)
		) {
			this.map.removeSource(
				(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
			);
		}

		if (
			this.map.getLayer(
				(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).id
			);
		}
		if (
			this.map.getLayer((this.controlOptions.isochroneLineLayerSpec as LineLayerSpecification).id)
		) {
			this.map.removeLayer(
				(this.controlOptions.isochroneLineLayerSpec as LineLayerSpecification).id
			);
		}
		if (
			this.map.getLayer(
				(this.controlOptions.isochroneLabelLayerSpec as SymbolLayerSpecification).id
			)
		) {
			this.map.removeLayer(
				(this.controlOptions.isochroneLabelLayerSpec as SymbolLayerSpecification).id
			);
		}

		if (
			this.map.getSource(
				(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source
			)
		) {
			this.map.removeSource(
				(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source
			);
		}

		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			// subscribe change event of TerraDraw to calc distance
			drawInstance.off('finish', this.handleTerradrawFeatureReady.bind(this));
		}
	}

	/**
	 * Handle finish event of terradraw. It will be called after finishing adding a feature
	 * @param id Feature ID
	 */
	private handleTerradrawFeatureReady = debounce((id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		this.computeRouteByLineFeatureID(id);
		this.computeIsochroneByPointFeatureID(id);
	}, 300);

	private computeIsochroneByPointFeatureID = async (id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		if (!this.valhallaOptions.url) return;

		const feature = this.terradraw?.getSnapshotFeature(id);
		if (!feature || (feature && feature.geometry.type !== 'Point')) return;

		const coord = feature.geometry.coordinates as [number, number];

		const valhallaIsochrone = new ValhallaIsochrone(this.valhallaUrl);
		const fc = await valhallaIsochrone.calcIsochrone(
			coord[0],
			coord[1],
			this.isochroneContourType,
			this.isochroneCostingModel,
			this.isochroneContours
		);
		const updatedFeatures = fc.features.map((f) => {
			f.id = `${id}-${f.properties.contour}`;
			f.properties.originalId = id;
			return f;
		}) as unknown as GeoJSONStoreFeatures[];

		feature.properties = {
			...feature.properties,
			contourType: this.isochroneContourType,
			costingModel: this.isochroneCostingModel,
			result: updatedFeatures as unknown as string
		};

		// to update the feature properties, remove and add are needed currently
		this.terradraw?.removeFeatures([id]);
		this.terradraw?.addFeatures([feature]);

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source
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
				geojsonSource.data.features.push(...updatedFeatures);
			}

			(
				this.map.getSource(
					(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source
				) as GeoJSONSource
			)?.setData(geojsonSource.data);
			this.map.moveLayer(
				(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).id
			);
			this.map.moveLayer((this.controlOptions.isochroneLineLayerSpec as LineLayerSpecification).id);
			this.map.moveLayer(
				(this.controlOptions.isochroneLabelLayerSpec as SymbolLayerSpecification).id
			);
		}
	};

	/**
	 * Compute elevation by a LineString feature ID
	 * @param id FeatureID
	 */
	private computeRouteByLineFeatureID = async (id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;

		if (!this.valhallaOptions.url) return;

		const feature = this.terradraw?.getSnapshotFeature(id);
		if (!feature || (feature && feature.geometry.type !== 'LineString')) return;

		const routingEngine = new ValhallaRouting(this.valhallaUrl);
		const tripData: LngLat[] = feature.geometry.coordinates.map((c) => {
			const coord = c as [number, number];
			return new LngLat(coord[0], coord[1]);
		});
		if (!tripData || (tripData && tripData.length < 2)) return;

		const result = await routingEngine.calcRoute(
			tripData,
			this.routingCostingModel,
			this.routingDistanceUnit
		);
		if (!result || !result.feature) return;
		const newGeometry = result?.feature.geometry as GeoJSONStoreGeometries;
		// this.terradraw?.updateFeatureGeometry(id, newGeometry);

		feature.geometry = newGeometry;
		feature.properties = {
			...feature.properties,
			...result?.feature.properties
		};

		// to update the feature properties, remove and add are needed currently
		this.terradraw?.removeFeatures([id]);
		this.terradraw?.addFeatures([feature]);

		// add line node features to the map for label
		const pointFeactureCollection = result?.pointFeatures;
		const updatedFeatures = pointFeactureCollection.features.map((f) => {
			f.id = `${id}-${f.id}`;
			f.properties.originalId = id;
			return f;
		}) as unknown as GeoJSONStoreFeatures[];

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
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
				geojsonSource.data.features.push(...updatedFeatures);
			}

			(
				this.map.getSource(
					(this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).source
				) as GeoJSONSource
			)?.setData(geojsonSource.data);
			this.map.moveLayer((this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification).id);
			this.map.moveLayer(
				(this.controlOptions.lineLayerNodeLabelSpec as SymbolLayerSpecification).id
			);
		}
	};

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
				this.controlOptions.lineLayerNodeSpec as CircleLayerSpecification,
				this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification
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
		if (!this.map) return;

		const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
			(this.controlOptions.isochronePolygonLayerSpec as FillLayerSpecification).source
		] as GeoJSONSourceSpecification;

		const features: GeoJSONStoreFeatures[] = [];

		for (let i = 0; i < fc.features.length; i++) {
			const feature = fc.features[i];
			if (!this.map) continue;
			if (!this.map.loaded()) continue;
			const geomType = feature.geometry.type;
			if (geomType === 'Point') {
				const fid = feature.id;

				if (geojsonSource) {
					if (
						typeof geojsonSource.data !== 'string' &&
						geojsonSource.data.type === 'FeatureCollection'
					) {
						const filtered = geojsonSource.data.features.filter(
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
