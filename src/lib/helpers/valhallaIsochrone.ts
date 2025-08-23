import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { costingModelType } from './valhallaRouting';

export const contourTypeOptions = [
	{ value: 'time', label: 'Time' },
	{ value: 'distance', label: 'Distance' }
] as const;

export type ContourType = (typeof contourTypeOptions)[number]['value'];

export interface Contour {
	time?: number;
	distance?: number;
	color: string;
}

/**
 * Valhalla Isochrone engine class
 */
export class ValhallaIsochrone {
	private url: string;

	/**
	 * Constructor
	 * @param url URL for terrain RGB raster tilesets
	 */
	constructor(url: string) {
		this.url = url;
	}

	/**
	 * Calculate isochrone by given parameters from Valhalla API
	 * @param lon Longitude
	 * @param lat Latitude
	 * @param contourType the type of contour either time or distance
	 * @param costingModel costing model either auto, bicycle or pedestrian
	 * @param contours Optional. the list of contour. If skipped, default value is used.
	 * @returns GeoJSON Feature Collection object
	 */
	public async calcIsochrone(
		lon: number,
		lat: number,
		contourType: ContourType,
		costingModel: costingModelType,
		contours: Contour[]
	) {
		const contourList: Contour[] = JSON.parse(JSON.stringify(contours));
		contourList.forEach((c) => {
			if (contourType === 'time') {
				delete c.distance;
			} else {
				delete c.time;
			}
		});

		// http://localhost:8002/isochrone?json={%22locations%22:[{%22lat%22:-1.946357,%22lon%22:30.059753}],%22costing%22:%22pedestrian%22,%22contours%22:[{%22time%22:15,%22color%22:%22ff0000%22},{%22time%22:30,%22color%22:%22ffff00%22},{%22time%22:60,%22color%22:%220000ff%22}]}
		const jsonOption = {
			locations: [{ lat, lon }],
			costing: costingModel,
			contours: contourList.map((c) => {
				c.color = c.color.replace('#', '');
				return c;
			}),
			polygons: true
		};
		const url = `${this.url}/isochrone?json=${JSON.stringify(jsonOption)}`;

		const res = await fetch(url);
		const geojson = await res.json();
		return geojson as { type: 'FeatureCollection'; features: GeoJSONStoreFeatures[] };
	}
}
