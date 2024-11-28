import type { ControlPosition, IControl, Map } from 'maplibre-gl';
import { TerraDraw, TerraDrawMapLibreGLAdapter, TerraDrawRenderMode } from 'terra-draw';
import type { ControlOptions, TerradrawMode, TerradrawModeClass } from './interfaces/index.js';
import { defaultControlOptions } from './constants/defaultControlOptions.js';
import { getDefaultModeOptions } from './constants/getDefaultModeOptions.js';

/**
 * Maplibre GL Terra Draw Control
 */
export class MaplibreTerradrawControl implements IControl {
	private controlContainer?: HTMLElement;
	private map?: Map;
	private modeButtons: { [key: string]: HTMLButtonElement } = {};
	private isExpanded = false;

	private terradraw?: TerraDraw;
	private options: ControlOptions = defaultControlOptions;

	private defaultMode = 'render';

	/**
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: ControlOptions) {
		this.modeButtons = {};

		if (options) {
			this.options = Object.assign(this.options, options);
		}
	}

	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

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
			m._state = 'unregistered';
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
			adapter: new TerraDrawMapLibreGLAdapter({ map }),
			modes: modes
		});

		this.terradraw.start();

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

		return this.controlContainer;
	}

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
	private toggleEditor() {
		if (!this.terradraw) return;
		const controls = document.getElementsByClassName('maplibregl-terradraw-add-control');
		for (let i = 0; i < controls.length; i++) {
			const item = controls.item(i);
			if (!item) continue;
			if (this.isExpanded) {
				item.classList.add('hidden');
			} else {
				item.classList.remove('hidden');
			}
		}
		const addButton = document.getElementsByClassName('maplibregl-terradraw-render-button');
		if (addButton && addButton.length > 0) {
			if (this.isExpanded) {
				addButton.item(0)?.classList.remove('enabled');
				this.resetActiveMode();
			} else {
				addButton.item(0)?.classList.add('enabled');
			}
		}
		this.toggleDeleteSelectionButton();
		this.isExpanded = !this.isExpanded;
	}

	/**
	 * Reset active mode to back to render mode
	 */
	private resetActiveMode() {
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
	private addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.type = 'button';
		this.modeButtons[mode] = btn;

		if (mode === 'render') {
			btn.classList.add(`maplibregl-terradraw-${mode}-button`);

			if (this.isExpanded) {
				btn.classList.add('enabled');
			}
			btn.type = 'button';
			btn.title = this.capitalize('expand or collapse drawing tool');
			btn.addEventListener('click', this.toggleEditor.bind(this));
		} else {
			btn.classList.add('maplibregl-terradraw-add-control');

			if (!this.isExpanded) {
				btn.classList.add('hidden');
			}
			btn.title = this.capitalize(mode.replace(/-/g, ' '));

			if (mode === 'delete') {
				btn.classList.add(`maplibregl-terradraw-${mode}-button`);

				btn.addEventListener('click', () => {
					if (!this.terradraw) return;
					if (!this.terradraw.enabled) return;

					this.terradraw.clear();
					this.deactivate();
					this.toggleDeleteSelectionButton();
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
						const currentMode = this.terradraw.getMode();
						this.terradraw.setMode(this.defaultMode);
						const ids = selected.map((f) => f.id);
						this.terradraw.removeFeatures(ids);
						this.terradraw.setMode(currentMode);
					}
					this.toggleDeleteSelectionButton();
				});
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
					this.toggleDeleteSelectionButton();
				});
			}
		}
	}

	private toggleDeleteSelectionButton() {
		const enabled = this.terradraw?.enabled || false;
		const mode = this.terradraw?.getMode();

		const isActive = enabled && mode === 'select';
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
	}

	private capitalize(value: string) {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
}
