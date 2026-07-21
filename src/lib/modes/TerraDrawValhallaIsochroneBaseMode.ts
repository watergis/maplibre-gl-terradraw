import {
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	TerraDrawExtend,
	type GeoJSONStoreFeatures,
	type GeoJSONStoreGeometries
} from 'terra-draw';
import { ValhallaIsochrone, type Contour, type ContourType } from '../helpers/valhallaIsochrone';
import type { costingModelType } from '../helpers/valhallaRouting';

const { TerraDrawBaseDrawMode } = TerraDrawExtend;

export type IsochronePointStyling = {
	pointColor?: HexColor;
	pointWidth?: number;
	pointOutlineColor?: HexColor;
	pointOutlineWidth?: number;
	polygonFillOpacity?: number;
	polygonOutlineWidth?: number;
};

export type ValhallaIsochroneModeOptions = {
	url: string;
	costingModel?: costingModelType;
	contours?: Contour[];
	styles?: Partial<IsochronePointStyling>;
};

const defaultContours: Contour[] = [
	{ time: 3, distance: 1, color: '#ff0000' },
	{ time: 5, distance: 2, color: '#ffff00' },
	{ time: 10, distance: 3, color: '#0000ff' },
	{ time: 15, distance: 4, color: '#ff00ff' }
];

/**
 * Abstract base mode shared by time/distance isochrone modes.
 * A subclass only needs to declare its `mode` name and `contourType`.
 *
 * The clicked location is kept in the store only while the Valhalla API request
 * is in flight; once isochrone polygons are computed they are stored in the
 * Terra Draw store as the canonical features and the transient point is removed.
 * Polygons computed from the same click share `properties.groupId`.
 */
export abstract class TerraDrawValhallaIsochroneBaseMode extends TerraDrawBaseDrawMode<IsochronePointStyling> {
	protected abstract readonly contourType: ContourType;

	private _url: string;
	private _costingModel: costingModelType;
	private _contours: Contour[];

	// transient click points whose isochrone request is still in flight
	private pendingPointIds = new Set<TerraDrawExtend.FeatureId>();

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

	get contours(): Contour[] {
		return this._contours;
	}
	set contours(value: Contour[]) {
		this._contours = value;
	}

	constructor(options: ValhallaIsochroneModeOptions) {
		super({ styles: options?.styles ?? {} });
		this._url = options.url;
		this._costingModel = options.costingModel ?? 'auto';
		this._contours = options.contours ?? [...defaultContours];
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
		for (const id of this.pendingPointIds) {
			try {
				this.store.delete([id]);
			} catch {
				// feature may already be deleted
			}
		}
		this.pendingPointIds.clear();
	}

	onClick(event: TerraDrawMouseEvent): void {
		// avoid creating transient features that can never be resolved
		if (!this._url) return;

		const [featureId] = this.store.create([
			{
				geometry: {
					type: 'Point',
					coordinates: [event.lng, event.lat]
				},
				properties: {
					mode: this.mode
				}
			}
		]);

		this.pendingPointIds.add(featureId as TerraDrawExtend.FeatureId);
		this.computeIsochrone(featureId as TerraDrawExtend.FeatureId, [event.lng, event.lat]);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onMouseMove(_event: TerraDrawMouseEvent): void {
		this.setCursor('crosshair');
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onKeyUp(_event: TerraDrawKeyboardEvent): void {
		// no-op
	}

	styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling {
		if (feature.geometry.type === 'Polygon') {
			const fillColor = (feature.properties?.fillColor ?? '#ff0000') as HexColor;
			const contour = Number(feature.properties?.contour ?? 0);
			return {
				pointColor: '#000000',
				pointWidth: 0,
				pointOutlineColor: '#000000',
				pointOutlineWidth: 0,
				polygonFillColor: fillColor,
				polygonFillOpacity:
					this.styles.polygonFillOpacity ?? Number(feature.properties?.fillOpacity ?? 0.33),
				polygonOutlineColor: fillColor,
				polygonOutlineWidth: this.styles.polygonOutlineWidth ?? 3,
				lineStringColor: '#000000',
				lineStringWidth: 0,
				// render smaller contours above larger ones
				zIndex: Number.isFinite(contour) ? Math.max(0, 100 - contour) : 10
			};
		}

		// transient click point styling while the isochrone request is in flight
		return {
			pointColor: (this.styles.pointColor ?? '#FFFFFF') as HexColor,
			pointWidth: this.styles.pointWidth ?? 5,
			pointOutlineColor: (this.styles.pointOutlineColor ?? '#666666') as HexColor,
			pointOutlineWidth: this.styles.pointOutlineWidth ?? 1,
			polygonFillColor: '#000',
			polygonFillOpacity: 0,
			polygonOutlineColor: '#000000',
			polygonOutlineWidth: 0,
			lineStringColor: '#000',
			lineStringWidth: 0,
			zIndex: 120
		};
	}

	validateFeature(feature: GeoJSONStoreFeatures): { valid: boolean; reason?: string } {
		if (feature.properties?.mode !== this.mode) return { valid: false };

		if (feature.geometry.type === 'Polygon') {
			return { valid: true };
		}

		// allow only the transient in-flight click points created by this mode
		if (feature.geometry.type === 'Point') {
			return {
				valid: this.pendingPointIds.has(feature.id as TerraDrawExtend.FeatureId)
			};
		}

		return { valid: false };
	}

	private async computeIsochrone(
		featureId: TerraDrawExtend.FeatureId,
		coord: [number, number]
	): Promise<void> {
		if (!this._url) return;

		const valhallaIsochrone = new ValhallaIsochrone(this._url);

		try {
			const fc = await valhallaIsochrone.calcIsochrone(
				coord[0],
				coord[1],
				this.contourType,
				this._costingModel,
				this._contours
			);

			const polygonIds = this.store.create(
				fc.features.map((f) => ({
					geometry: f.geometry as GeoJSONStoreGeometries,
					properties: {
						...f.properties,
						mode: this.mode,
						groupId: String(featureId),
						contourType: this.contourType,
						costingModel: this._costingModel
					}
				}))
			);

			this.deletePendingPoint(featureId);

			const lastId = polygonIds[polygonIds.length - 1];
			if (lastId !== undefined) {
				this.onFinish(lastId as TerraDrawExtend.FeatureId, { mode: this.mode, action: 'draw' });
			}
		} catch (error) {
			this.deletePendingPoint(featureId);
			console.error(`Valhalla ${this.contourType} isochrone error:`, error);
		}
	}

	private deletePendingPoint(featureId: TerraDrawExtend.FeatureId) {
		this.pendingPointIds.delete(featureId);
		try {
			this.store.delete([featureId]);
		} catch {
			// feature may already be deleted
		}
	}
}
