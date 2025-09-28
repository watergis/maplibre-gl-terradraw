/**
 * The unit of measurement can be metric or imperial
 */
export type MeasureUnitType = 'metric' | 'imperial';

/**
 * The area unit type for metric
 */
export type metricAreaUnit = 'm2' | 'km2' | 'a' | 'ha';

/**
 * The area unit type for imperial
 */
export type imperialAreaUnit = 'ft2' | 'yd2' | 'acre' | 'mi2';

/**
 * The type definition of forceAreaUnitType
 */
export type forceAreaUnitType = 'auto' | metricAreaUnit | imperialAreaUnit;

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
