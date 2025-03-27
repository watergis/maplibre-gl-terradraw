import distance from '@turf/distance';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { getDistanceUnitName } from './getDistanceUnitName';
import type { LngLatLike, Map } from 'maplibre-gl';
import type { DistanceUnit, TerrainSource } from '../interfaces';
import { convertMetricDistance } from './convertMetricDistance';

/**
 * Caclulate distance for each segment on a given feature
 * @param feature LineString GeoJSON feature
 * @param distanceUnit Distance unit
 * @param distancePrecision Precision of distance
 * @param map Maplibre map instance
 * @param computeElevation Compute elevation for each segment
 * @param terrainSource Terrain source for elevation calculation. If terrainSource is undefined, going to to query elevation from maplibre terrain.
 * @returns The returning feature will contain `segments`, `distance`, `unit` properties. `segments` will have multiple point features.
 */
export const calcDistance = (
	feature: GeoJSONStoreFeatures,
	distanceUnit: DistanceUnit,
	distancePrecision: number,
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
		const result = distance(start, end, { units: distanceUnit });
		totalDistance += result;

		// segment
		const segment = JSON.parse(JSON.stringify(feature));
		segment.id = `${segment.id}-${i}`;
		segment.geometry.coordinates = [start, end];
		segment.properties.originalId = feature.id;
		segment.properties.distance = result;
		segment.properties.total = totalDistance;
		segment.properties.unit = getDistanceUnitName(distanceUnit);
		segment.properties.totalUnit = getDistanceUnitName(distanceUnit);

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
	feature.properties.unit = segments[segments.length - 1].properties.unit;
	feature.properties.segments = JSON.parse(JSON.stringify(segments));

	if (distanceUnit === 'kilometers') {
		// convert kilometers to meters or centimeters if distance is small
		const metricDistance = convertMetricDistance(feature.properties.distance as number);
		feature.properties.distance = metricDistance.distance;
		feature.properties.unit = metricDistance.unit;

		(feature.properties.segments as unknown as GeoJSONStoreFeatures[]).forEach(
			(segment: GeoJSONStoreFeatures) => {
				const segmentDistance = convertMetricDistance(segment.properties.distance as number);
				segment.properties.distance = segmentDistance.distance;
				segment.properties.unit = segmentDistance.unit;

				const segmentTotalDistance = convertMetricDistance(segment.properties.total as number);
				segment.properties.total = segmentTotalDistance.distance;
				segment.properties.totalUnit = segmentTotalDistance.unit;
			}
		);
	}

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
