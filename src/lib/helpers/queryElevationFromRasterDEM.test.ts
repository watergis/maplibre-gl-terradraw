import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryElevationFromRasterDEM } from './queryElevationFromRasterDEM';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import type { TerrainSource } from '../interfaces';
import type { CacheInterface } from './memoryCache';

// Mock the terrain classes as constructors for Vitest v4
const mockedModule = vi.hoisted(() => ({
	TerrainRGB: vi.fn(function TerrainRGB() {
		return {
			getElevation: vi.fn().mockResolvedValue(150)
		};
	}),
	Terrarium: vi.fn(function Terrarium() {
		return {
			getElevation: vi.fn().mockResolvedValue(150)
		};
	})
}));

vi.mock('@watergis/terrain-rgb', () => mockedModule);

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
		vi.clearAllMocks();

		// Reset terrain mocks to default behavior
		mockedModule.TerrainRGB.mockImplementation(function TerrainRGB() {
			return {
				getElevation: vi.fn().mockResolvedValue(150)
			};
		});

		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue(150)
			};
		});

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

	it('should use cached elevation value when available', async () => {
		const mockCache: CacheInterface<number> = {
			get: vi.fn().mockReturnValue(200),
			set: vi.fn(),
			has: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
			size: 1
		};

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			mockCache,
			'metric'
		);

		expect(result[0].properties).toHaveProperty('elevation', 200);
		expect(result[0].properties).toHaveProperty('elevationUnit', 'm');
		expect(mockCache.get).toHaveBeenCalled();
	});

	it('should skip cached NaN elevation values', async () => {
		const mockCache: CacheInterface<number> = {
			get: vi.fn().mockReturnValue(NaN),
			set: vi.fn(),
			has: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
			size: 1
		};

		// Reset the terrain mock to default behavior
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue(150)
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			mockCache,
			'metric'
		);

		// Should skip NaN cached value and not set elevation (returns early)
		expect(result[0].properties).not.toHaveProperty('elevation');
		expect(mockCache.get).toHaveBeenCalled();
	});

	it('should handle getElevation rejection and clean up cache', async () => {
		const mockCache: CacheInterface<number> = {
			get: vi.fn().mockReturnValue(undefined),
			set: vi.fn(),
			has: vi.fn().mockReturnValue(true),
			delete: vi.fn(),
			clear: vi.fn(),
			size: 1
		};

		// Mock terrain instance to reject the promise
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockRejectedValue(new Error('Network error'))
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			mockCache,
			'metric'
		);

		expect(result[0].properties).not.toHaveProperty('elevation');
		expect(mockCache.has).toHaveBeenCalled();
		expect(mockCache.delete).toHaveBeenCalled();
	});

	it('should handle invalid elevation values from getElevation', async () => {
		// Mock terrain instance to return null
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue(null)
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			undefined,
			'metric'
		);

		expect(result[0].properties).not.toHaveProperty('elevation');
	});

	it('should handle elevation values that are undefined', async () => {
		// Mock terrain instance to return undefined
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue(undefined)
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			undefined,
			'metric'
		);

		expect(result[0].properties).not.toHaveProperty('elevation');
	});

	it('should handle elevation values that are not numbers', async () => {
		// Mock terrain instance to return a string instead of number
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue('invalid' as unknown as number)
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			undefined,
			'metric'
		);

		expect(result[0].properties).not.toHaveProperty('elevation');
	});

	it('should cache elevation values after successful retrieval', async () => {
		const mockCache: CacheInterface<number> = {
			get: vi.fn().mockReturnValue(undefined),
			set: vi.fn(),
			has: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
			size: 1
		};

		// Mock terrain instance to return valid elevation
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue(300)
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			mockCache,
			'metric'
		);

		expect(result[0].properties).toHaveProperty('elevation', 300);
		expect(result[0].properties).toHaveProperty('elevationUnit', 'm');
		expect(mockCache.set).toHaveBeenCalledWith(expect.any(String), 300);
	});

	it('should handle missing cache but available terrain instance', async () => {
		// Test the path where cache doesn't find a value, but terrain instance succeeds
		const mockCache: CacheInterface<number> = {
			get: vi.fn().mockReturnValue(undefined), // Cache miss
			set: vi.fn(),
			has: vi.fn(),
			delete: vi.fn(),
			clear: vi.fn(),
			size: 1
		};

		// Mock terrain instance to return valid elevation
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockResolvedValue(250)
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			mockCache,
			'imperial'
		);

		// Should get elevation from terrain instance and cache it
		expect(result[0].properties.elevation).toBeCloseTo(820.21, 2); // 250 meters to feet
		expect(result[0].properties).toHaveProperty('elevationUnit', 'ft');
		expect(mockCache.set).toHaveBeenCalledWith(expect.any(String), 250);
	});

	it('should handle getElevation rejection without cache', async () => {
		// Mock terrain instance to reject the promise without cache
		mockedModule.Terrarium.mockImplementation(function Terrarium() {
			return {
				getElevation: vi.fn().mockRejectedValue(new Error('Network error'))
			};
		});

		const result = await queryElevationFromRasterDEM(
			mockPoints,
			terrarium,
			undefined,
			undefined, // No cache
			'metric'
		);

		expect(result[0].properties).not.toHaveProperty('elevation');
	});
});
