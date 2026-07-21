import { LngLat } from 'maplibre-gl';
import {
	TerraDrawLineStringMode,
	TerraDrawExtend,
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	type GeoJSONStoreFeatures,
	type GeoJSONStoreGeometries
} from 'terra-draw';
import {
	ValhallaRouting,
	type costingModelType,
	type routingDistanceUnitType
} from '../helpers/valhallaRouting';

export type LineStringModeStyling = NonNullable<
	NonNullable<ConstructorParameters<typeof TerraDrawLineStringMode>[0]>['styles']
>;

/**
 * Styling for the node points (Start / No.x / Goal) which are created
 * after a route is computed by the Valhalla API.
 */
export type RoutingNodePointStyling = {
	/** Color of the first node point. Default is `#0000FF` */
	startPointColor: TerraDrawExtend.HexColorStyling;
	/** Width of the first node point. Default is 3 */
	startPointWidth: TerraDrawExtend.NumericStyling;
	/** Outline color of the first node point. Default is `#000000` */
	startPointOutlineColor: TerraDrawExtend.HexColorStyling;
	/** Outline width of the first node point. Default is 1 */
	startPointOutlineWidth: TerraDrawExtend.NumericStyling;
	/** Color of the last node point. Default is `#FFFF00` */
	goalPointColor: TerraDrawExtend.HexColorStyling;
	/** Width of the last node point. Default is 3 */
	goalPointWidth: TerraDrawExtend.NumericStyling;
	/** Outline color of the last node point. Default is `#000000` */
	goalPointOutlineColor: TerraDrawExtend.HexColorStyling;
	/** Outline width of the last node point. Default is 1 */
	goalPointOutlineWidth: TerraDrawExtend.NumericStyling;
	/** Color of the intermediate node points. Default is `#FFFFFF` */
	viaPointColor: TerraDrawExtend.HexColorStyling;
	/** Width of the intermediate node points. Default is 3 */
	viaPointWidth: TerraDrawExtend.NumericStyling;
	/** Outline color of the intermediate node points. Default is `#000000` */
	viaPointOutlineColor: TerraDrawExtend.HexColorStyling;
	/** Outline width of the intermediate node points. Default is 1 */
	viaPointOutlineWidth: TerraDrawExtend.NumericStyling;
};

export type RoutingModeStyling = LineStringModeStyling & RoutingNodePointStyling;

export type ValhallaRoutingModeOptions = {
	url: string;
	costingModel?: costingModelType;
	distanceUnit?: routingDistanceUnitType;
	styles?: Partial<RoutingModeStyling>;
};

export class TerraDrawValhallaRoutingMode extends TerraDrawLineStringMode {
	private _url: string;
	private _costingModel: costingModelType;
	private _distanceUnit: routingDistanceUnitType;

	private pendingLineId: TerraDrawExtend.FeatureId | null = null;
	private trackedLineIds = new Set<TerraDrawExtend.FeatureId>();

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

	constructor(options: ValhallaRoutingModeOptions) {
		super({
			modeName: 'routing',
			styles: (options.styles ?? {}) as Partial<LineStringModeStyling>
		});
		this._url = options.url;
		this._costingModel = options.costingModel ?? 'auto';
		this._distanceUnit = options.distanceUnit ?? 'kilometers';
	}

	onClick(event: TerraDrawMouseEvent): void {
		const wasDrawing = this.state === 'drawing';
		super.onClick(event);
		const isDrawing = this.state === 'drawing';

		if (!wasDrawing && isDrawing) {
			const newLine = this.store
				.copyAll()
				.find(
					(f) =>
						f.geometry.type === 'LineString' &&
						f.properties?.mode === this.mode &&
						!this.trackedLineIds.has(f.id as TerraDrawExtend.FeatureId)
				);
			if (newLine) {
				this.pendingLineId = newLine.id as TerraDrawExtend.FeatureId;
				this.trackedLineIds.add(this.pendingLineId);
			}
			return;
		}

		if (wasDrawing && !isDrawing) {
			this.finishAndRoute();
		}
	}

	onKeyUp(event: TerraDrawKeyboardEvent): void {
		const wasDrawing = this.state === 'drawing';
		super.onKeyUp(event);
		const isDrawing = this.state === 'drawing';

		if (wasDrawing && !isDrawing && this.pendingLineId !== null) {
			if (this.store.has(this.pendingLineId)) {
				this.finishAndRoute();
			} else {
				this.trackedLineIds.delete(this.pendingLineId);
				this.pendingLineId = null;
			}
		}
	}

	private finishAndRoute(): void {
		if (this.pendingLineId === null) return;
		const featureId = this.pendingLineId;
		this.pendingLineId = null;
		const geometry = this.store.getGeometryCopy<GeoJSONStoreGeometries>(featureId);
		if (geometry.type !== 'LineString') return;
		this.computeRoute(featureId, geometry.coordinates as [number, number][]);
	}

	styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling {
		if (feature.geometry.type === 'Point' && feature.properties?.originalId !== undefined) {
			// computed routing node point (Start / No.x / Goal)
			const styles = this.styles as Partial<RoutingModeStyling>;
			const text = feature.properties?.text;
			const node =
				text === 'Start'
					? {
							color: styles.startPointColor,
							defaultColor: '#0000FF' as HexColor,
							width: styles.startPointWidth,
							outlineColor: styles.startPointOutlineColor,
							outlineWidth: styles.startPointOutlineWidth
						}
					: text === 'Goal'
						? {
								color: styles.goalPointColor,
								defaultColor: '#FFFF00' as HexColor,
								width: styles.goalPointWidth,
								outlineColor: styles.goalPointOutlineColor,
								outlineWidth: styles.goalPointOutlineWidth
							}
						: {
								color: styles.viaPointColor,
								defaultColor: '#FFFFFF' as HexColor,
								width: styles.viaPointWidth,
								outlineColor: styles.viaPointOutlineColor,
								outlineWidth: styles.viaPointOutlineWidth
							};
			return {
				pointColor: this.getHexColorStylingValue(node.color, node.defaultColor, feature),
				pointWidth: this.getNumericStylingValue(node.width, 3, feature),
				pointOutlineColor: this.getHexColorStylingValue(node.outlineColor, '#000000', feature),
				pointOutlineWidth: this.getNumericStylingValue(node.outlineWidth, 1, feature),
				polygonFillColor: '#000',
				polygonFillOpacity: 0,
				polygonOutlineColor: '#000000',
				polygonOutlineWidth: 0,
				lineStringColor: '#000',
				lineStringWidth: 0,
				zIndex: 25
			};
		}

		return super.styleFeature(feature);
	}

	validateFeature(feature: GeoJSONStoreFeatures): { valid: boolean; reason?: string } {
		if (feature.geometry.type === 'Point' && feature.properties?.originalId !== undefined) {
			return feature.properties?.mode === this.mode ? { valid: true } : { valid: false };
		}
		return super.validateFeature(feature);
	}

	protected async computeRoute(
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

			this.store.create(
				result.pointFeatures.features.map((f) => {
					// maneuvers is a large nested object array only needed for the line summary
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { maneuvers, ...nodeProps } = f.properties ?? {};
					return {
						geometry: f.geometry as GeoJSONStoreGeometries,
						properties: {
							...nodeProps,
							mode: this.mode,
							originalId: String(featureId),
							groupId: String(featureId)
						}
					};
				})
			);

			this.store.updateProperty([
				{
					id: featureId,
					property: 'groupId',
					value: String(featureId)
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
