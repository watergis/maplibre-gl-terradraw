import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryElevationByPoint } from './queryElevationByPoint';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { Map } from 'maplibre-gl';

describe('queryElevationByPoint', () => {
	let mockFeature: GeoJSONStoreFeatures;
	let mockMap: Map;

	beforeEach(() => {
		mockFeature = {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [10, 20]
			},
			properties: {}
		};

		mockMap = {
			queryTerrainElevation: vi.fn().mockReturnValue(100)
		} as unknown as Map;
	});

	it('should not modify non-Point features', () => {
		const nonPointFeature: GeoJSONStoreFeatures = {
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

		const result = queryElevationByPoint(nonPointFeature, undefined, true);
		expect(result).toEqual(nonPointFeature);
	});

	it('should add elevation property if computeElevation is true and map instance is provided', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, true);
		expect(result.properties).toHaveProperty('elevation', 100);
	});

	it('should not add elevation property if computeElevation is false', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, false, undefined);
		expect(result.properties).not.toHaveProperty('elevation');
	});

	it('should add elevation property if terrainSource is undefined and computeElevation is true', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, true, undefined);
		expect(result.properties).toHaveProperty('elevation');
	});
});
