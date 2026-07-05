import type {
	ControlPosition,
	GeoJSONSource,
	GeoJSONSourceSpecification,
	IControl,
	Map,
	StyleSpecification,
	SymbolLayerSpecification
} from 'maplibre-gl';
import {
	TerraDraw,
	TerraDrawExtend,
	TerraDrawModeUndoRedo,
	TerraDrawRenderMode,
	TerraDrawSessionUndoRedo,
	TerraDrawUndoRedoKeyboardShortcuts,
	type GeoJSONStoreFeatures,
	type GeoJSONStoreGeometries
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import type {
	TerradrawControlOptions,
	EventType,
	TerradrawMode,
	TerradrawModeClass,
	EventArgs
} from '../interfaces';
import { defaultControlOptions, getDefaultModeOptions } from '../constants';
import { capitalize, cleanMaplibreStyle, TERRADRAW_SOURCE_IDS, ModalDialog } from '../helpers';
import type { TextModeStyling } from '../modes/TerraDrawTextMode';

/**
 * Maplibre GL Terra Draw Control
 */
export class MaplibreTerradrawControl implements IControl {
	protected controlContainer?: HTMLElement;
	protected map?: Map;
	protected modeButtons: { [key: string]: HTMLButtonElement } = {};
	protected _isExpanded = false;
	protected _cssPrefix = '';
	protected _fontGlyphs?: string[];
	protected _isWaitingForTextStyleLoad = false;

	/**
	 * get the state of whether the control is expanded or collapsed
	 */
	public get isExpanded(): boolean {
		return this._isExpanded;
	}

	/**
	 * Get/Set font glyph for the TextMode label layer (`{prefix}-text-labels`).
	 *
	 * As default, the TextMode label uses `sans-serif` so it is not constrained by the
	 * glyphs available in your maplibre style. See https://maplibre.org/maplibre-style-spec/layers/#text-font
	 *
	 * If you are using your own maplibre style or a different map provider, you probably need to set the
	 * font glyphs to match glyphs available in your maplibre style.
	 *
	 * Font glyph availability depends on what types of glyphs are supported by your maplibre style
	 * (e.g., Carto, Openmap tiles, Protomap, Maptiler, etc.). Please make sure the font glyphs are
	 * available in your maplibre style.
	 *
	 * Usage:
	 *
	 * ```js
	 * const drawControl = new MaplibreTerradrawControl({ modes: ['text'] })
	 * drawControl.fontGlyphs = ['Open Sans Italic']
	 * map.addControl(drawControl)
	 * ```
	 */
	public get fontGlyphs(): string[] | undefined {
		return this._fontGlyphs;
	}

	public set fontGlyphs(fontNames: string[]) {
		this._fontGlyphs = fontNames;
		// update the TextMode label layer if it already exists on the map
		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		const layerId = `${prefixId}-text-labels`;
		if (this.map && this.map.getLayer(layerId)) {
			this.map.setLayoutProperty(layerId, 'text-font', fontNames);
		}
	}

	/**
	 * Apply the given font glyphs to the provided symbol layer specs and, when they already
	 * exist on the map, to their live layers via `setLayoutProperty`.
	 *
	 * Shared by subclasses (e.g. `MaplibreMeasureControl`, `MaplibreValhallaControl`) so their
	 * `fontGlyphs` setters can reuse the same layer-update logic.
	 * @param fontNames font glyph names to apply as `text-font`
	 * @param layers symbol layer specs to update (undefined entries are skipped)
	 */
	protected applyFontGlyphs(
		fontNames: string[],
		layers: (SymbolLayerSpecification | undefined)[]
	): void {
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
	 * CSS prefix for the control buttons.
	 * Default is empty string
	 */
	protected get cssPrefix(): string {
		return this._cssPrefix;
	}

	/**
	 * set the state of the control either expanded or collapsed.
	 * terradraw mode will be reset if the state is changed.
	 * either `expanded` or `collapsed` event is dispatched when changed
	 */
	public set isExpanded(value: boolean) {
		this._isExpanded = value;
		const controls = document.getElementsByClassName(
			`maplibregl-terradraw-${this.cssPrefix}add-control`
		);
		for (let i = 0; i < controls.length; i++) {
			const item = controls.item(i);
			if (!item) continue;
			if (this.isExpanded) {
				item.classList.remove('hidden');
			} else {
				item.classList.add('hidden');
			}
		}
		const addButton = document.getElementsByClassName(
			`maplibregl-terradraw-${this.cssPrefix}render-button`
		);
		if (addButton && addButton.length > 0) {
			if (this.isExpanded) {
				addButton.item(0)?.classList.add('enabled');
			} else {
				addButton.item(0)?.classList.remove('enabled');
				this.resetActiveMode();
			}
		}
		this.toggleDeleteSelectionButton();
		this.toggleButtonsWhenNoFeature();
		if (this.isExpanded) {
			this.dispatchEvent('expanded');
		} else {
			this.dispatchEvent('collapsed');
		}
	}

	/**
	 * Show delete confirmation popup when deleting features if true. Default is false
	 */
	public get showDeleteConfirmation() {
		return this.options.showDeleteConfirmation === true;
	}

	/**
	 * Set show delete confirmation popup when deleting features if true. Default is false
	 */
	public set showDeleteConfirmation(value: boolean) {
		this.options.showDeleteConfirmation = value;
	}

	protected terradraw?: TerraDraw;
	protected options: TerradrawControlOptions;
	protected events: {
		[key: string]: [(event: EventArgs) => void];
	} = {};

	protected defaultMode = 'render';

	/**
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: TerradrawControlOptions) {
		this.modeButtons = {};

		this.options = {
			...defaultControlOptions,
			modes: [...(defaultControlOptions.modes ?? [])],
			...options
		};
		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';

		if (!this.options.adapterOptions) {
			this.options.adapterOptions = {};
		}
		if (!this.options.adapterOptions?.prefixId) {
			this.options.adapterOptions.prefixId = prefixId;
		}

		if (!this.options.undoRedo) {
			this.options.undoRedo = {
				modeLevel: new TerraDrawModeUndoRedo({ maxStackSize: 100 }),
				sessionLevel: new TerraDrawSessionUndoRedo({ maxStackSize: 100 }),
				keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts()
			};
		}
	}

	/**
	 * Get the default control position
	 * @returns default control position. Default is 'top-right'
	 */
	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	/**
	 * add the plugin control to maplibre
	 * @param map Maplibre Map object
	 * @returns HTML Element
	 */
	public onAdd(map: Map): HTMLElement {
		if (this.options && this.options.modes && this.options.modes.length === 0) {
			throw new Error('At least a mode must be enabled.');
		}
		this.map = map;

		const defaultOptions = getDefaultModeOptions();
		const modes: TerradrawModeClass[] = [];

		this.options?.modes?.forEach((m) => {
			if (this.options.modeOptions && this.options.modeOptions[m]) {
				const newOption = this.options.modeOptions[m];

				if (m === 'select') {
					// overwrite other select mode settings if new option does not contain.
					const defaultOption = defaultOptions[m];
					if (defaultOption) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const flags = defaultOption.flags;
						Object.keys(flags).forEach((key) => {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							if (newOption.flags[key]) return;
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							newOption.flags[key] = flags[key];
						});
					}
				}
				modes.push(newOption);
			} else if (defaultOptions[m]) {
				modes.push(defaultOptions[m]);
			}
		});

		// sometimes, an error of 'Can not register unless mode is unregistered' is thrown by terradraw,
		// thus, force reset mode state as unregistered
		modes.forEach((m) => {
			if (m.state !== 'unregistered') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				m._state = 'unregistered';
			}
		});

		// if no render button is specified, it add hidden render mode
		if (!this.options?.modes?.includes('render')) {
			modes.push(
				new TerraDrawRenderMode({
					modeName: 'default',
					styles: {}
				})
			);
			this.defaultMode = 'default';
		}

		this.isExpanded = this.options.open === true;

		this.terradraw = new TerraDraw({
			adapter: new TerraDrawMapLibreGLAdapter({ map, ...this.options.adapterOptions }),
			modes: modes,
			undoRedo: this.options.undoRedo
		});

		if (this.map?.loaded()) {
			this.terradraw.start();
		} else {
			this.map?.once('load', () => {
				this.terradraw?.start();
			});
		}

		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(`maplibregl-ctrl`);
		this.controlContainer.classList.add(`maplibregl-ctrl-group`);

		modes.forEach((m: TerradrawModeClass) => {
			if (m.mode === 'default') return;
			this.addTerradrawButton(m.mode as TerradrawMode);
		});

		Object.values(this.modeButtons).forEach((ele) => {
			this.controlContainer?.appendChild(ele);
		});

		this.toggleButtonsWhenNoFeature();
		this.terradraw?.on('finish', this.toggleButtonsWhenNoFeature.bind(this));
		this.terradraw?.on('history', this.handleHistoryChange.bind(this));

		this.map.once('idle', () => {
			this.toggleButtonsWhenNoFeature();
		});
		return this.controlContainer;
	}

	/**
	 * Remove the plugin control from maplibre
	 * @returns void
	 */
	public onRemove(): void {
		if (!this.controlContainer || !this.controlContainer.parentNode || !this.map) {
			return;
		}
		this.deactivate();
		this.modeButtons = {};
		this.terradraw = undefined;
		this.map = undefined;
		this.controlContainer.parentNode.removeChild(this.controlContainer);
	}

	/**
	 * Register an event for the plugin
	 * @param event event type
	 * @param callback
	 */
	public on(event: EventType, callback: (event: EventArgs) => void) {
		if (!this.events[event]) {
			this.events[event] = [callback];
		} else {
			this.events[event].push(callback);
		}
	}

	/**
	 * Unregister an event for the plugin
	 * @param event event type
	 * @param callback
	 * @returns
	 */
	public off(event: EventType, callback: (event: EventArgs) => void) {
		if (!this.events[event]) return;
		const index = this.events[event].findIndex((c) => c === callback);
		if (index !== -1) {
			this.events[event].splice(index, 1);
		}
	}

	/**
	 * Dispatch an event. Pass the current snapshot of features and mode
	 * @param event event type
	 * @param args additional arguments
	 */
	protected dispatchEvent(event: EventType, args?: { [key: string]: unknown }) {
		if (this.events[event]) {
			this.events[event].forEach((callback) => {
				const snapshot = this.terradraw?.getSnapshot();
				const currentFeature = snapshot?.filter((f) => f.properties.selected === true);
				callback({
					feature: currentFeature,
					mode: this.terradraw?.getMode() as TerradrawMode,
					...args
				});
			});
		}
	}

	/**
	 * Activate Terra Draw to start drawing
	 */
	public activate() {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) {
			this.terradraw.start();
		}
	}

	/**
	 * Deactivate Terra Draw to stop drawing
	 */
	public deactivate() {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) return;
		this.resetActiveMode();
		this.dispatchEvent('mode-changed');
		this.terradraw.stop();
	}

	/**
	 * Handle mode change operations that should be executed after setMode is called
	 * @param mode The active mode name
	 * @param target The Terra Draw instance
	 * @returns The result of the setMode operation
	 */
	protected handleModeChange(mode: string, target: TerraDraw) {
		// Call the original setMode method
		const result = target.setMode(mode);

		// Sync button states after mode change
		this.syncButtonStates(mode);

		if (mode !== this.defaultMode) {
			this.activate();
		}

		// Dispatch the mode-changed event
		this.dispatchEvent('mode-changed');

		return result;
	}

	/**
	 * Synchronize button states with the current Terra Draw mode
	 * @param mode The active mode name
	 */
	protected syncButtonStates(mode: string) {
		if (!this.controlContainer) return;

		// Remove active class from all mode buttons
		const controls = this.controlContainer.getElementsByClassName(
			`maplibregl-terradraw-${this.cssPrefix}add-control`
		);
		for (let i = 0; i < controls.length; i++) {
			const item = controls.item(i);
			if (!item) continue;
			item.classList.remove('active');
		}

		// Add active class to the current mode button if it exists
		if (mode !== this.defaultMode && mode !== 'render') {
			const modeButton = this.controlContainer.getElementsByClassName(
				`maplibregl-terradraw-${this.cssPrefix}add-${mode}-button`
			);
			if (modeButton && modeButton.length > 0) {
				modeButton[0].classList.add('active');
			}
		}

		// Update other button states that depend on the mode
		this.toggleDeleteSelectionButton();
		this.toggleButtonsWhenNoFeature();
	}

	/**
	 * Get the Terra Draw instance.
	 * For the Terra Draw API, please refer to https://terradraw.io/#/api
	 * @returns Terra Draw instance with additional extensions for the plugin control
	 */
	public getTerraDrawInstance() {
		if (!this.terradraw) return this.terradraw;

		return new Proxy(this.terradraw, {
			get: (target, prop, receiver) => {
				if (prop === 'setMode') {
					return (mode: string) => {
						return this.handleModeChange(mode, target);
					};
				}
				if (prop === 'clearUndoRedoHistory') {
					return () => {
						target.clearUndoRedoHistory();
						this.handleHistoryChange({ undoSize: 0, redoSize: 0 });
					};
				}
				return Reflect.get(target, prop, receiver);
			}
		});
	}

	/**
	 * Handle the history event from TerraDraw to update undo/redo button states
	 * @param event HistoryEvent from TerraDraw
	 */
	protected handleHistoryChange(event: { undoSize: number; redoSize: number }) {
		if (!this.controlContainer) return;

		const undoBtns = this.controlContainer.getElementsByClassName(
			`maplibregl-terradraw-${this.cssPrefix}undo-button`
		);
		for (let i = 0; i < undoBtns.length; i++) {
			const btn = undoBtns.item(i) as HTMLButtonElement;
			if (btn) btn.disabled = event.undoSize === 0;
		}

		const redoBtns = this.controlContainer.getElementsByClassName(
			`maplibregl-terradraw-${this.cssPrefix}redo-button`
		);
		for (let i = 0; i < redoBtns.length; i++) {
			const btn = redoBtns.item(i) as HTMLButtonElement;
			if (btn) btn.disabled = event.redoSize === 0;
		}
	}

	/**
	 * Toggle editor control
	 */
	protected toggleEditor() {
		if (!this.terradraw) return;
		this.isExpanded = !this.isExpanded;
	}

	/**
	 * Reset active mode to back to render mode
	 */
	public resetActiveMode() {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) {
			this.terradraw.start();
		}
		this.terradraw?.setMode(this.defaultMode);
		this.syncButtonStates(this.defaultMode);
	}

	/**
	 * Add Terra Draw drawing mode button
	 * @param mode Terra Draw mode name
	 */
	protected addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.type = 'button';
		this.modeButtons[mode] = btn;

		if (mode === 'render') {
			btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);

			if (this.isExpanded) {
				btn.classList.add('enabled');
			}
			btn.type = 'button';
			btn.title = capitalize('expand or collapse drawing tool');
			btn.addEventListener('click', this.toggleEditor.bind(this));
		} else {
			btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}add-control`);

			if (!this.isExpanded) {
				btn.classList.add('hidden');
			}
			btn.title = capitalize(mode.replace(/-/g, ' '));

			if (mode === 'delete') {
				btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
				btn.addEventListener('click', this.handleDeleteAllFeatures.bind(this));
			} else if (mode === 'delete-selection') {
				btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
				btn.classList.add(`hidden-delete-selection`);
				btn.addEventListener('click', this.handleDeleteSelectedFeatures.bind(this));
			} else if (mode === 'download') {
				btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
				btn.addEventListener('click', this.handleDownload.bind(this));
			} else if (['undo', 'redo'].includes(mode)) {
				btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
				btn.disabled = true;

				btn.addEventListener('click', () => {
					if (!this.terradraw) return;
					if (mode === 'undo') {
						this.terradraw.undo();
					} else {
						this.terradraw.redo();
					}
				});
			} else {
				btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}add-${mode}-button`);

				btn.addEventListener('click', () => {
					if (!this.terradraw) return;

					const isActive = btn.classList.contains('active');
					this.activate();
					this.resetActiveMode();

					if (!isActive) {
						// Use the original terradraw instance to avoid triggering proxy twice
						// The proxy will be triggered when users call getTerraDrawInstance().setMode()
						this.terradraw.setMode(mode);
						this.syncButtonStates(mode);
					}
					this.dispatchEvent('mode-changed');
				});

				if (mode === 'text') {
					const styles = this.getTextModeStyling();

					const map = this.map as Map;

					this.createTerradrawTextLayer(map, styles);

					this.terradraw?.on('change', () => {
						this.createTerradrawTextLayer(map, styles);
					});

					// set on select styles
					this.terradraw?.on('select', (featureId) => {
						this.selectTextLabelLayer(featureId);

						// update text mode layers coordinates on mousemove
						this.terradraw?.on('change', () => {
							const snapshot = this.terradraw?.getSnapshot() ?? [];
							const textFeatures = snapshot.filter(
								(f) => f.properties?.mode === 'text' && f.properties?.text
							) as GeoJSONStoreFeatures<GeoJSONStoreGeometries>[];

							const prefixId = this.options.adapterOptions?.prefixId ?? 'td';

							const source = map.getSource(`${prefixId}-text`) as GeoJSONSource | undefined;
							source?.setData({
								type: 'FeatureCollection',
								features: textFeatures
							});
						});
					});

					this.terradraw?.on('deselect', () => {
						this.resetTextLabelLayer();
					});
				}
			}
		}
	}

	/**
	 * get GeoJSON features
	 * @param onlySelected If true, returns only selected features. Default is false.
	 * @returns FeatureCollection in GeoJSON format
	 */
	public getFeatures(onlySelected = false) {
		if (!this.terradraw) return;
		const snapshot = this.terradraw?.getSnapshot();
		const features = snapshot.filter((f) => f.properties.mode !== 'select');

		const fc = {
			type: 'FeatureCollection',
			features: features
		};
		if (onlySelected !== true) {
			return fc;
		}
		fc.features = fc.features.filter((f) => f.properties.selected === true);
		return fc;
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
		return cleanMaplibreStyle(
			style,
			options,
			TERRADRAW_SOURCE_IDS,
			this.options.adapterOptions?.prefixId
		);
	}

	/**
	 * Show delete confirmation dialog.
	 *
	 * @param onConfirm Callback function that will be invoked when the user confirms deletion
	 * by clicking the "Delete" button in the dialog; typically used to delete all features
	 * before the dialog is closed.
	 */
	protected showDeleteConfirmationDialog(onConfirm: () => void): void {
		const dialog = new ModalDialog(
			'maplibre-terradraw-delete-confirmation-dialog',
			'Delete All Features'
		);

		dialog.create(document.body, (content) => {
			const message = document.createElement('p');
			message.textContent = 'Are you sure you want to delete all features?';
			content.appendChild(message);

			const buttonContainer = document.createElement('div');
			buttonContainer.classList.add('dialog-buttons');

			const cancelButton = document.createElement('button');
			cancelButton.type = 'button';
			cancelButton.textContent = 'Cancel';
			cancelButton.classList.add('dialog-button-cancel');
			cancelButton.addEventListener('click', () => {
				dialog.close();
			});

			const deleteButton = document.createElement('button');
			deleteButton.type = 'button';
			deleteButton.textContent = 'Delete';
			deleteButton.classList.add('dialog-button-delete');
			deleteButton.addEventListener('click', () => {
				onConfirm();
				dialog.close();
			});

			buttonContainer.appendChild(cancelButton);
			buttonContainer.appendChild(deleteButton);
			content.appendChild(buttonContainer);

			return content;
		});

		dialog.open();
	}

	/**
	 * Delete all features from the store
	 */
	protected handleDeleteAllFeatures(): void {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) return;

		const deleteFeatures = () => {
			this.terradraw?.clear();
			this.clearTextLayers();
			this.resetActiveMode();
			this.toggleDeleteSelectionButton();
			this.toggleButtonsWhenNoFeature();
			this.dispatchEvent('feature-deleted');
		};

		if (this.options.showDeleteConfirmation === true) {
			this.showDeleteConfirmationDialog(deleteFeatures);
		} else {
			deleteFeatures();
		}
	}

	/**
	 * Delete selected features from the store
	 */
	protected handleDeleteSelectedFeatures(): void {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) return;

		const snapshot = this.terradraw?.getSnapshot();
		const selected = snapshot.filter((f) => f.properties.selected === true);

		if (selected.length > 0) {
			const ids = selected.map((f) => f.id) as TerraDrawExtend.FeatureId[];

			this.terradraw.removeFeatures(ids);
			for (const id of ids) {
				this.terradraw.deselectFeature(id);
			}
			this.dispatchEvent('feature-deleted', { deletedIds: ids });

			// handle deletion of text layer when mode === 'text'
			this.deleteSelectedTextSymbolLayer(selected);
		}

		this.toggleDeleteSelectionButton();
		this.toggleButtonsWhenNoFeature();
	}

	/**
	 * Handle deletion of symbol text layer when mode === 'text'
	 * @param selectedFeatures
	 */
	protected deleteSelectedTextSymbolLayer(
		selectedFeatures: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[]
	) {
		const hasTextFeatures = selectedFeatures.some((f) => f.properties.mode === 'text');
		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';

		if (hasTextFeatures) {
			const remainingFeatures = this.terradraw
				?.getSnapshot()
				.filter((f) => f.properties?.mode === 'text' && f.properties?.text);

			const source = this.map?.getSource(`${prefixId}-text`) as GeoJSONSource | undefined;
			source?.setData({
				type: 'FeatureCollection',
				features: remainingFeatures as GeoJSONStoreFeatures<GeoJSONStoreGeometries>[]
			});
		}
	}

	/**
	 * Download button click event handler
	 */
	protected handleDownload() {
		const fc = this.getFeatures(false);

		const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fc));
		const download = document.createElement('a');
		download.setAttribute('href', dataStr);
		download.setAttribute('download', 'data.geojson');
		document.body.appendChild(download);
		download.click();
		download.remove();
	}

	/**
	 * Toggle the state of buttons when there is no features
	 */
	protected toggleButtonsWhenNoFeature() {
		if (!this.controlContainer) return;
		const snapshot = this.terradraw?.getSnapshot();
		const features = snapshot?.filter((f) => f.properties.mode !== 'select');
		const isActive = features && features.length > 0 ? true : false;

		const targets = [
			`maplibregl-terradraw-${this.cssPrefix}add-select-button`,
			`maplibregl-terradraw-${this.cssPrefix}download-button`,
			`maplibregl-terradraw-${this.cssPrefix}delete-button`
		];
		for (const className of targets) {
			const btns = this.controlContainer.getElementsByClassName(className);
			for (let i = 0; i < btns.length; i++) {
				const btn = btns.item(i) as HTMLButtonElement;
				if (!btn) continue;
				btn.disabled = !isActive;
			}
		}
	}

	/**
	 * Toggle the state of delete-select button
	 */
	protected toggleDeleteSelectionButton() {
		const enabled = this.terradraw?.enabled || false;
		const mode = this.terradraw?.getMode();
		const fc = this.getFeatures(false);
		const hasFeatures = fc && fc.features.length > 0;
		const isActive = hasFeatures && enabled && mode === 'select';
		const btns = document.getElementsByClassName(
			`maplibregl-terradraw-${this.cssPrefix}delete-selection-button`
		);
		for (let i = 0; i < btns.length; i++) {
			const btn = btns.item(i);
			if (!btn) continue;
			if (isActive) {
				btn.classList.remove('hidden-delete-selection');
			} else {
				btn.classList.add('hidden-delete-selection');
			}
		}

		if (!hasFeatures) {
			const btns = document.getElementsByClassName(
				`maplibregl-terradraw-${this.cssPrefix}add-select-button`
			);
			for (let i = 0; i < btns.length; i++) {
				const btn = btns.item(i);
				if (!btn) continue;
				btn.classList.remove('active');
			}
		}
	}

	/**
	 * Clear GeoJSON feature related to extended control such as measure and valhalla by TerraDraw feature ID
	 * @param sourceIds the array of source ID to delete
	 * @param ids the array of feature ID. Optional, if undefined, delete all labels for source
	 * @returns void
	 */
	protected clearExtendedFeatures(
		sourceIds: string[],
		ids: TerraDrawExtend.FeatureId[] | undefined = undefined
	) {
		if (!this.map) return;
		for (const sourceId of sourceIds) {
			const geojsonSource: GeoJSONSourceSpecification = this.map.getStyle().sources[
				sourceId
			] as GeoJSONSourceSpecification;
			if (geojsonSource) {
				// delete old nodes
				if (
					typeof geojsonSource.data !== 'string' &&
					geojsonSource.data.type === 'FeatureCollection'
				) {
					// if ids is undefined, delete all labels for the source
					if (ids === undefined) {
						geojsonSource.data.features = [];
					} else {
						// Delete label features if originalId does not exist anymore.
						geojsonSource.data.features = geojsonSource.data.features.filter((f) => {
							if (f.properties?.originalId) {
								return !ids.includes(f.properties.originalId);
							} else {
								return !ids.includes(f.id as string);
							}
						});
					}

					// update GeoJSON source with new data
					(this.map.getSource(sourceId) as GeoJSONSource)?.setData(geojsonSource.data);
				}
			}
		}
	}

	/**
	 * Create (or refresh) the MapLibre GL symbol layer used to render committed
	 * text labels from `TerraDrawTextMode`.
	 *
	 * Called automatically by {@link onAdd} when the `text` mode is active, and
	 * again after every TerraDraw `finish` event so newly committed labels appear
	 * immediately.
	 *
	 * ### What this method does
	 * 1. Reads all committed text features from the TerraDraw snapshot
	 *    (features where `properties.mode === 'text'` and `properties.text` is non-empty).
	 * 2. If the `{prefix}-text` GeoJSON source already exists, calls `setData`
	 *    to update it in place (no layer teardown/rebuild).
	 * 3. If the source does **not** yet exist, adds the source **and** a
	 *    `{prefix}-text-labels` symbol layer with defaults for
	 *    `text-field`, `text-size`, `text-font`, `text-color`, and `text-halo-*`.
	 * 4. Calls `map.moveLayer('{prefix}-text-labels')` to ensure the symbol
	 *    layer renders above all other TerraDraw layers.
	 *
	 * The `{prefix}` comes from `adapterOptions.prefixId` (default `'td'`),
	 * so with the default prefix the layer id is `td-text-labels`.
	 *
	 * @param map - The MapLibre GL `Map` instance.
	 * @param styles - Optional style overrides forwarded to the MapLibre symbol layer.
	 */
	protected createTerradrawTextLayer(map: Map, styles?: TextModeStyling) {
		if (!map.isStyleLoaded()) {
			if (!this._isWaitingForTextStyleLoad) {
				this._isWaitingForTextStyleLoad = true;
				map.once('style.load', () => {
					this._isWaitingForTextStyleLoad = false;
					this.createTerradrawTextLayer(map, styles);
				});
			}
			return;
		}

		const defaultStyles = styles ?? this.getTextModeStyling();
		const snapshot = this.terradraw?.getSnapshot();
		const textFeatures =
			snapshot?.filter((f) => f.properties?.mode === 'text' && f.properties?.text) ?? [];
		this.addTextFeaturesToSource(textFeatures, map, defaultStyles);

		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		const layerId = `${prefixId}-text-labels`;

		// change the z-index position of the text label to appear above all other Terradraw features
		if (map.getLayer(layerId)) {
			map.moveLayer(layerId);
		}
	}

	/**
	 * Add Text Label Terradraw Features to the map
	 * @param features
	 * @param map
	 * @param styles
	 */
	protected addTextFeaturesToSource(
		features: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[],
		map: Map,
		styles?: TextModeStyling
	) {
		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		const sourceId = `${prefixId}-text`;
		const layerId = `${prefixId}-text-labels`;

		const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

		if (source) {
			source.setData({
				type: 'FeatureCollection',
				features
			});
		} else {
			map.addSource(sourceId, {
				type: 'geojson',
				data: { type: 'FeatureCollection', features }
			});
		}

		if (!map.getLayer(layerId)) {
			map.addLayer({
				id: layerId,
				type: 'symbol',
				source: sourceId,
				layout: {
					'text-field': ['get', 'text'],
					'text-size': (styles?.textSize as number) ?? 12,
					'text-anchor': 'top',
					'text-offset': [0, 0.8],
					'text-font': this._fontGlyphs ?? styles?.textFont ?? ['sans-serif'],
					'text-allow-overlap': true
				},
				paint: {
					'text-color': (styles?.textColor as string) ?? '#000000',
					'text-halo-color': (styles?.textHaloColor as string) ?? '#ffffff',
					'text-halo-width': (styles?.textHaloWidth as number) ?? 1
				}
			});
		}
	}

	/**
	 * Resolve text mode styles by merging defaults and user overrides.
	 */
	protected getTextModeStyling(): Partial<TextModeStyling> {
		const defaultOptions = getDefaultModeOptions();
		const defaultTextMode = defaultOptions.text as
			(TerradrawModeClass & { options?: { styles?: TextModeStyling } }) | undefined;
		const customTextMode = this.options.modeOptions?.text as
			(TerradrawModeClass & { options?: { styles?: TextModeStyling } }) | undefined;

		const defaultStyles = (defaultTextMode?.options?.styles as Partial<TextModeStyling>) ?? {};
		const customStyles = (customTextMode?.options?.styles as Partial<TextModeStyling>) ?? {};

		return { ...defaultStyles, ...customStyles };
	}

	/**
	 * Apply highlighted styles to the `{prefix}-text-labels` layer when a text
	 * feature is selected via `TerraDrawSelectMode`.
	 *
	 * Refreshes the GeoJSON source so the TerraDraw `selected` property is
	 * current, then sets data-driven `text-size` and `text-halo-color` expressions
	 * that make the selected label slightly larger and give it a white halo.
	 * If the selected feature is **not** a text feature, delegates to
	 * `resetTextLabelLayer` instead.
	 *
	 * Called automatically on `terradraw.on('select')`.
	 *
	 * @param featureId - The TerraDraw feature ID that was selected.
	 */
	protected selectTextLabelLayer(featureId: TerraDrawExtend.FeatureId) {
		const styles = this.getTextModeStyling();

		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		const layerId = `${prefixId}-text-labels`;

		if (!this.map?.style?.getLayer(layerId)) return;

		const snapshot = this.terradraw?.getSnapshot() ?? [];
		const textFeatures = snapshot.filter(
			(f) => f.properties?.mode === 'text' && f.properties?.text
		) as GeoJSONStoreFeatures<GeoJSONStoreGeometries>[];

		// Refresh source so terra-draw's `selected` property is current in the layer data
		const source = this.map?.getSource(`${prefixId}-text`) as GeoJSONSource | undefined;
		source?.setData({ type: 'FeatureCollection', features: textFeatures });

		const isTextFeature = textFeatures.some((f) => f.id === featureId);

		if (isTextFeature) {
			this.map?.setLayoutProperty(layerId, 'text-size', [
				'case',
				['==', ['get', 'selected'], true],
				styles.textSelectedSize ?? 14,
				styles.textSize ?? 12
			]);

			this.map?.setPaintProperty(layerId, 'text-halo-color', [
				'case',
				['==', ['get', 'selected'], true],
				styles.textSelectedHaloColor ?? '#ffffff',
				styles.textHaloColor ?? '#ffffff'
			]);
		} else {
			this.resetTextLabelLayer();
		}
	}

	/**
	 * Restore the default paint properties on the `{prefix}-text-labels` layer
	 * after a text feature is deselected.
	 *
	 * Resets `text-color`, `text-halo-color`, and `text-halo-width` from
	 * `TextModeStyling` defaults. Also refreshes the GeoJSON source to clear
	 * the TerraDraw `selected` flag from the feature data.
	 *
	 * Called automatically on `terradraw.on('deselect')`.
	 */
	protected resetTextLabelLayer() {
		const styles = this.getTextModeStyling();

		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		const layerId = `${prefixId}-text-labels`;

		if (!this.map?.style?.getLayer(layerId)) return;

		const snapshot = this.terradraw?.getSnapshot() ?? [];
		const textFeatures = snapshot.filter(
			(f) => f.properties?.mode === 'text' && f.properties?.text
		) as GeoJSONStoreFeatures<GeoJSONStoreGeometries>[];

		const source = this.map?.getSource(`${prefixId}-text`) as GeoJSONSource | undefined;
		source?.setData({ type: 'FeatureCollection', features: textFeatures });

		this.map?.setPaintProperty(layerId, 'text-color', styles.textColor ?? '#000000');
		this.map?.setPaintProperty(layerId, 'text-halo-color', styles.textHaloColor ?? '#ffffff');
		this.map?.setPaintProperty(layerId, 'text-halo-width', styles.textHaloWidth ?? 1);
	}

	/**
	 * Remove the `{prefix}-text-labels` symbol layer and the `{prefix}-text`
	 * GeoJSON source from the map.
	 *
	 * Called when all features are deleted via `handleDeleteAllFeatures`.
	 */
	protected clearTextLayers() {
		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		const source = this.map?.getSource(`${prefixId}-text`) as maplibregl.GeoJSONSource | undefined;
		const layers = this.map?.style?.getLayer(`${prefixId}-text-labels`);

		this.map?.removeLayer(layers?.id as string);
		this.map?.removeSource(source?.id as string);
	}
}
