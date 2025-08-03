import type { TerrainSource } from '../interfaces';
import { TerrainRGB, Terrarium } from '@watergis/terrain-rgb';
import type { GeoJSONStoreFeatures } from 'terra-draw';

/**
 * Query elvation for point features from Raster DEM
 * @param points Point GeoJSON features
 * @returns points features after adding elevation property
 */
export const queryElevationFromRasterDEM = async (
	points: GeoJSONStoreFeatures[],
	terrainDource?: TerrainSource
) => {
	const promises: Promise<GeoJSONStoreFeatures>[] = [];

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
				if (terrainInstance) {
					terrainInstance
						.getElevation(point.geometry.coordinates as number[], maxzoom)
						.then((elevation) => {
							if (elevation) point.properties.elevation = elevation;
							resolve(point);
						})
						.catch(() => resolve(point));
				} else {
					resolve(point);
				}
			})
		);
	}
	return await Promise.all(promises);
};
