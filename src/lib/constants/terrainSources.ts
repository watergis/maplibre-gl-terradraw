import type { TerrainSource } from '../interfaces';

/**
 * AWS Terrarium terrain RGB tileset as a terrain source for MaplibreMeasureControl.
 *
 * You can import this and set to `terrainSource` property of MeasureControlOptions like below.
 *
 * ```ts
 * import { AWS_ELEVATION_TILES, MaplibreMeasureControl } from 'maplibre-gl-terradraw';
 *
 * const control = new MaplibreMeasureControl({
 *     terrainSource: AWS_ELEVATION_TILES
 * });
 * ```
 *
 * Please see: https://registry.opendata.aws/terrain-tiles/
 */
export const AWS_ELEVATION_TILES: TerrainSource = {
	url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
	encoding: 'terrarium',
	tileSize: 256,
	minzoom: 5,
	maxzoom: 15,
	tms: false
};

/**
 * Mapterhorn terrarium terrain RGB tileset as a terrain source for MaplibreMeasureControl.
 *
 * As default, maxzoom is set to 12 to access global elevation tiles.
 * However, you can set maxzoom to higher value depending on where your application is used.
 * For example, if your application is used for Japan, maxzoom can be set to 16 to access more precise elevation data.
 *
 * You can import this and set to `terrainSource` property of MeasureControlOptions like below.
 *
 * ```ts
 * import { MAPTERHORM_TILES, MaplibreMeasureControl } from 'maplibre-gl-terradraw';
 *
 * const control = new MaplibreMeasureControl({
 *     terrainSource: MAPTERHORM_TILES
 * });
 * ```
 *
 * Please see: https://mapterhorn.com/data-access/
 */
export const MAPTERHORM_TILES: TerrainSource = {
	url: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
	encoding: 'terrarium',
	tileSize: 512,
	minzoom: 0,
	maxzoom: 12,
	tms: false
};
