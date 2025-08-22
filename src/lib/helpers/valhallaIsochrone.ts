import type { GeoJSONStoreFeatures } from 'terra-draw';

export type ContourType = 'time' | 'distance';

export interface Contour {
	time?: number;
	distance?: number;
	color: string;
}

/**
 * Options of means of transport for Valhalla isochrone API.
 */
export const isochroneMeansOfTransportOptions = [
	{ value: 'pedestrian', label: 'Pedestrian' },
	{ value: 'bicycle', label: 'Bicycle' },
	{ value: 'auto', label: 'Car' }
] as const;

/**
 * isochroneMeansOfTransportType is the type for means of transport in Valhalla isochrone API.
 */
export type isochroneMeansOfTransportType =
	(typeof isochroneMeansOfTransportOptions)[number]['value'];

export class ValhallaIsochrone {
	private url: string;

	/**
	 * Constructor
	 * @param url URL for terrain RGB raster tilesets
	 */
	constructor(url: string) {
		this.url = url;
	}

	public async calcIsochrone(
		lon: number,
		lat: number,
		contourType: ContourType,
		meansOfTransport: isochroneMeansOfTransportType,
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
			costing: meansOfTransport,
			contours: contourList,
			polygons: true
		};
		const url = `${this.url}/isochrone?json=${JSON.stringify(jsonOption)}`;

		const res = await fetch(url);
		const geojson = await res.json();
		return geojson as { type: 'FeatureCollection'; features: GeoJSONStoreFeatures[] };
	}
}
