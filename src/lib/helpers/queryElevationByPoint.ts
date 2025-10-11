import type { TerrainSource, MeasureUnitType, MeasureUnitSymbolType } from '../interfaces';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { Map, type LngLatLike } from 'maplibre-gl';
import { convertElevation } from './convertElevation';
import { defaultMeasureUnitSymbols } from '../constants';

/**
 * query elevation by point feature.
 * @param feature point geojson feature
 * @param map Maplibre map instance
 * @param computeElevation compute elevation or not
 * @param terrainSource terrain source for computing elevation from raster DEM. If terrainSource is undefined, going to to query elevation from maplibre terrain.
 * @param measureUnitType The unit type for elevation display (metric or imperial)
 * @param measureUnitSymbols Optional custom unit symbols
 * @returns geojson feature after computing
 */
export const queryElevationByPoint = (
	feature: GeoJSONStoreFeatures,
	map?: Map,
	computeElevation?: boolean,
	terrainSource?: TerrainSource,
	measureUnitType: MeasureUnitType = 'metric',
	measureUnitSymbols: MeasureUnitSymbolType = defaultMeasureUnitSymbols
) => {
	if (feature.geometry.type !== 'Point') return feature;

	const coordinates: number[] = (feature as GeoJSONStoreFeatures).geometry.coordinates as number[];

	if (computeElevation === true && terrainSource === undefined) {
		const elevationInMeters = map?.queryTerrainElevation(coordinates as LngLatLike);
		if (elevationInMeters) {
			const { elevation, unit } = convertElevation(elevationInMeters, measureUnitType, measureUnitSymbols);
			feature.properties.elevation = elevation;
			feature.properties.elevationUnit = unit;
		}
	}
	return feature;
};
