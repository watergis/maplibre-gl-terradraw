import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryElevationFromRasterDEM } from './queryElevationFromRasterDEM';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { TerrainSource } from '../interfaces';

vi.mock('@watergis/terrain-rgb', () => {
	return {
		TerrainRGB: vi.fn().mockImplementation(() => ({
			getElevation: vi.fn().mockResolvedValue(150)
		})),
		Terrarium: vi.fn().mockImplementation(() => ({
			getElevation: vi.fn().mockResolvedValue(150)
		}))
	};
});

describe('queryElevationFromRasterDEM', () => {
	let mockPoints: GeoJSONStoreFeatures[];

	const terrarium: TerrainSource = {
		url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
		encoding: 'terrarium',
		tileSize: 256,
		minzoom: 5,
		maxzoom: 15,
		tms: false
	};

	const terrainRGB: TerrainSource = {
		url: 'https://wasac.github.io/rw-terrain-webp/tiles/{z}/{x}/{y}.webp',
		encoding: 'mapbox',
		tileSize: 512,
		minzoom: 5,
		maxzoom: 15,
		tms: false
	};

	beforeEach(() => {
		mockPoints = [
			{
				type: 'Feature',
				geometry: {
					type: 'Point',
					coordinates: [30.48535, -2.03089]
				},
				properties: {}
			}
		];
	});

	it('should return points unchanged if no terrainSource is provided', async () => {
		const result = await queryElevationFromRasterDEM(mockPoints);
		expect(result[0]).toEqual(mockPoints[0]);
	});

	it('should add elevation and elevationUnit properties to point features from terrarium when terrainSource is provided (metric)', async () => {
		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			undefined,
			'metric'
		);
		expect(result[0].properties).toHaveProperty('elevation', 150);
		expect(result[0].properties).toHaveProperty('elevationUnit', 'm');
	});

	it('should add elevation and elevationUnit properties to point features from terrainrgb when terrainSource is provided (imperial)', async () => {
		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrainRGB,
			undefined,
			undefined,
			'imperial'
		);
		expect(result[0].properties.elevation).toBeCloseTo(492.126, 3); // 150 meters to feet
		expect(result[0].properties).toHaveProperty('elevationUnit', 'ft');
	});

	it('should not modify non-Point features', async () => {
		const nonPointFeatures: GeoJSONStoreFeatures[] = [
			{
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
			}
		];

		const result = await queryElevationFromRasterDEM(nonPointFeatures, terrarium);
		expect(result[0]).toEqual(nonPointFeatures[0]);
	});
});
