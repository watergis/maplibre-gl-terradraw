import type {
	ControlPosition,
	GeoJSONSource,
	GeoJSONSourceSpecification,
	IControl,
	Map,
	StyleSpecification
} from 'maplibre-gl';
import { TerraDraw, TerraDrawExtend, TerraDrawRenderMode } from 'terra-draw';
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

/**
 * Maplibre GL Terra Draw Control
 */
export class MaplibreTerradrawControl implements IControl {
	protected controlContainer?: HTMLElement;
	protected map?: Map;
	protected modeButtons: { [key: string]: HTMLButtonElement } = {};
	protected _isExpanded = false;
	protected _cssPrefix = '';

	/**
	 * get the state of whether the control is expanded or collapsed
	 */
	public get isExpanded(): boolean {
		return this._isExpanded;
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
	protected options: TerradrawControlOptions = defaultControlOptions;
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

		if (options) {
			this.options = Object.assign(this.options, options);
		}
		const prefixId = this.options.adapterOptions?.prefixId ?? 'td';
		if (!this.options.adapterOptions) {
			this.options.adapterOptions = {};
		}
		if (!this.options.adapterOptions?.prefixId) {
			this.options.adapterOptions.prefixId = prefixId;
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
			modes: modes
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
				return Reflect.get(target, prop, receiver);
			}
		});
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
	 * Show delete confirmation dialog
	 * @param onConfirm Callback function to execute when delete is confirmed
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
			// if feature is selected, delete only selected feature
			const ids = selected.map((f) => f.id) as TerraDrawExtend.FeatureId[];

			this.terradraw.removeFeatures(ids);
			for (const id of ids) {
				this.terradraw.deselectFeature(id);
			}
			this.dispatchEvent('feature-deleted', { deletedIds: ids });
		}
		this.toggleDeleteSelectionButton();
		this.toggleButtonsWhenNoFeature();
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
}
