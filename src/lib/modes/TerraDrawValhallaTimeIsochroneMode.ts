import {
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	TerraDrawExtend,
	type GeoJSONStoreFeatures
} from 'terra-draw';
import { ValhallaIsochrone, type Contour } from '../helpers/valhallaIsochrone';
import type { costingModelType } from '../helpers/valhallaRouting';

const { TerraDrawBaseDrawMode } = TerraDrawExtend;

export type IsochronePointStyling = {
	pointColor?: HexColor;
	pointWidth?: number;
	pointOutlineColor?: HexColor;
	pointOutlineWidth?: number;
};

export type ValhallaTimeIsochroneModeOptions = {
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

export class TerraDrawValhallaTimeIsochroneMode extends TerraDrawBaseDrawMode<IsochronePointStyling> {
	mode = 'time-isochrone';

	private _url: string;
	private _costingModel: costingModelType;
	private _contours: Contour[];

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

	constructor(options: ValhallaTimeIsochroneModeOptions) {
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
		// No in-progress state for point placement
	}

	onClick(event: TerraDrawMouseEvent): void {
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	styleFeature(_feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling {
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
			zIndex: 20
		};
	}

	validateFeature(feature: GeoJSONStoreFeatures): { valid: boolean; reason?: string } {
		return {
			valid: feature.geometry.type === 'Point' && feature.properties?.mode === this.mode
		};
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
				'time',
				this._costingModel,
				this._contours
			);

			const updatedFeatures = fc.features.map((f) => {
				f.id = `${featureId}-${f.properties.contour}`;
				f.properties.originalId = featureId;
				f.properties.mode = this.mode;
				return f;
			});

			this.store.updateProperty([
				{
					id: featureId,
					property: 'contourType',
					value: 'time'
				},
				{
					id: featureId,
					property: 'costingModel',
					value: this._costingModel
				},
				{
					id: featureId,
					property: 'result',
					value: JSON.stringify(updatedFeatures)
				}
			]);

			this.onFinish(featureId, { mode: this.mode, action: 'draw' });
		} catch (error) {
			console.error('Valhalla time isochrone error:', error);
		}
	}
}
