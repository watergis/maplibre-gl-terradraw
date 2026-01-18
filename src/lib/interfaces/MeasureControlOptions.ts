import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { ModeOptions } from './ModeOptions';
import type {
	distanceUnitType,
	ImperialAreaUnit,
	ImperialDistanceUnit,
	MetricAreaUnit,
	MetricDistanceUnit
} from './MeasureUnit';
import type { MeasureUnitType, areaUnitType } from './MeasureUnit';
import type { TerradrawMode } from './TerradrawMode';
import type { TerrainSource } from './TerrainSource';
import type { ElevationCacheConfig } from './ElevationCacheConfig';
import type { TerraDrawMapLibreGLAdapterConfig } from './TerradrawControlOptions';

/**
 * MeasureControl Plugin control constructor options
 */
export interface MeasureControlOptions {
	/**
	 * Terradraw modes added to the control.
	 * The mode will be added in the same order of the array.
	 * Default is all modes in the below order:
	 * ['render','point','linestring','polygon', 'rectangle','angled-rectangle','circle', 'freehand','sector','sensor', 'delete']
	 *
	 * You can change the order of modes, or can get rid of some modes which you don't need for your app.
	 */
	modes?: TerradrawMode[];
	/**
	 * Open editor as default if true. Default is false
	 */
	open?: boolean;

	/**
	 * Overwrite Terra Draw mode options if you specified.
	 */
	modeOptions?: ModeOptions;

	/**
	 * TerraDrawMaplibreGLAdapter options. Please refer the default adapter settings (BaseAdapterConfig) at the below TerraDraw code.
	 * https://github.com/JamesLMilner/terra-draw/blob/806e319d5680a3f69edeff7dd629da3f1b4ff9bf/src/adapters/common/base.adapter.ts#L28-L48
	 */
	adapterOptions?: TerraDrawMapLibreGLAdapterConfig;

	/**
	 * Show delete confirmation popup when deleting features if true. Default is false
	 */
	showDeleteConfirmation?: boolean;

	/**
	 * Maplibre symbol layer specification (on points) for point layer
	 */
	pointLayerLabelSpec?: SymbolLayerSpecification;

	/**
	 * Maplibre symbol layer specification (on line nodes) for line distance layer
	 */
	lineLayerLabelSpec?: SymbolLayerSpecification;

	/**
	 * Maplibre circle layer specification for visualizing node style of line distance layer
	 */
	routingLineLayerNodeSpec?: CircleLayerSpecification;

	/**
	 * Maplibre symbol layer specification (centroid) for polygon area layer
	 */
	polygonLayerSpec?: SymbolLayerSpecification;

	/**
	 * The unit of measurement can be metric or imperial. Default is metric
	 */
	measureUnitType?: MeasureUnitType;

	/**
	 * The precision of distance value. It will be set different value dwhen distance unit is changed. Using setter to override the value if you want.
	 */
	distancePrecision?: number;

	/**
	 * Default is undefined. If undefined is set, the unit is converted automatically based on the value.
	 *
	 * For metric system:
	 * - Values >= 1000m are converted to kilometers
	 * - Values >= 1m are kept as meters
	 * - Values < 1m are converted to centimeters
	 *
	 * For imperial system:
	 * - Values >= 5280ft (1 mile) are converted to miles
	 * - Values >= 1ft are kept as feet
	 * - Values < 1ft are converted to inches
	 *
	 * If a specific unit is specified (e.g., 'km', 'm', 'cm', 'mi', 'ft', 'in'),
	 * the value is always returned in that unit.
	 *
	 * Custom conversion function can be also set to this property.
	 * The function receives the distance value in meters and should return an object with `distance` and `unit` properties.
	 * An example of custom conversion function:
	 * ```ts
	 * const customConversion: DistanceUnitCallBackType = (valueInMeter) => {
	 *    if (valueInMeter >= 1000) {
	 * 	  return { distance: valueInMeter / 1000, unit: 'km' };
	 *   } else {
	 * 	return { distance: valueInMeter, unit: 'm' };
	 *  };
	 * };
	 * control.distanceUnit = customConversion;
	 * ```
	 */
	distanceUnit?: distanceUnitType;

	/**
	 * The precision of area value. Using setter to override the value if you want.
	 */
	areaPrecision?: number;

	/**
	 * Default is undefined. If undefined is set,the unit is converted automatically based on the value.
	 *
	 * For metric system:
	 * - Values >= 1,000,000m² are converted to square kilometers
	 * - Values >= 10,000m² are converted to hectares
	 * - Values >= 100m² are converted to ares
	 * - Values < 100m² are kept as square meters
	 *
	 * For imperial system:
	 * - Values >= 2,589,988.11m² (1 square mile) are converted to square miles
	 * - Values >= 4,046.856m² (1 acre) are converted to acres
	 * - Values >= 0.83612736m² (1 square yard) are converted to square yards
	 * - Values < 0.83612736m² are converted to square feet
	 *
	 * If a specific unit is specified (e.g., 'square meters', 'square kilometers', 'ares', 'hectares',
	 * 'square feet', 'square yards', 'acres', 'square miles'), the value is always returned in that unit.
	 *
	 * Custom conversion function can be also set to this property.
	 * The function receives the area value in square meters and should return an object with `area` and `unit` properties.
	 *
	 * An example of custom conversion function:
	 * 	```ts
	 * const customConversion: AreaUnitCallBackType = (valueInSquareMeters) => {
	 *    if (valueInSquareMeters >= 1000) {
	 * 	  return { area: valueInSquareMeters / 1000, unit: 'km²' };
	 *  } else {
	 * 	return { area: valueInSquareMeters, unit: 'm²' };
	 * };
	 * control.areaUnit = customConversion;
	 * ```
	 */
	areaUnit?: areaUnitType;

	/**
	 * Measure unit symbols. If you want to change the default symbol, please overwrite the symbol by this option.
	 */
	measureUnitSymbols?: Record<
		MetricDistanceUnit | ImperialDistanceUnit | MetricAreaUnit | ImperialAreaUnit,
		string
	>;

	/**
	 * Compute elevation for each node in linestring measure mode.
	 * This is an optional parameter and default is False. If true, the property of `elevation` is added to TerraDraw feature.
	 * As default, an elevation is not shown in label if it is negative value (The data is added to the feature property though).
	 * If you wish to show negative value of altitude, you may need to edit your own `lineLayerLabelSpec` style spec.
	 *
	 * If terrainSource is set, this feature uses `queryTerrainElevation` function of maplibre-gl, thus you have to add and enable raster-dem source in maplibre style in advance.
	 *
	 * For instance, the below code is to add Terrarium source from [AWS](https://registry.opendata.aws/terrain-tiles/)
	 * ```
	 * map?.addSource('terrarium', {
	 *   type: 'raster-dem',
	 *   attribution: '&copy; <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Tilezen Joerd</a>',
	 *   tiles: [
	 *     'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
	 *   ],
	 *   minzoom:0, maxzoom: 5, tileSize: 256,
	 *   encoding: 'terrarium',
	 *   bounds: [-180, -90, 180, 90]
	 * })
	 * map?.setTerrain({source: 'terrarium', exaggeration: 1})
	 * ```
	 *
	 * The plugin control is just querying elevation from maplibre style's DEM source.
	 * Hence, the elevation's accuracy may not be good and queried elevation might be different each zoom level.
	 *
	 * If terrainSource is set to use either terrainRGB or terrarium source, the plugin will try to fetch elevation directly from DEM tiles.
	 */
	computeElevation?: boolean;

	/**
	 * terrain source either terrain RGB or terrarium formats for computing elevation
	 * If undefined is set to this option, the plugin tries to fetch elevation enabled terrain of maplibre.
	 * As default, terrarium source from AWS is set.
	 */
	terrainSource?: TerrainSource;

	/**
	 * Elevation cache configuration.
	 * If undefined is set to this option, the plugin uses default cache configuration.
	 * Default is enabled with maxSize 1000, ttl 1 hour, and precision 9.
	 * If you want to disable elevation cache, set `enabled` to false.
	 *
	 * Note: If you disable elevation cache, the plugin will query elevation from DEM tiles every time when you measure linestring even if the same coordinates appear repeatedly. This may make the response slow.
	 */
	elevationCacheConfig?: ElevationCacheConfig;
}
