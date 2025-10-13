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

	it('should add elevation and elevationUnit properties if computeElevation is true and map instance is provided (metric)', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, true, undefined, 'metric');
		expect(result.properties).toHaveProperty('elevation', 100);
		expect(result.properties).toHaveProperty('elevationUnit', 'm');
	});

	it('should add elevation and elevationUnit properties if computeElevation is true and map instance is provided (imperial)', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, true, undefined, 'imperial');
		expect(result.properties.elevation).toBeCloseTo(328.084, 3);
		expect(result.properties).toHaveProperty('elevationUnit', 'ft');
	});

	it('should not add elevation property if computeElevation is false', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, false, undefined);
		expect(result.properties).not.toHaveProperty('elevation');
		expect(result.properties).not.toHaveProperty('elevationUnit');
	});

	it('should add elevation property if terrainSource is undefined and computeElevation is true', () => {
		const result = queryElevationByPoint(mockFeature, mockMap, true, undefined);
		expect(result.properties).toHaveProperty('elevation');
		expect(result.properties).toHaveProperty('elevationUnit');
	});

	it('should not add elevation if computeElevation is false even with terrainSource', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };
		const result = queryElevationByPoint(mockFeature, mockMap, false, terrainSource);
		expect(result.properties).not.toHaveProperty('elevation');
		expect(result.properties).not.toHaveProperty('elevationUnit');
	});

	it('should not add elevation if map is undefined', () => {
		const result = queryElevationByPoint(mockFeature, undefined, true, undefined);
		expect(result.properties).not.toHaveProperty('elevation');
		expect(result.properties).not.toHaveProperty('elevationUnit');
	});

	it('should not add elevation if queryTerrainElevation returns undefined', () => {
		const mockMapReturnsUndefined = {
			queryTerrainElevation: vi.fn().mockReturnValue(undefined)
		} as unknown as Map;

		const result = queryElevationByPoint(mockFeature, mockMapReturnsUndefined, true, undefined);
		expect(result.properties).not.toHaveProperty('elevation');
		expect(result.properties).not.toHaveProperty('elevationUnit');
	});

	it('should convert existing elevation from feet to meters when terrainSource is provided', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };
		const featureWithElevationInFeet = {
			...mockFeature,
			properties: {
				elevation: 328.084, // 100 meters in feet
				elevationUnit: 'ft'
			}
		};

		const result = queryElevationByPoint(
			featureWithElevationInFeet,
			mockMap,
			true,
			terrainSource,
			'metric'
		);
		expect(result.properties.elevation).toBeCloseTo(100, 1); // Should convert back to meters
		expect(result.properties.elevationUnit).toBe('m');
	});

	it('should convert existing elevation from foot to meters when terrainSource is provided', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };
		const featureWithElevationInFoot = {
			...mockFeature,
			properties: {
				elevation: 328.084, // 100 meters in feet
				elevationUnit: 'foot'
			}
		};

		const result = queryElevationByPoint(
			featureWithElevationInFoot,
			mockMap,
			true,
			terrainSource,
			'metric'
		);
		expect(result.properties.elevation).toBeCloseTo(100, 1); // Should convert back to meters
		expect(result.properties.elevationUnit).toBe('m');
	});

	it('should convert existing elevation to imperial when terrainSource is provided', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };
		const featureWithElevationInMeters = {
			...mockFeature,
			properties: {
				elevation: 100, // 100 meters
				elevationUnit: 'm'
			}
		};

		const result = queryElevationByPoint(
			featureWithElevationInMeters,
			mockMap,
			true,
			terrainSource,
			'imperial'
		);
		expect(result.properties.elevation).toBeCloseTo(328.084, 3); // Should convert to feet
		expect(result.properties.elevationUnit).toBe('ft');
	});

	it('should not modify properties when terrainSource is provided but no existing elevation', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };
		const result = queryElevationByPoint(mockFeature, mockMap, true, terrainSource);

		// Should not add elevation when terrainSource is provided but no existing elevation
		expect(result.properties).not.toHaveProperty('elevation');
		expect(result.properties).not.toHaveProperty('elevationUnit');
	});

	it('should use custom unit symbols when provided', () => {
		const customUnitSymbols = {
			kilometer: 'km',
			meter: 'meter', // Custom meter symbol
			centimeter: 'cm',
			mile: 'mi',
			foot: 'foot', // Custom foot symbol
			inch: 'in',
			'square meters': 'm²',
			'square kilometers': 'km²',
			ares: 'a',
			hectares: 'ha',
			'square feet': 'ft²',
			'square yards': 'yd²',
			acres: 'acres',
			'square miles': 'mi²'
		};

		const result = queryElevationByPoint(
			mockFeature,
			mockMap,
			true,
			undefined,
			'metric',
			customUnitSymbols
		);
		expect(result.properties.elevation).toBe(100);
		expect(result.properties.elevationUnit).toBe('meter'); // Should use custom symbol
	});

	it('should handle elevation conversion with different existing unit values', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };

		// Test with elevation but different unit (not ft or foot)
		const featureWithDifferentUnit = {
			...mockFeature,
			properties: {
				elevation: 100,
				elevationUnit: 'm' // Already in meters
			}
		};

		const result = queryElevationByPoint(
			featureWithDifferentUnit,
			mockMap,
			true,
			terrainSource,
			'metric'
		);
		expect(result.properties.elevation).toBe(100); // Should remain the same
		expect(result.properties.elevationUnit).toBe('m');
	});

	it('should handle non-number elevation values gracefully', () => {
		const terrainSource = { url: 'test-terrain-url', type: 'raster-dem' as const };
		const featureWithInvalidElevation = {
			...mockFeature,
			properties: {
				elevation: 'invalid', // Non-number value
				elevationUnit: 'm'
			}
		};

		const result = queryElevationByPoint(
			featureWithInvalidElevation,
			mockMap,
			true,
			terrainSource,
			'metric'
		);
		// Should not modify the properties when elevation is not a number
		expect(result.properties.elevation).toBe('invalid');
		expect(result.properties.elevationUnit).toBe('m');
	});
});
