import type { ControlPosition, IControl, Map } from 'maplibre-gl';
import { TerraDraw, TerraDrawMapLibreGLAdapter } from 'terra-draw';
import type { ControlOptions, TerradrawMode } from './interfaces/index.js';
import { defaultControlOptions } from './constants/defaultControlOptions.js';
import { getTerraDrawModes } from './helpers/index.js';

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
		this.map = map;

		const modes = getTerraDrawModes(this.options);
		if (modes.length === 0) {
			throw new Error('At least a mode must be enabled.');
		}
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
		this.addButton.type = 'button';
		this.addButton.addEventListener('click', () => {
			if (!this.terradraw) return;

			const controls = document.getElementsByClassName('maplibregl-terradraw-add-control');
			for (let i = 0; i < controls.length; i++) {
				const item = controls.item(i);
				if (!item) continue;
				if (this.isExpanded) {
					item.classList.add('hidden');
					this.addButton?.classList.remove('enabled');
					this.resetActiveMode();
				} else {
					item.classList.remove('hidden');
					this.addButton?.classList.add('enabled');
				}
			}
			this.isExpanded = !this.isExpanded;
		});

		modes.forEach((m) => {
			if (m.mode === 'render') return;
			this.addTerradrawButton(m.mode);
		});

		this.deleteButton = document.createElement('button');
		this.deleteButton.classList.add('maplibregl-terradraw-add-control');
		this.deleteButton.classList.add(`maplibregl-terradraw-delete-button`);
		this.deleteButton.classList.add('hidden');
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

	public activate() {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) {
			this.terradraw.start();
		}
	}

	public deactivate() {
		if (!this.terradraw) return;
		if (!this.terradraw.enabled) return;
		this.resetActiveMode();
		this.terradraw.stop();
	}

	public getTerraDrawInstance() {
		return this.terradraw;
	}

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

	private addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.classList.add('maplibregl-terradraw-add-control');
		btn.classList.add(`maplibregl-terradraw-add-${mode}-button`);
		btn.classList.add('hidden');
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
