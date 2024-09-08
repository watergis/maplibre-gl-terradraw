import type { ControlPosition, IControl, Map } from 'maplibre-gl';
import { TerraDraw, TerraDrawMapLibreGLAdapter } from 'terra-draw';
import type { ControlOptions, TerradrawMode, TerradrawModeClass } from './interfaces/index.js';
import { defaultControlOptions } from './constants/defaultControlOptions.js';
import { getDefaultModeOptions } from './constants/getDefaultModeOptions.js';

/**
 * Maplibre GL Terra Draw Control
 */
export class MaplibreTerradrawControl implements IControl {
	private controlContainer?: HTMLElement;
	private map?: Map;
	private addButton?: HTMLButtonElement;
	private modeButtons: { [key: string]: HTMLButtonElement } = {};
	private deleteButton?: HTMLButtonElement;
	private isExpanded = false;
	private activeMode: string;

	private terradraw?: TerraDraw;
	private options: ControlOptions = defaultControlOptions;

	/**
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: ControlOptions) {
		this.modeButtons = {};
		this.activeMode = 'render';

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
		const modes: TerradrawModeClass[] = [defaultOptions['render']];

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

		this.isExpanded = this.options.open === true;

		this.terradraw = new TerraDraw({
			adapter: new TerraDrawMapLibreGLAdapter({ map }),
			modes: modes
		});

		this.terradraw.start();

		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(`maplibregl-ctrl`);
		this.controlContainer.classList.add(`maplibregl-ctrl-group`);

		this.addButton = document.createElement('button');
		this.addButton.classList.add(`maplibregl-terradraw-add-button`);
		if (this.isExpanded) {
			this.addButton.classList.add('enabled');
		}
		this.addButton.type = 'button';
		this.addButton.addEventListener('click', this.toggleEditor.bind(this));

		modes.forEach((m: TerradrawModeClass) => {
			if (m.mode === 'render') return;
			this.addTerradrawButton(m.mode as TerradrawMode);
		});

		this.deleteButton = document.createElement('button');
		this.deleteButton.classList.add('maplibregl-terradraw-add-control');
		this.deleteButton.classList.add(`maplibregl-terradraw-delete-button`);
		if (!this.isExpanded) {
			this.deleteButton.classList.add('hidden');
		}
		this.deleteButton.type = 'button';
		this.deleteButton.addEventListener('click', () => {
			if (!this.terradraw) return;
			if (!this.terradraw.enabled) return;
			this.terradraw.clear();
			this.deactivate();
		});

		this.controlContainer.appendChild(this.addButton);
		Object.values(this.modeButtons).forEach((ele) => {
			this.controlContainer?.appendChild(ele);
		});
		this.controlContainer.appendChild(this.deleteButton);

		return this.controlContainer;
	}

	public onRemove(): void {
		if (
			!this.controlContainer ||
			!this.controlContainer.parentNode ||
			!this.map ||
			!this.addButton
		) {
			return;
		}
		this.modeButtons = {};
		this.terradraw = undefined;
		this.map = undefined;
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
		if (this.isExpanded) {
			this.addButton?.classList.remove('enabled');
			this.resetActiveMode();
		} else {
			this.addButton?.classList.add('enabled');
		}
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
		this.activeMode = 'render';
		this.terradraw?.setMode('render');
	}

	/**
	 * Add Terra Draw drawing mode button
	 * @param mode Terra Draw mode name
	 */
	private addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.classList.add('maplibregl-terradraw-add-control');
		btn.classList.add(`maplibregl-terradraw-add-${mode}-button`);
		if (!this.isExpanded) {
			btn.classList.add('hidden');
		}
		btn.type = 'button';
		btn.addEventListener('click', () => {
			if (!this.terradraw) return;

			const isActive = btn.classList.contains('active');

			this.activate();
			this.resetActiveMode();

			if (!isActive) {
				this.terradraw.setMode(mode);
				this.activeMode = mode;
				btn.classList.add('active');
			}
		});
		this.modeButtons[mode] = btn;
	}
}
