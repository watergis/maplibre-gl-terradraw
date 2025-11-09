import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { Position } from 'geojson';

/**
 * Round coordinates to given coordinate precision
 *
 * If you want to add geojson with excessive coordinate precision to TerraDraw by using addFeatures,
 * TerraDraw raise a validation error if you add GeoJSON with excessive precision.
 *
 * use this function to make sure geojson coordinates to meet terradraw setting before adding features.
 *
 * The below is a sample usage of the function
 *
 * ```js
 * const drawControl = new MaplibreTerraDrawControl({
 *   adapterOptions: {
 *     coordinatePrecision: 6
 *   }
 * })
 * map.addControl(drawControl)
 *
 * map.once('load', ()=>{
 *   const features = [] // add your geojson features here
 *   const draw = drawControl.getTerradrawInstance()
 *   draw.addFeatures(roundFeatureCoordinates(features), 6)
 * })
 * ```
 * @param features GeoJSON feature
 * @param decimalPlaces decimal places to 9 (default of terradraw)
 * @returns GeoJSON feature after rounding coordinates
 */
export const roundFeatureCoordinates = (
	features: GeoJSONStoreFeatures[],
	decimalPlaces: number = 9
): GeoJSONStoreFeatures[] => {
	// Helper function to round a single coordinate
	function roundCoord(coord: Position) {
		return [Number(coord[0].toFixed(decimalPlaces)), Number(coord[1].toFixed(decimalPlaces))];
	}

	// Process coordinates based on geometry type
	function processGeometry(geometry: GeoJSONStoreFeatures['geometry']) {
		const type = geometry.type as
			| 'Polygon'
			| 'LineString'
			| 'Point'
			| 'MultiPoint'
			| 'MultiLineString'
			| 'MultiPolygon';
		let coordinates = geometry.coordinates as Position | Position[] | Position[][] | Position[][][];

		switch (type) {
			case 'Point':
				coordinates = roundCoord(coordinates as [number, number]);
				break;
			case 'LineString':
			case 'MultiPoint':
				coordinates = (coordinates as Position[]).map(roundCoord);
				break;
			case 'Polygon':
			case 'MultiLineString':
				coordinates = (coordinates as Position[][]).map((ring: Position[]) => ring.map(roundCoord));
				break;
			case 'MultiPolygon':
				coordinates = (coordinates as unknown as Position[][][]).map((polygon: Position[][]) =>
					polygon.map((ring: Position[]) => ring.map(roundCoord))
				);
				break;
			default:
				break;
		}
		return {
			...geometry,
			coordinates: coordinates
		};
	}

	// Process each feature
	return features.map((feature) => ({
		...feature,
		geometry: processGeometry(feature.geometry) as GeoJSONStoreFeatures['geometry']
	}));
};
