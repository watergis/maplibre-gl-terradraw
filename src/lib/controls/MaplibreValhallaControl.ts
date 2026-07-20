import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { defaultValhallaControlOptions } from '../constants';
import type { TerradrawMode, TerradrawValhallaMode, ValhallaControlOptions } from '../interfaces';
import {
	GeoJSONSource,
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
	private _modalDialog: ModalDialog | undefined;

	private get routingMode() {
		const mode = this.controlOptions.modeOptions?.['routing'];
		return mode instanceof TerraDrawValhallaRoutingMode ? mode : undefined;
	}

	private get timeIsochroneMode() {
		const mode = this.controlOptions.modeOptions?.['time-isochrone'];
		return mode instanceof TerraDrawValhallaTimeIsochroneMode ? mode : undefined;
	}

	private get distanceIsochroneMode() {
		const mode = this.controlOptions.modeOptions?.['distance-isochrone'];
		return mode instanceof TerraDrawValhallaDistanceIsochroneMode ? mode : undefined;
	}

	/**
	 * Get the URL of Valhalla API
	 */
	get valhallaUrl() {
		return (
			this.routingMode?.url ?? this.timeIsochroneMode?.url ?? this.distanceIsochroneMode?.url ?? ''
		);
	}
	/**
	 * Set the URL of Valhalla API
	 * @param value URL of Valhalla API
	 */
	set valhallaUrl(value: string) {
		if (this.routingMode) this.routingMode.url = value;
		if (this.timeIsochroneMode) this.timeIsochroneMode.url = value;
		if (this.distanceIsochroneMode) this.distanceIsochroneMode.url = value;
	}

	/**
	 * Get the means of transport for Valhalla routing api
	 * @returns costingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get routingCostingModel() {
		return this.routingMode?.costingModel ?? 'auto';
	}
	/**
	 * Set the means of transport for Valhalla routing api
	 * @param value costingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set routingCostingModel(value: costingModelType) {
		if (this.routingMode) this.routingMode.costingModel = value;
		this.createSettingsDialog();
	}

	/**
	 * Get the distance unit for Valhalla routing api
	 * @returns routingDistanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	get routingDistanceUnit() {
		return this.routingMode?.distanceUnit ?? 'kilometers';
	}

	/**
	 * Set the distance unit for Valhalla routing api
	 * @param value routingDistanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	set routingDistanceUnit(value: routingDistanceUnitType) {
		if (this.routingMode) this.routingMode.distanceUnit = value;
		this.createSettingsDialog();
	}

	/**
	 * Get the means of transport for Valhalla time isochrone api
	 * @returns isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get timeIsochroneCostingModel() {
		return this.timeIsochroneMode?.costingModel ?? 'auto';
	}
	/**
	 * Set the means of transport for Valhalla time isochrone api
	 * @param value isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set timeIsochroneCostingModel(value: costingModelType) {
		if (this.timeIsochroneMode) this.timeIsochroneMode.costingModel = value;
		this.createSettingsDialog();
	}

	/**
	 * Get the means of transport for Valhalla distance isochrone api
	 * @returns isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get distanceIsochroneCostingModel() {
		return this.distanceIsochroneMode?.costingModel ?? 'auto';
	}
	/**
	 * Set the means of transport for Valhalla distance isochrone api
	 * @param value isochroneCostingModelType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set distanceIsochroneCostingModel(value: costingModelType) {
		if (this.distanceIsochroneMode) this.distanceIsochroneMode.costingModel = value;
		this.createSettingsDialog();
	}

	/**
	 * Get the list of contours for Valhalla isochrone api
	 * @returns Contour[]
	 */
	get isochroneContours() {
		return this.timeIsochroneMode?.contours ?? this.distanceIsochroneMode?.contours ?? [];
	}

	/**
	 * Set the list of contours for Valhalla isochrone api
	 * @param value Contour[]
	 */
	set isochroneContours(value: Contour[]) {
		if (this.timeIsochroneMode) this.timeIsochroneMode.contours = value;
		if (this.distanceIsochroneMode) this.distanceIsochroneMode.contours = value;
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
			_options = {
				..._options,
				...options,
				modeOptions: {
					..._options.modeOptions,
					...(options.modeOptions ?? {})
				}
			};
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

		(_options.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).id =
			_options.timeIsochroneLabelLayerSpec?.id.replace('{prefix}', prefixId) as string;
		(_options.timeIsochroneLabelLayerSpec as SymbolLayerSpecification).source =
			_options.timeIsochroneLabelLayerSpec?.source.replace('{prefix}', prefixId) as string;

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
		this._cssPrefix = 'valhalla-';
		this.controlOptions = _options;

		this.validateModeUrls();
	}

	private validateModeUrls() {
		const requiredModes = [
			this.routingMode,
			this.timeIsochroneMode,
			this.distanceIsochroneMode
		].filter(
			(
				mode
			): mode is
				| TerraDrawValhallaRoutingMode
				| TerraDrawValhallaTimeIsochroneMode
				| TerraDrawValhallaDistanceIsochroneMode => Boolean(mode)
		);

		if (requiredModes.some((mode) => !mode.url)) {
			throw new Error(
				'Valhalla URL is required for this control. Please set modeOptions.routing/time-isochrone/distance-isochrone url in options.'
			);
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
		const sourceIds = [...TERRADRAW_SOURCE_IDS];

		const routingLabelSource = this.controlOptions.routingLineLayerNodeLabelSpec?.source;
		if (routingLabelSource) sourceIds.push(routingLabelSource);

		const timeIsochroneLabelSource = this.controlOptions.timeIsochroneLabelLayerSpec?.source;
		if (timeIsochroneLabelSource) sourceIds.push(timeIsochroneLabelSource);

		const distanceIsochroneLabelSource =
			this.controlOptions.distanceIsochroneLabelLayerSpec?.source;
		if (distanceIsochroneLabelSource) sourceIds.push(distanceIsochroneLabelSource);

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
					this.routingCostingModel = value as costingModelType;
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
					this.routingDistanceUnit = value as routingDistanceUnitType;
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
				this.timeIsochroneCostingModel,
				(value: string) => {
					this.timeIsochroneCostingModel = value as costingModelType;
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
				this.distanceIsochroneCostingModel,
				(value: string) => {
					this.distanceIsochroneCostingModel = value as costingModelType;
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

		const currentContours = this.isochroneContours;

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

			const latestContours = [...this.isochroneContours];
			const baseContour = latestContours[latestContours.length - 1] ?? {
				time: 15,
				distance: 4,
				color: '#ff00ff'
			};
			const newContour = JSON.parse(JSON.stringify(baseContour));
			const index = tbody.children.length;
			const row = this.createContourRow(newContour, index);
			tbody.appendChild(row);
			latestContours.push(newContour);
			this.isochroneContours = latestContours;
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
			const contours = [...this.isochroneContours];
			if (!contours[index]) return;
			contours[index].color = (e.target as HTMLInputElement).value;
			this.isochroneContours = contours;
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
			const contours = [...this.isochroneContours];
			if (!contours[index]) return;
			contours[index].time = parseFloat((e.target as HTMLInputElement).value);
			this.isochroneContours = contours;
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
			const contours = [...this.isochroneContours];
			if (!contours[index]) return;
			contours[index].distance = parseFloat((e.target as HTMLInputElement).value);
			this.isochroneContours = contours;
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

				const contours = [...this.isochroneContours];
				contours.splice(index, 1);
				this.isochroneContours = contours;

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
				const currentContours = this.isochroneContours;
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
	 * Register Valhalla control related maplibre sources and label layers.
	 *
	 * Result features (routed lines, node points and isochrone polygons) are kept
	 * in the Terra Draw store and rendered by Terra Draw itself. Only the text
	 * label layers are kept as custom maplibre symbol layers because Terra Draw
	 * has no text rendering; their sources are fed from the Terra Draw store.
	 */
	private registerValhallaControl() {
		if (!this.map) return;

		const labelSpecs: SymbolLayerSpecification[] = [];
		const modes: TerradrawValhallaMode[] = this.options.modes as TerradrawValhallaMode[];
		if (modes?.includes('routing')) {
			labelSpecs.push(
				this.controlOptions.routingLineLayerNodeLabelSpec as SymbolLayerSpecification
			);
		}
		if (modes?.includes('time-isochrone')) {
			labelSpecs.push(this.controlOptions.timeIsochroneLabelLayerSpec as SymbolLayerSpecification);
		}
		if (modes?.includes('distance-isochrone')) {
			labelSpecs.push(
				this.controlOptions.distanceIsochroneLabelLayerSpec as SymbolLayerSpecification
			);
		}

		for (const spec of labelSpecs) {
			if (!spec) continue;
			if (!this.map.getSource(spec.source)) {
				this.map.addSource(spec.source, {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				});
			}
			if (!this.map.getLayer(spec.id)) {
				this.map.addLayer(spec);
			}
		}

		if (labelSpecs.length > 0) {
			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				drawInstance.on('change', this.handleStoreChange);
				drawInstance.on('finish', this.handleStoreChange);
			}
			this.on('feature-deleted', this.handleStoreChange);
		}
	}

	/**
	 * Unregister Valhalla control related maplibre sources and label layers
	 */
	private unregisterValhallaControl() {
		this.off('feature-deleted', this.handleStoreChange);

		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			drawInstance.off('change', this.handleStoreChange);
			drawInstance.off('finish', this.handleStoreChange);
		}

		if (!this.map) return;

		const labelSpecs = [
			this.controlOptions.routingLineLayerNodeLabelSpec,
			this.controlOptions.timeIsochroneLabelLayerSpec,
			this.controlOptions.distanceIsochroneLabelLayerSpec
		];
		for (const spec of labelSpecs) {
			if (!spec) continue;
			if (this.map.getLayer(spec.id)) {
				this.map.removeLayer(spec.id);
			}
			if (this.map.getSource(spec.source)) {
				this.map.removeSource(spec.source);
			}
		}
	}

	/**
	 * Update the label symbol layer sources from the current Terra Draw store snapshot.
	 */
	private handleStoreChange = debounce(() => {
		if (!this.map || !this.terradraw) return;

		const snapshot = this.terradraw.getSnapshot();

		this.setLabelSourceData(
			this.controlOptions.routingLineLayerNodeLabelSpec,
			snapshot.filter((f) => f.properties?.mode === 'routing' && f.geometry.type === 'Point')
		);
		this.setLabelSourceData(
			this.controlOptions.timeIsochroneLabelLayerSpec,
			snapshot.filter(
				(f) => f.properties?.mode === 'time-isochrone' && f.geometry.type === 'Polygon'
			)
		);
		this.setLabelSourceData(
			this.controlOptions.distanceIsochroneLabelLayerSpec,
			snapshot.filter(
				(f) => f.properties?.mode === 'distance-isochrone' && f.geometry.type === 'Polygon'
			)
		);
	}, 100);

	private setLabelSourceData(
		spec: SymbolLayerSpecification | undefined,
		features: GeoJSONStoreFeatures[]
	) {
		if (!this.map || !spec) return;
		const source = this.map.getSource(spec.source) as GeoJSONSource | undefined;
		if (!source) return;
		source.setData({
			type: 'FeatureCollection',
			features: features as unknown as GeoJSON.Feature[]
		});
		if (this.map.getLayer(spec.id)) {
			this.map.moveLayer(spec.id, this.options.adapterOptions?.renderBelowLayerId);
		}
	}

	/**
	 * Delete selected features from the store.
	 *
	 * Valhalla result features created from the same operation share
	 * `properties.groupId` (isochrone contour polygons of one request, or a route
	 * line and its node points). The selection is expanded to the whole group so
	 * that e.g. deleting one contour polygon removes its siblings, and deleting a
	 * route line removes its node points as well.
	 */
	protected handleDeleteSelectedFeatures(): void {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) return;

		const snapshot = this.terradraw.getSnapshot();
		const selected = snapshot.filter((f) => f.properties.selected === true);

		if (selected.length > 0) {
			const groupKey = (f: GeoJSONStoreFeatures) =>
				String(f.properties?.groupId ?? f.properties?.originalId ?? f.id);
			const groupKeys = new Set(selected.map((f) => groupKey(f)));
			const ids = snapshot
				.filter((f) => f.properties.mode !== 'select' && groupKeys.has(groupKey(f)))
				.map((f) => f.id) as TerraDrawExtend.FeatureId[];

			this.terradraw.removeFeatures(ids);
			for (const id of ids) {
				this.terradraw.deselectFeature(id);
			}
			this.dispatchEvent('feature-deleted', { deletedIds: ids });
		}

		this.toggleDeleteSelectionButton();
		this.toggleButtonsWhenNoFeature();
	}
}
