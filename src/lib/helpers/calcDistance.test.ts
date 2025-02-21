import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calcDistance } from './calcDistance';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { Map } from 'maplibre-gl';

describe('calcDistance', () => {
	let mockFeature: GeoJSONStoreFeatures;
	let mockMap: Map;

	beforeEach(() => {
		mockFeature = {
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: [
					[0, 0],
					[1, 1],
					[2, 2]
				]
			},
			properties: {}
		};

		mockMap = {
			queryTerrainElevation: vi.fn().mockReturnValue(100)
		} as unknown as Map;
	});

	it('should not modify non-LineString features', () => {
		const nonLineFeature: GeoJSONStoreFeatures = {
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[0, 1],
						[1, 1],
						[1, 0],
						[0, 0]
					]
				]
			},
			properties: {}
		};

		const result = calcDistance(nonLineFeature, 'kilometers', 2);
		expect(result).toEqual(nonLineFeature);
	});

	it('should add distance, unit, and segments properties', () => {
		const result = calcDistance(mockFeature, 'kilometers', 2);
		expect(result.properties).toHaveProperty('distance');
		expect(result.properties).toHaveProperty('unit');
		expect(result.properties).toHaveProperty('segments');
		expect(Array.isArray(result.properties.segments)).toBe(true);
		expect(Array.isArray(result.properties.segments) && result.properties.segments.length).toBe(2);
	});

	it('should add elevation_start and elevation_end properties if computeElevation is true', () => {
		const result = calcDistance(mockFeature, 'kilometers', 2, mockMap, true);
		if (Array.isArray(result.properties.segments)) {
			result.properties.segments.forEach((segment: unknown) => {
				if (!segment || typeof segment !== 'object' || !('properties' in segment)) return;
				expect(segment.properties).toHaveProperty('elevation_start', 100);
				expect(segment.properties).toHaveProperty('elevation_end', 100);
			});
		}
	});
});
