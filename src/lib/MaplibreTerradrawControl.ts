import type { ControlPosition, IControl, Map, MapGeoJSONFeature } from 'maplibre-gl';
import {
	TerraDraw,
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawLineStringMode,
	TerraDrawMapLibreGLAdapter,
	TerraDrawPointMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawSelectMode,
	ValidateNotSelfIntersecting
} from 'terra-draw';

export interface ControlOptions {
	point?: boolean;
	line?: boolean;
	polygon?: boolean;
	rectangle?: boolean;
	circle?: boolean;
	freehand?: boolean;
	angledRectangle?: boolean;
	select?: boolean;
}

export class MaplibreTerradrawControl implements IControl {
	private controlContainer?: HTMLElement;
	private map?: Map;
	private addButton?: HTMLButtonElement;
	private modeButtons: { [key: string]: HTMLButtonElement } = {};
	private deleteButton?: HTMLButtonElement;
	private isExpanded = false;
    private activeMode: string;

	private terradraw?: TerraDraw;

	private options: ControlOptions = {
		point: true,
		line: true,
		polygon: true,
		rectangle: true,
		circle: true,
		freehand: true,
		angledRectangle: true,
		select: true
	};

	constructor(options: ControlOptions) {
		this.modeButtons = {};
		this.activeMode = ''

		if (options) {
			this.options = Object.assign(this.options, options);
		}
	}

	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	private getTerradrawModes() {
		const modes = [];
		if (this.options.point === true) {
			modes.push(new TerraDrawPointMode());
		}
		if (this.options.line === true) {
			modes.push(new TerraDrawLineStringMode());
		}
		if (this.options.polygon === true) {
			modes.push(
				new TerraDrawPolygonMode({
					validation: (feature: MapGeoJSONFeature, e: { updateType: string }) => {
						const updateType = e.updateType;
						if (updateType === 'finish' || updateType === 'commit') {
							return ValidateNotSelfIntersecting(feature);
						}
						return true;
					}
				})
			);
		}
		if (this.options.rectangle === true) {
			modes.push(new TerraDrawRectangleMode());
		}
		if (this.options.angledRectangle === true) {
			modes.push(new TerraDrawAngledRectangleMode());
		}
		if (this.options.circle === true) {
			modes.push(new TerraDrawCircleMode());
		}
		if (this.options.freehand === true) {
			modes.push(new TerraDrawFreehandMode());
		}

		if (this.options.select === true) {
			modes.push(
				new TerraDrawSelectMode({
					flag: {
						point: {
							feature: {
								draggable: true
							}
						},
						polygon: {
							feature: {
								draggable: true,
								rotateable: true,
								scaleable: true,
								coordinates: {
									midpoints: true,
									draggable: true,
									deletable: true
								}
							}
						},
						linestring: {
							feature: {
								draggable: true,
								coordinates: {
									midpoints: true,
									draggable: true,
									deletable: true
								}
							}
						},
						freehand: {
							feature: {
								draggable: true,
								coordinates: {
									midpoints: true,
									draggable: true,
									deletable: true
								}
							}
						},
						circle: {
							feature: {
								draggable: true,
								coordinates: {
									midpoints: true,
									draggable: true,
									deletable: true
								}
							}
						},
						rectangle: {
							feature: {
								draggable: true,
								rotateable: true,
								scaleable: true,
								coordinates: {
									midpoints: true,
									draggable: true,
									deletable: true
								}
							}
						}
					}
				})
			);
		}

		return modes;
	}

	public onAdd(map: Map): HTMLElement {
		this.map = map;

		const modes = this.getTerradrawModes();

		this.terradraw = new TerraDraw({
			adapter: new TerraDrawMapLibreGLAdapter({ map }),
			modes: modes
		});

        this.terradraw.start()

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
				} else {
					item.classList.remove('hidden');
					this.addButton?.classList.add('enabled');
				}
			}
			this.isExpanded = !this.isExpanded;
		});

		modes.forEach((m) => {
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
			this.terradraw.stop();
		});

		this.controlContainer.appendChild(this.addButton);
		Object.values(this.modeButtons).forEach((ele) => {
			this.controlContainer?.appendChild(ele);
		});
		this.controlContainer.appendChild(this.deleteButton);

		return this.controlContainer;
	}

	private addTerradrawButton(
		type:
			| 'point'
			| 'linestring'
			| 'polygon'
			| 'rectangle'
			| 'circle'
			| 'freehand'
			| 'angled-rectangle'
			| 'select'
	) {
		if (this.options.point !== true) return;
		const btn = document.createElement('button');
		btn.classList.add('maplibregl-terradraw-add-control');
		btn.classList.add(`maplibregl-terradraw-add-${type}-button`);
		btn.classList.add('hidden');
		btn.type = 'button';
		btn.addEventListener('click', () => {
			if (!this.terradraw) return;
			if (!this.terradraw.enabled) {
				this.terradraw.start();
			}
			this.terradraw.setMode(type);
            this.activeMode = type

            const controls = document.getElementsByClassName('maplibregl-terradraw-add-control');
			for (let i = 0; i < controls.length; i++) {
				const item = controls.item(i);
				if (!item) continue;
				item.classList.remove('active');
			}
            btn.classList.add('active')
		});
		this.modeButtons[type] = btn;
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
}
