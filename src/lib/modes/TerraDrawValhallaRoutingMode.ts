import { LngLat } from 'maplibre-gl';
import {
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	TerraDrawExtend,
	type GeoJSONStoreFeatures,
	type GeoJSONStoreGeometries
} from 'terra-draw';
import {
	ValhallaRouting,
	type costingModelType,
	type routingDistanceUnitType
} from '../helpers/valhallaRouting';
import { ValhallaResultRegistry } from '../helpers/valhallaResultRegistry';

const { TerraDrawBaseDrawMode } = TerraDrawExtend;

export type RoutingModeStyling = {
	lineStringColor?: HexColor;
	lineStringWidth?: number;
	closingPointColor?: HexColor;
	closingPointWidth?: number;
	closingPointOutlineColor?: HexColor;
	closingPointOutlineWidth?: number;
};

export type ValhallaRoutingModeOptions = {
	url: string;
	costingModel?: costingModelType;
	distanceUnit?: routingDistanceUnitType;
	styles?: Partial<RoutingModeStyling>;
};

export class TerraDrawValhallaRoutingMode extends TerraDrawBaseDrawMode<RoutingModeStyling> {
	mode = 'routing';

	private _url: string;
	private _costingModel: costingModelType;
	private _distanceUnit: routingDistanceUnitType;

	private registry = new ValhallaResultRegistry();

	private currentCoordinates: [number, number][] = [];
	private currentFeatureId: TerraDrawExtend.FeatureId | null = null;
	private rafId: number | null = null;
	private lastClickTime = 0;
	private lastClickCoord: [number, number] | null = null;

	get url(): string {
		return this._url;
	}
	set url(value: string) {
		this._url = value;
	}

	get costingModel(): costingModelType {
		return this._costingModel;
	}
	set costingModel(value: costingModelType) {
		this._costingModel = value;
	}

	get distanceUnit(): routingDistanceUnitType {
		return this._distanceUnit;
	}
	set distanceUnit(value: routingDistanceUnitType) {
		this._distanceUnit = value;
	}

	/**
	 * Get computed routing node point features (with cumulative distance/time)
	 * for the given original LineString feature ID.
	 * @param id Original TerraDraw feature ID
	 * @returns Node point features, or an empty array if none exist
	 */
	public getResultFeatures(id: TerraDrawExtend.FeatureId): GeoJSONStoreFeatures[] {
		return this.registry.get(id);
	}

	/**
	 * Get all computed routing node point features across all routes.
	 * @returns All node point features
	 */
	public getAllResultFeatures(): GeoJSONStoreFeatures[] {
		return this.registry.getAll();
	}

	/**
	 * Delete computed routing results.
	 * @param ids Original TerraDraw feature IDs to delete. If omitted, all results are cleared.
	 */
	public deleteResultFeatures(ids?: TerraDrawExtend.FeatureId[]): void {
		this.registry.delete(ids);
	}

	constructor(options: ValhallaRoutingModeOptions) {
		super({ styles: options?.styles ?? {} });
		this._url = options.url;
		this._costingModel = options.costingModel ?? 'auto';
		this._distanceUnit = options.distanceUnit ?? 'kilometers';
		this.styles = options.styles ?? {};
	}

	start(): void {
		this.setStarted();
		this.setCursor('crosshair');
	}

	stop(): void {
		this.cleanUp();
		this.setStopped();
		this.setCursor('unset');
	}

	cleanUp(): void {
		if (this.currentFeatureId) {
			try {
				this.store.delete([this.currentFeatureId]);
			} catch {
				// feature may already be deleted
			}
		}
		this.currentFeatureId = null;
		this.currentCoordinates = [];

		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	onClick(event: TerraDrawMouseEvent): void {
		const coord: [number, number] = [event.lng, event.lat];
		const now = Date.now();
		const isDoubleClick =
			this.lastClickCoord &&
			now - this.lastClickTime < 300 &&
			Math.abs(coord[0] - this.lastClickCoord[0]) < 1e-5 &&
			Math.abs(coord[1] - this.lastClickCoord[1]) < 1e-5;

		this.lastClickTime = now;
		this.lastClickCoord = coord;

		if (!this.currentFeatureId) {
			this.currentCoordinates = [coord, coord];
			const [featureId] = this.store.create([
				{
					geometry: {
						type: 'LineString',
						coordinates: [...this.currentCoordinates]
					},
					properties: {
						mode: this.mode
					}
				}
			]);
			this.currentFeatureId = featureId as TerraDrawExtend.FeatureId;
			return;
		}

		if (isDoubleClick && this.currentCoordinates.length >= 3) {
			this.finishDrawing();
			return;
		}

		const lastIndex = this.currentCoordinates.length - 1;
		this.currentCoordinates.splice(lastIndex, 0, coord);
		this.store.updateGeometry([
			{
				id: this.currentFeatureId,
				geometry: {
					type: 'LineString',
					coordinates: [...this.currentCoordinates]
				}
			}
		]);
	}

	onMouseMove(event: TerraDrawMouseEvent): void {
		if (this.rafId) return;

		this.rafId = requestAnimationFrame(() => {
			this.rafId = null;

			if (this.currentFeatureId && this.currentCoordinates.length >= 2) {
				const lastIndex = this.currentCoordinates.length - 1;
				this.currentCoordinates[lastIndex] = [event.lng, event.lat];
				this.store.updateGeometry([
					{
						id: this.currentFeatureId,
						geometry: {
							type: 'LineString',
							coordinates: [...this.currentCoordinates]
						}
					}
				]);
			}

			this.setCursor('crosshair');
		});
	}

	onKeyUp(event: TerraDrawKeyboardEvent): void {
		if (event.key === 'Enter' && this.currentFeatureId && this.currentCoordinates.length >= 3) {
			this.finishDrawing();
		} else if (event.key === 'Escape') {
			this.cancelDrawing();
		}
	}

	styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling {
		const isDrawing = feature.id === this.currentFeatureId;
		return {
			pointColor: (this.styles.closingPointColor ?? '#FF0000') as HexColor,
			pointWidth: this.styles.closingPointWidth ?? 3,
			pointOutlineColor: (this.styles.closingPointOutlineColor ?? '#666666') as HexColor,
			pointOutlineWidth: this.styles.closingPointOutlineWidth ?? 1,
			polygonFillColor: '#000',
			polygonFillOpacity: 0,
			polygonOutlineColor: '#000000',
			polygonOutlineWidth: 0,
			lineStringColor: (this.styles.lineStringColor ?? '#FF0000') as HexColor,
			lineStringWidth: this.styles.lineStringWidth ?? 2,
			zIndex: isDrawing ? 30 : 20
		};
	}

	validateFeature(feature: GeoJSONStoreFeatures): { valid: boolean; reason?: string } {
		return {
			valid: feature.geometry.type === 'LineString' && feature.properties?.mode === this.mode
		};
	}

	private finishDrawing(): void {
		if (!this.currentFeatureId) return;

		this.currentCoordinates.pop();

		this.store.updateGeometry([
			{
				id: this.currentFeatureId,
				geometry: {
					type: 'LineString',
					coordinates: [...this.currentCoordinates]
				}
			}
		]);

		const featureId = this.currentFeatureId;
		const coordinates = [...this.currentCoordinates];

		this.currentFeatureId = null;
		this.currentCoordinates = [];

		this.computeRoute(featureId, coordinates);
	}

	private cancelDrawing(): void {
		if (this.currentFeatureId) {
			try {
				this.store.delete([this.currentFeatureId]);
			} catch {
				// feature may already be deleted
			}
		}
		this.currentFeatureId = null;
		this.currentCoordinates = [];
	}

	private async computeRoute(
		featureId: TerraDrawExtend.FeatureId,
		coordinates: [number, number][]
	): Promise<void> {
		if (!this._url) return;

		const tripData: LngLat[] = coordinates.map((c) => new LngLat(c[0], c[1]));
		if (tripData.length < 2) return;

		const routingEngine = new ValhallaRouting(this._url);

		try {
			const result = await routingEngine.calcRoute(
				tripData,
				this._costingModel,
				this._distanceUnit
			);
			if (!result || !result.feature) return;

			this.store.updateGeometry([
				{
					id: featureId,
					geometry: result.feature.geometry as GeoJSONStoreGeometries
				}
			]);

			const pointFeatures = result.pointFeatures.features.map((f) => {
				f.id = `${featureId}-${f.id}`;
				f.properties.originalId = featureId;
				return f;
			});

			this.registry.set(featureId, pointFeatures as unknown as GeoJSONStoreFeatures[]);

			this.store.updateProperty([
				{
					id: featureId,
					property: 'routeResult',
					value: JSON.stringify(pointFeatures)
				},
				{
					id: featureId,
					property: 'costingModel',
					value: this._costingModel
				},
				{
					id: featureId,
					property: 'distance',
					value: result.feature.properties?.distance as string
				},
				{
					id: featureId,
					property: 'distance_unit',
					value: result.feature.properties?.distance_unit as string
				},
				{
					id: featureId,
					property: 'time',
					value: result.feature.properties?.time as string
				}
			]);

			this.onFinish(featureId, { mode: this.mode, action: 'draw' });
		} catch (error) {
			console.error('Valhalla routing error:', error);
		}
	}
}
