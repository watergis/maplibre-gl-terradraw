import { describe, it, expect } from 'vitest';
import { calcArea } from './calcArea';
import type { GeoJSONStoreFeatures } from 'terra-draw';

const mockFeature: GeoJSONStoreFeatures = {
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

describe('calcArea', () => {
	it('should add area and unit properties to the feature', () => {
		const result = calcArea(mockFeature, 'metric', 2);
		expect(result.properties).toHaveProperty('area');
		expect(result.properties).toHaveProperty('unit');
	});

	it('should not modify point features', () => {
		const pointFeature: GeoJSONStoreFeatures = {
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: [0, 0]
			},
			properties: {}
		};

		const result = calcArea(pointFeature, 'metric', 2);
		expect(result).toEqual(pointFeature);
	});

	it('should not modify line features', () => {
		const lineFeature: GeoJSONStoreFeatures = {
			type: 'Feature',
			geometry: {
				type: 'LineString',
				coordinates: [
					[0, 0],
					[1, 1]
				]
			},
			properties: {}
		};

		const result = calcArea(lineFeature, 'metric', 2);
		expect(result).toEqual(lineFeature);
	});
});
