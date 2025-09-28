import distance from '@turf/distance';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { LngLatLike, Map } from 'maplibre-gl';
import type { MeasureUnitType, forceDistanceUnitType, TerrainSource } from '../interfaces';
import { convertDistance } from './convertDistance';

/**
 * Caclulate distance for each segment on a given feature
 * @param feature LineString GeoJSON feature
 * @param unitType measure unit type either metric or imperial
 * @param distancePrecision Precision of distance
 * @param forceUnit Default is `auto`. If `auto` is set, unit is converted depending on the value in metric.
 * @param map Maplibre map instance
 * @param computeElevation Compute elevation for each segment
 * @param terrainSource Terrain source for elevation calculation. If terrainSource is undefined, going to to query elevation from maplibre terrain.
 * @returns The returning feature will contain `segments`, `distance`, `unit` properties. `segments` will have multiple point features.
 */
export const calcDistance = (
	feature: GeoJSONStoreFeatures,
	unitType: MeasureUnitType,
	distancePrecision: number,
	forceUnit?: forceDistanceUnitType,
	map?: Map,
	computeElevation?: boolean,
	terrainSource?: TerrainSource
) => {
	if (feature.geometry.type !== 'LineString') return feature;
	const coordinates: number[][] = (feature as GeoJSONStoreFeatures).geometry
		.coordinates as number[][];

	// calculate distance for each segment of LineString feature
	let totalDistance = 0;
	const segments: GeoJSONStoreFeatures[] = [];
	for (let i = 0; i < coordinates.length - 1; i++) {
		const start = coordinates[i];
		const end = coordinates[i + 1];
		const result = distance(start, end, { units: unitType === 'metric' ? 'kilometers' : 'miles' });
		totalDistance += result;

		// segment
		const segment = JSON.parse(JSON.stringify(feature));
		segment.id = `${segment.id}-${i}`;
		segment.geometry.coordinates = [start, end];
		segment.properties.originalId = feature.id;
		segment.properties.distance = result;
		segment.properties.total = totalDistance;

		if (computeElevation === true && terrainSource === undefined) {
			const elevation_start = map?.queryTerrainElevation(start as LngLatLike);
			if (elevation_start) {
				segment.properties.elevation_start = elevation_start;
			}

			const elevation_end = map?.queryTerrainElevation(end as LngLatLike);
			if (elevation_end) {
				segment.properties.elevation_end = elevation_end;
			}
		}

		segments.push(segment);
	}

	feature.properties.distance = segments[segments.length - 1].properties.total;
	feature.properties.segments = JSON.parse(JSON.stringify(segments));

	// convert distance unit
	const convertedDistance = convertDistance(
		feature.properties.distance as number,
		unitType,
		forceUnit
	);
	feature.properties.distance = convertedDistance.distance;
	feature.properties.unit = convertedDistance.unit;

	(feature.properties.segments as unknown as GeoJSONStoreFeatures[]).forEach(
		(segment: GeoJSONStoreFeatures) => {
			const segmentDistance = convertDistance(
				segment.properties.distance as number,
				unitType,
				forceUnit
			);
			segment.properties.distance = segmentDistance.distance;
			segment.properties.unit = segmentDistance.unit;

			const segmentTotalDistance = convertDistance(
				segment.properties.total as number,
				unitType,
				forceUnit
			);
			segment.properties.total = segmentTotalDistance.distance;
			segment.properties.totalUnit = segmentTotalDistance.unit;
		}
	);

	//  round distance precision according to the config.
	feature.properties.distance = parseFloat(
		(feature.properties.distance as number).toFixed(distancePrecision)
	);

	(feature.properties.segments as unknown as GeoJSONStoreFeatures[]).forEach(
		(segment: GeoJSONStoreFeatures) => {
			segment.properties.distance = parseFloat(
				(segment.properties.distance as number).toFixed(distancePrecision)
			);
			segment.properties.total = parseFloat(
				(segment.properties.total as number).toFixed(distancePrecision)
			);
		}
	);

	return feature;
};
