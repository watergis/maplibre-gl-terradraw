import type { Map } from 'maplibre-gl';
import {
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	TerraDrawExtend,
	type GeoJSONStoreFeatures
	// type GeoJSONStoreGeometries
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
};

export class MaplibreTerradrawTextMode extends TerraDrawBaseDrawMode<TextModeStyling> {
	mode = 'text';

	private isDragging = false;
	private draggedFeatureId: string | null = null;

	private activeTextarea: HTMLTextAreaElement | null = null;
	private activeFeatureId: string | null = null;
	options?: TextModeOptions;
	private onDragSync?: () => void;

	constructor(options?: TextModeOptions) {
		super({ styles: options?.styles ?? {} });
		this.options = options;
		this.styles = options?.styles ?? {};

		this.onDragSync = options?.onDragSync;
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

	// ─── Textarea popup ───────────────────────────────────────────────────────

	private showTextarea(featureId: string, x: number, y: number): void {
		this.dismissTextarea(false); // clean up any existing one first

		const textarea = document.createElement('textarea');
		textarea.placeholder = this.options?.placeholder ?? 'Enter label...';
		textarea.rows = 2;

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

		// commit on Enter (without shift)
		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.commitText(featureId, textarea.value.trim());
			}
			if (e.key === 'Escape') {
				this.dismissTextarea(true);
			}
		});

		const mapContainer = document.getElementsByClassName('map');

		mapContainer[0]!.appendChild(textarea);
		textarea.focus();

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

		this.onFinish(featureId, { mode: this.mode, action: 'edit' });

		// add a text layer to the map(since I have no adapter here)
		console.log('Finished drawing now committing');

		// this.
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

	// ─── TerraDraw lifecycle ──────────────────────────────────────────────────

	onClick(event: TerraDrawMouseEvent): void {
		if (this.activeTextarea && this.activeFeatureId) {
			this.commitText(this.activeFeatureId, this.activeTextarea.value.trim());
			return;
		}

		const { x, y } = this.project(event.lng, event.lat);

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
		if (!this.isDragging || !this.draggedFeatureId) return;
		setMapDragging(false);

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
			pointColor: hasText ? ((this.styles.pointColor ?? '#5CFF2E') as HexColor) : '#aaaaaa',
			pointWidth: (this.styles.pointWidth as number) ?? 0,
			pointOutlineColor: (this.styles.pointOutlineColor as HexColor) ?? '#FFFFFF',
			pointOutlineWidth: (this.styles.pointOutlineWidth as number) ?? 2,
			polygonFillColor: '#000',
			polygonFillOpacity: 0,
			polygonOutlineColor: '#000',
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

	// protected createTerradrawTextLayer(map: Map) {
	// 	this.terradraw?.on('finish', () => {
	// 		const snapshot = this.terradraw?.getSnapshot();
	// 		const textFeatures = snapshot?.filter(
	// 			f => f.properties?.mode === 'text' && f.properties?.text
	// 		) ?? [];

	// 		// match expression breaks with no cases — use empty string fallback only
	// 		// const matchExpression: ExpressionSpecification = textFeatures.length
	// 		// 	? [
	// 		// 		'match',
	// 		// 		['get', 'id'],
	// 		// 		...(textFeatures as GeoJSONStoreFeatures<GeoJSONStoreGeometries>[])
	// 		// 			.flatMap(f => [f.id, f.properties.text as string]),
	// 		// 		''
	// 		// 	]
	// 		// 	: ['literal', ''];

	// 		this.addFeaturesToSource(textFeatures, map);
	// 	});
	// }

	// protected addFeaturesToSource(
	// 	features: GeoJSONStoreFeatures<GeoJSONStoreGeometries>[],
	// 	map: Map,
	// ) {
	// 	const source = map.getSource('td-text') as maplibregl.GeoJSONSource | undefined;

	// 	if (source) {
	// 		source.setData({
	// 			type: 'FeatureCollection',
	// 			features
	// 		});
	// 	} else {
	// 		map.addSource('td-text', {
	// 			type: 'geojson',
	// 			data: { type: 'FeatureCollection', features }
	// 		});

	// 		map.addLayer({
	// 			id: 'td-text-labels',
	// 			type: 'symbol',
	// 			source: 'td-text',
	// 			layout: {
	// 				'text-field': ['get', 'text'],
	// 				'text-size': 14,
	// 				'text-anchor': 'top',
	// 				'text-offset': [0, 0.8],
	// 				'text-font': ['Noto Sans Regular'],
	// 				'text-allow-overlap': true
	// 			},
	// 			paint: {
	// 				'text-color': '#111111',
	// 				'text-halo-color': '#ffffff',
	// 				'text-halo-width': 1.5
	// 			}
	// 		});
	// 	}
	// }
}
