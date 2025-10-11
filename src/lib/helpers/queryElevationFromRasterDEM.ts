import type { ElevationCacheConfig, TerrainSource, MeasureUnitType, MeasureUnitSymbolType } from '../interfaces';
import { TerrainRGB, Terrarium } from '@watergis/terrain-rgb';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { MemoryCache, type CacheInterface } from './memoryCache';
import { convertElevation } from './convertElevation';
import { defaultMeasureUnitSymbols } from '../constants';

/**
 * Convert coordinates to string key
 */
const coordinateToKey = (coordinates: number[], precision = 8): string => {
	const [lng, lat] = coordinates;
	const factor = Math.pow(10, precision);
	const roundedLng = Math.round(lng * factor) / factor;
	const roundedLat = Math.round(lat * factor) / factor;
	return `${roundedLng},${roundedLat}`;
};

/**
 * Query elvation for point features from Raster DEM
 * @param points Point GeoJSON features
 * @param terrainDource terrain source for computing elevation from raster DEM
 * @param cacheConfig cache configuration for elevation values
 * @param cacheInstance optional cache instance
 * @param measureUnitType The unit type for elevation display (metric or imperial)
 * @param measureUnitSymbols Optional custom unit symbols
 * @returns points features after adding elevation property
 */
export const queryElevationFromRasterDEM = async (
	points: GeoJSONStoreFeatures[],
	terrainDource?: TerrainSource,
	cacheConfig?: ElevationCacheConfig,
	cacheInstance?: CacheInterface<number>,
	measureUnitType: MeasureUnitType = 'metric',
	measureUnitSymbols: MeasureUnitSymbolType = defaultMeasureUnitSymbols
) => {
	const promises: Promise<GeoJSONStoreFeatures>[] = [];

	// Default values for cache configuration
	const config: ElevationCacheConfig = {
		enabled: true,
		maxSize: 1000,
		ttl: 60 * 60 * 1000, // 1 hour
		precision: 6,
		...cacheConfig
	};

	// Initialize cache instance
	let cache: CacheInterface<number> | undefined;
	if (config.enabled) {
		cache = cacheInstance || new MemoryCache<number>(config.maxSize, config.ttl);
	}

	let terrainInstance: TerrainRGB | Terrarium | undefined = undefined;
	let maxzoom = 15;
	if (terrainDource) {
		const url = terrainDource.url;
		const encoding = terrainDource.encoding ?? 'mapbox';
		const tileSize = terrainDource.tileSize ?? 512;
		const minzoom = terrainDource.minzoom ?? 5;
		maxzoom = terrainDource.maxzoom ?? 15;
		const tms = terrainDource.tms ?? false;
		terrainInstance =
			encoding === 'mapbox'
				? new TerrainRGB(url, tileSize, minzoom, maxzoom, tms)
				: new Terrarium(url, tileSize, minzoom, maxzoom, tms);
	}

	for (const point of points) {
		promises.push(
			new Promise((resolve: (feature: GeoJSONStoreFeatures) => void) => {
				if (point.geometry.type !== 'Point') resolve(point);

				const coordinates = point.geometry.coordinates as number[];
				const cacheKey = coordinateToKey(coordinates, config.precision);
				if (cache) {
					const cachedElevation = cache.get(cacheKey);
					if (cachedElevation !== undefined) {
						if (!isNaN(cachedElevation)) {
							const { elevation, unit } = convertElevation(cachedElevation, measureUnitType, measureUnitSymbols);
							point.properties.elevation = elevation;
							point.properties.elevationUnit = unit;
						}
						resolve(point);
						return;
					}
				}

				if (terrainInstance) {
					terrainInstance
						.getElevation(point.geometry.coordinates as number[], maxzoom)
						.then((elevationInMeters) => {
							if (elevationInMeters !== undefined && elevationInMeters !== null && typeof elevationInMeters === 'number') {
								if (cache) {
									cache.set(cacheKey, elevationInMeters);
								}
								const { elevation, unit } = convertElevation(elevationInMeters, measureUnitType, measureUnitSymbols);
								point.properties.elevation = elevation;
								point.properties.elevationUnit = unit;
							}
							resolve(point);
						})
						.catch(() => {
							if (cache && cache.has(cacheKey)) {
								cache.delete(cacheKey);
							}
							resolve(point);
						});
				} else {
					resolve(point);
				}
			})
		);
	}
	return await Promise.all(promises);
};
