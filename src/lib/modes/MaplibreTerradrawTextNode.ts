import type { Map } from 'maplibre-gl';
import {
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	TerraDrawExtend,
	type GeoJSONStoreFeatures
} from 'terra-draw';

const { TerraDrawBaseDrawMode } = TerraDrawExtend;

type TextModeStyling = {
	pointColor?: HexColor;
	pointWidth?: number;
	pointOutlineColor?: HexColor;
	pointOutlineWidth?: number;
	textColor?: HexColor;
	textSize?: number;
	textHaloColor?: HexColor;
	textHaloWidth?: number;
};

type TextModeOptions = {
	styles?: Partial<TextModeStyling>;
	placeholder?: string;
	onTextCommit?: (featureId: string, text: string) => void;
	map?: Map;
	onDragSync?: () => void;
	pointerEvents?: PointerEvent;
	editable?: boolean;
};

export class MaplibreTerradrawTextMode extends TerraDrawBaseDrawMode<TextModeStyling> {
	mode = 'text';

	private isDragging = false;
	private draggedFeatureId: string | null = null;
	private editable: boolean = false;

	private activeTextarea: HTMLTextAreaElement | null = null;
	private activeFeatureId: string | null = null;
	options?: TextModeOptions;
	private onDragSync?: () => void;

	constructor(options?: TextModeOptions) {
		super({ styles: options?.styles ?? {} });
		this.options = options;
		this.styles = options?.styles ?? {};

		this.onDragSync = options?.onDragSync;
		this.editable = options?.editable ?? false;
	}

	/** @internal */
	start() {
		this.setStarted();
		this.setCursor('crosshair');
	}

	/** @internal */
	stop() {
		this.cleanUp();
		this.setStopped();
		this.setCursor('unset');
	}

	// register(config: any): void {
	//     super.register(config);

	//     // this.dragBehavior = new DragCoordinateBehavior({
	//     //     store: this.store,
	//     //     project: this.project,
	//     //     unproject: this.unproject,
	//     //     pointerDistance: this.pointerDistance,
	//     //     coordinatePrecision: this.coordinatePrecision
	//     // } as BehaviorConfig);

	//     // grab the map container so we can position the textarea
	//     this.container = config.getMapContainer();
	// }

	/**
	 * Create a textarea element
	 * @param x
	 * @param y
	 * @returns
	 */
	private createTextAreaElement(x: number, y: number, currentText?: string): HTMLTextAreaElement {
		const textarea = document.createElement('textarea');
		textarea.placeholder = this.options?.placeholder ?? 'Enter label...';
		textarea.rows = 2;

		if (currentText) {
			textarea.value = currentText;
		}

		Object.assign(textarea.style, {
			position: 'absolute',
			left: `${x}px`,
			top: `${y + 8}px`,
			zIndex: '1000',
			minWidth: '140px',
			maxWidth: '240px',
			padding: '4px 8px',
			fontSize: '12px',
			fontFamily: 'sans-serif',
			border: '1.5px solid #4CC9F0',
			borderRadius: '6px',
			background: 'rgba(255,255,255,0.95)',
			color: '#111',
			resize: 'none',
			outline: 'none',
			boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
		});

		const mapContainer = document.getElementsByClassName('map');

		mapContainer[0]!.appendChild(textarea);

		textarea.focus();

		return textarea;
	}

	/**
	 * Add a textarea element to the DOM
	 * @param featureId
	 * @param x
	 * @param y
	 */
	private showTextarea(featureId: string, x: number, y: number): void {
		this.dismissTextarea(false);

		const textarea = this.createTextAreaElement(x, y);

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && e.shiftKey) {
				e.preventDefault();
				this.commitText(featureId, textarea.value.trim());
			}
			if (e.key === 'Escape') {
				this.dismissTextarea(true);
			}
		});

		this.activeTextarea = textarea;
		this.activeFeatureId = featureId;
	}

	private commitText(featureId: string, text: string): void {
		if (!text) {
			this.dismissTextarea(true);
			return;
		}

		this.store.updateProperty([
			{
				id: featureId,
				property: 'text',
				value: text
			}
		]);

		this.options?.onTextCommit?.(featureId, text);
		this.dismissTextarea(false);

		this.onFinish(featureId, { mode: this.mode, action: 'draw' });
	}

	private dismissTextarea(deleteFeature: boolean): void {
		if (this.activeTextarea) {
			this.activeTextarea.remove();
			this.activeTextarea = null;
		}
		if (deleteFeature && this.activeFeatureId) {
			this.store.delete([this.activeFeatureId]);
		}
		this.activeFeatureId = null;
	}

	private editText(featureId: string, x: number, y: number): void {
		this.dismissTextarea(false);

		const feature = this.store.copyAll().find((f) => f.id === featureId);
		const currentText = (feature?.properties?.text as string) ?? '';

		const textarea = this.createTextAreaElement(x, y, currentText);

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && e.shiftKey) {
				e.preventDefault();
				const newText = textarea.value.trim();
				if (newText) {
					this.commitText(featureId, newText);
				}
				this.dismissTextarea(false);
			}
			if (e.key === 'Escape') {
				this.dismissTextarea(false);
			}
		});

		this.activeTextarea = textarea;
		this.activeFeatureId = featureId;
	}

	onClick(event: TerraDrawMouseEvent): void {
		if (this.activeTextarea && this.activeFeatureId) {
			this.commitText(this.activeFeatureId, this.activeTextarea.value.trim());
			return;
		}

		const { x, y } = this.project(event.lng, event.lat);

		if (
			event.button === 'right' &&
			this.allowPointerEvent(this.pointerEvents.rightClick, event) &&
			this.editable
		) {
			this.onRightClick(event);
			return;
		}

		this.setCursor('crosshair');

		const [featureId] = this.store.create([
			{
				geometry: {
					type: 'Point',
					coordinates: [event.lng, event.lat]
				},
				properties: {
					mode: this.mode,
					text: '',
					draggable: true
				}
			}
		]);

		this.showTextarea(featureId as string, x, y);
	}

	onRightClick(event: TerraDrawMouseEvent): void {
		this.setCursor('pointer');

		const nearest = this.getNearestPointFeature(event);
		if (!nearest) return;

		const { x, y } = this.project(event.lng, event.lat);
		this.editText(nearest.id, x, y);
		return;
	}

	onDragStart(event: TerraDrawMouseEvent, setMapDragging: (dragging: boolean) => void): void {
		if (!this.allowPointerEvent(this.pointerEvents.onDragStart, event)) {
			return;
		}

		this.setCursor('grabbing');

		// don't start a drag if textarea is open
		if (this.activeTextarea) return;

		const nearest = this.getNearestPointFeature(event);
		if (!nearest) return;

		this.isDragging = true;
		this.draggedFeatureId = nearest.id as string;
		setMapDragging(false);
	}

	onDrag(event: TerraDrawMouseEvent, setMapDragging: (dragging: boolean) => void): void {
		if (this.activeTextarea) {
			this.dismissTextarea(true);
		}

		if (!this.isDragging || !this.draggedFeatureId) return;
		setMapDragging(false);

		this.setCursor('grabbing');

		this.store.updateGeometry([
			{
				id: this.draggedFeatureId,
				geometry: {
					type: 'Point',
					coordinates: [event.lng, event.lat]
				}
			}
		]);
	}

	onDragEnd(_event: TerraDrawMouseEvent, setMapDragging: (dragging: boolean) => void): void {
		this.setCursor('crosshair');

		this.isDragging = false;
		this.draggedFeatureId = null;
		setMapDragging(true);
	}

	onKeyUp(event: TerraDrawKeyboardEvent): void {
		if (event.key === 'Escape') {
			this.dismissTextarea(true);
		}
	}

	onDeselect(): void {}
	onSelect(_featureId: string): void {
		console.log('I have been selected:', _featureId);
	}

	cleanUp(): void {
		this.dismissTextarea(true);
		this.isDragging = false;
		this.draggedFeatureId = null;
	}

	styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling {
		const hasText = !!feature.properties?.text;

		return {
			pointColor: hasText ? ((this.styles.pointColor ?? '#5CFF2E') as HexColor) : '#72FF35',
			pointWidth: (this.styles.pointWidth as number) ?? 0,
			pointOutlineColor: (this.styles.pointOutlineColor as HexColor) ?? '#FFFFFF',
			pointOutlineWidth: (this.styles.pointOutlineWidth as number) ?? 2,
			polygonFillColor: '#000',
			polygonFillOpacity: 0,
			polygonOutlineColor: '#00000',
			polygonOutlineWidth: 0,
			lineStringColor: '#000',
			lineStringWidth: 0,
			zIndex: 30
		};
	}

	validateFeature(feature: GeoJSONStoreFeatures): { valid: boolean; reason?: string | undefined } {
		return {
			valid: feature.geometry.type === 'Point' && feature.properties?.mode === this.mode
		};
	}

	private getNearestPointFeature(event: TerraDrawMouseEvent): { id: string } | null {
		const features = this.store.copyAll();
		const { x: pointerX, y: pointerY } = this.project(event.lng, event.lat);

		let nearest: { id: string } | null = null;
		let nearestDistance = Infinity;

		for (const feature of features) {
			if (
				feature.geometry.type !== 'Point' ||
				feature.properties?.mode !== this.mode ||
				!feature.properties?.text
			)
				continue;

			const [lng, lat] = feature.geometry.coordinates as [number, number];
			const { x, y } = this.project(lng, lat);

			const distance = Math.sqrt(Math.pow(pointerX - x, 2) + Math.pow(pointerY - y, 2));

			if (distance < nearestDistance && distance <= this.pointerDistance) {
				nearestDistance = distance;
				nearest = { id: feature.id as string };
			}
		}

		return nearest;
	}
}
