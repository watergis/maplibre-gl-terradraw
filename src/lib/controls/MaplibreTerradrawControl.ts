import type { ControlPosition, IControl, Map, StyleSpecification } from 'maplibre-gl';
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
import { capitalize, cleanMaplibreStyle, TERRADRAW_SOURCE_IDS } from '../helpers';

/**
 * Maplibre GL Terra Draw Control
 */
export class MaplibreTerradrawControl implements IControl {
	protected controlContainer?: HTMLElement;
	protected map?: Map;
	protected modeButtons: { [key: string]: HTMLButtonElement } = {};
	protected _isExpanded = false;

	/**
	 * get the state of whether the control is expanded or collapsed
	 */
	public get isExpanded(): boolean {
		return this._isExpanded;
	}

	/**
	 * set the state of the control either expanded or collapsed.
	 * terradraw mode will be reset if the state is changed.
	 * either `expanded` or `collapsed` event is dispatched when changed
	 */
	public set isExpanded(value: boolean) {
		this._isExpanded = value;
		const controls = document.getElementsByClassName('maplibregl-terradraw-add-control');
		for (let i = 0; i < controls.length; i++) {
			const item = controls.item(i);
			if (!item) continue;
			if (this.isExpanded) {
				item.classList.remove('hidden');
			} else {
				item.classList.add('hidden');
			}
		}
		const addButton = document.getElementsByClassName('maplibregl-terradraw-render-button');
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

		this.terradraw?.on('change', this.toggleButtonsWhenNoFeature.bind(this));
		this.toggleButtonsWhenNoFeature();
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
	 * Get the Terra Draw instance.
	 * For the Terra Draw API, please refer to https://terradraw.io/#/api
	 * @returns Terra Draw instance
	 */
	public getTerraDrawInstance() {
		return this.terradraw;
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
	protected resetActiveMode() {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) {
			this.terradraw.start();
		}
		const controls = document.getElementsByClassName('maplibregl-terradraw-add-control');
		for (let i = 0; i < controls.length; i++) {
			const item = controls.item(i);
			if (!item) continue;
			item.classList.remove('active');
		}
		this.terradraw?.setMode(this.defaultMode);
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
			btn.classList.add(`maplibregl-terradraw-${mode}-button`);

			if (this.isExpanded) {
				btn.classList.add('enabled');
			}
			btn.type = 'button';
			btn.title = capitalize('expand or collapse drawing tool');
			btn.addEventListener('click', this.toggleEditor.bind(this));
		} else {
			btn.classList.add('maplibregl-terradraw-add-control');

			if (!this.isExpanded) {
				btn.classList.add('hidden');
			}
			btn.title = capitalize(mode.replace(/-/g, ' '));

			if (mode === 'delete') {
				btn.classList.add(`maplibregl-terradraw-${mode}-button`);

				btn.addEventListener('click', () => {
					if (!this.terradraw) return;
					if (!this.terradraw.enabled) return;

					this.terradraw.clear();
					this.deactivate();
					this.toggleDeleteSelectionButton();
					this.toggleButtonsWhenNoFeature();
					this.dispatchEvent('feature-deleted');
				});
			} else if (mode === 'delete-selection') {
				btn.classList.add(`maplibregl-terradraw-${mode}-button`);
				btn.classList.add(`hidden-delete-selection`);
				btn.addEventListener('click', () => {
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
				});
			} else if (mode === 'download') {
				btn.classList.add(`maplibregl-terradraw-${mode}-button`);
				btn.addEventListener('click', this.handleDownload.bind(this));
			} else {
				btn.classList.add(`maplibregl-terradraw-add-${mode}-button`);

				btn.addEventListener('click', () => {
					if (!this.terradraw) return;

					const isActive = btn.classList.contains('active');
					this.activate();
					this.resetActiveMode();

					if (!isActive) {
						this.terradraw.setMode(mode);
						btn.classList.add('active');
					}
					this.dispatchEvent('mode-changed');
					this.toggleDeleteSelectionButton();
					this.toggleButtonsWhenNoFeature();
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
		return cleanMaplibreStyle(style, options, TERRADRAW_SOURCE_IDS);
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
		const fc = this.getFeatures(false);
		const isActive = fc && fc.features.length > 0 ? true : false;

		const targets = [
			`maplibregl-terradraw-add-select-button`,
			`maplibregl-terradraw-download-button`,
			`maplibregl-terradraw-delete-button`
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
		const btns = document.getElementsByClassName(`maplibregl-terradraw-delete-selection-button`);
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
			const btns = document.getElementsByClassName(`maplibregl-terradraw-add-select-button`);
			for (let i = 0; i < btns.length; i++) {
				const btn = btns.item(i);
				if (!btn) continue;
				btn.classList.remove('active');
			}
		}
	}
}
