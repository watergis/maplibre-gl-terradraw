/**
 * The unit of measurement can be metric or imperial
 */
export type MeasureUnitType = 'metric' | 'imperial';

/**
 * The area unit type for metric
 */
export type MetricAreaUnit = 'square meters' | 'square kilometers' | 'ares' | 'hectares';

/**
 * The area unit type for imperial
 */
export type ImperialAreaUnit = 'square feet' | 'square yards' | 'acres' | 'square miles';

/**
 * The type definition of forceAreaUnitType
 */
export type forceAreaUnitType = 'auto' | MetricAreaUnit | ImperialAreaUnit;

/**
 * Short names for distance units in metric
 */
export type MetricDistanceUnit = 'kilometer' | 'meter' | 'centimeter';

/**
 * Short names for distance units in imperial
 */
export type ImperialDistanceUnit = 'mile' | 'foot' | 'inch';

/**
 * The type definition of forceDistanceUnitType
 * Currently only metric and imperial unit short names are supported. If you need other unit type, please use DistanceUnit property.
 */
export type forceDistanceUnitType = 'auto' | MetricDistanceUnit | ImperialDistanceUnit;

/**
 * Type definition for measure unit symbols
 */
export type MeasureUnitSymbolType = Record<
	MetricDistanceUnit | ImperialDistanceUnit | MetricAreaUnit | ImperialAreaUnit,
	string
>;
