/**
 * The unit of distance can be degrees, radians, miles, or kilometers (default 'kilometers')
 * See https://turfjs.org/docs/api/distance for more details
 */
export type DistanceUnit = 'degrees' | 'radians' | 'miles' | 'kilometers';

/**
 * Short names for distance units in metric
 */
export type MetricDistanceUnit = 'km' | 'm' | 'cm';

/**
 * Short names for distance units in imperial
 */
export type ImperialDistanceUnit = 'mi' | 'ft' | 'in';

/**
 * Short names for all distance units in metric, degrees, miles, and radians
 */
export type DistanceUnitShortName = MetricDistanceUnit | ImperialDistanceUnit | '°' | 'mi' | 'rad';

/**
 * The type definition of forceDistanceUnitType
 * Currently only metric and imperial unit short names are supported. If you need other unit type, please use DistanceUnit property.
 */
export type forceDistanceUnitType = 'auto' | MetricDistanceUnit | ImperialDistanceUnit;
