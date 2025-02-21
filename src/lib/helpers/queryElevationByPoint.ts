import type { TerrainSource } from '../interfaces';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { Map, type LngLatLike } from 'maplibre-gl';

/**
 * query elevation by point feature.
 * @param feature point geojson feature
 * @param map Maplibre map instance
 * @param computeElevation compute elevation or not
 * @param terrainSource terrain source for computing elevation from raster DEM
 * @returns geojson feature after computing
 */
export const queryElevationByPoint = (
	feature: GeoJSONStoreFeatures,
	map?: Map,
	computeElevation?: boolean,
	terrainSource?: TerrainSource
) => {
	if (feature.geometry.type !== 'Point') return feature;

	const coordinates: number[] = (feature as GeoJSONStoreFeatures).geometry.coordinates as number[];

	if (computeElevation === true && terrainSource === undefined) {
		const elevation = map?.queryTerrainElevation(coordinates as LngLatLike);
		if (elevation) {
			feature.properties.elevation = elevation;
		}
	}
	return feature;
};
