/**
 * Terrain source either terrain RGB or terrarium formats for computing elevation
 */
export interface TerrainSource {
	/**
	 * URL for terrain RGB or terrarium raster tilesets.
	 *
	 * For example, URL should be like the below.
	 * https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
	 */
	url: string;

	/**
	 * The encoding used by this source. Mapbox Terrain RGB is used by default.
	 *
	 * `terrarium`: Terrarium format PNG tiles. See https://aws.amazon.com/es/public-datasets/terrain/ for more info.
	 * `mapbox`: Mapbox Terrain RGB tiles. See https://www.mapbox.com/help/access-elevation-data/#mapbox-terrain-rgb for more info.
	 */
	encoding?: 'terrarium' | 'mapbox';

	/**
	 * size of tile. 256 or 512. Defaults to 512.
	 */
	tileSize?: 256 | 512;
	/**
	 * minzoom for terrain RGB raster tilesets. default is 5
	 */
	minzoom?: number;
	/**
	 * maxzoom for terrain RGB raster tilesets. default is 15
	 */
	maxzoom?: number;
	/**
	 * whether it is Tile Map Service. Default is false
	 */
	tms?: boolean;
}
