import { describe, it, expect } from 'vitest';
import { roundFeatureCoordinates } from './roundFeatureCoordinates';
import type { GeoJSONStoreFeatures } from 'terra-draw';

describe('roundFeatureCoordinates', () => {
	it('should round a Point geometry', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [12.34567891234, 98.76543219876]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([12.345678912, 98.765432199]);
	});

	it('should round a LineString geometry', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [
						[1.23456789123, 2.34567891234],
						[3.45678912345, 4.56789123456]
					]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([
			[1.234567891, 2.345678912],
			[3.456789123, 4.567891235]
		]);
	});

	it('should round a Polygon geometry', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[1.23456789123, 2.34567891234],
							[3.45678912345, 4.56789123456],
							[5.67891234567, 6.78912345678],
							[1.23456789123, 2.34567891234]
						]
					]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([
			[
				[1.234567891, 2.345678912],
				[3.456789123, 4.567891235],
				[5.678912346, 6.789123457],
				[1.234567891, 2.345678912]
			]
		]);
	});

	it('should round a MultiPoint geometry', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'MultiPoint',
					coordinates: [
						[1.23456789123, 2.34567891234],
						[3.45678912345, 4.56789123456]
					]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([
			[1.234567891, 2.345678912],
			[3.456789123, 4.567891235]
		]);
	});

	it('should round a MultiLineString geometry', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'MultiLineString',
					coordinates: [
						[
							[1.23456789123, 2.34567891234],
							[3.45678912345, 4.56789123456]
						],
						[
							[5.67891234567, 6.78912345678],
							[7.89123456789, 8.91234567891]
						]
					]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([
			[
				[1.234567891, 2.345678912],
				[3.456789123, 4.567891235]
			],
			[
				[5.678912346, 6.789123457],
				[7.891234568, 8.912345679]
			]
		]);
	});

	it('should round a MultiPolygon geometry', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'MultiPolygon',
					coordinates: [
						[
							[
								[1.23456789123, 2.34567891234],
								[3.45678912345, 4.56789123456],
								[5.67891234567, 6.78912345678],
								[1.23456789123, 2.34567891234]
							]
						],
						[
							[
								[7.89123456789, 8.91234567891],
								[9.01234567892, 10.12345678912],
								[11.23456789123, 12.34567891234],
								[7.89123456789, 8.91234567891]
							]
						]
					]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as unknown as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([
			[
				[
					[1.234567891, 2.345678912],
					[3.456789123, 4.567891235],
					[5.678912346, 6.789123457],
					[1.234567891, 2.345678912]
				]
			],
			[
				[
					[7.891234568, 8.912345679],
					[9.012345679, 10.123456789],
					[11.234567891, 12.345678912],
					[7.891234568, 8.912345679]
				]
			]
		]);
	});

	it('should allow specifying a different number of decimal places', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [1.23456789, 2.34567891]
				},
				properties: {}
			}
		];

		const result = roundFeatureCoordinates(features as unknown as GeoJSONStoreFeatures[], 2);
		expect(result[0].geometry.coordinates).toEqual([1.23, 2.35]);
	});

	it('should return original geometry when geometry type is not supported either', () => {
		const features = [
			{
				type: 'Feature',
				geometry: {
					type: 'Points',
					coordinates: [12.34567891234, 98.76543219876]
				},
				properties: {}
			}
		];
		const result = roundFeatureCoordinates(features as GeoJSONStoreFeatures[]);
		expect(result[0].geometry.coordinates).toEqual([12.34567891234, 98.76543219876]);
	});
});
