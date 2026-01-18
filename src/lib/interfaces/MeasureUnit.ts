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
 * The callback type for custom distance unit conversion
 * @param valueInMeter The distance value in meters
 * @returns The converted value and unit.
 * @example
 * const customConversion: DistanceUnitCallBackType = (valueInMeter) => {
 *     if (valueInMeter >= 1000) {
 *         return { distance: valueInMeter / 1000, unit: 'km' };
 *     } else {
 *         return { distance: valueInMeter, unit: 'm' };
 *     }
 * };
 */
export type DistanceUnitCallBackType = (valueInMeter: number) => { distance: number; unit: string };

/**
 * The type definition of forceDistanceUnitType
 *
 * If undefined is set, it will be treated as 'auto' conversion of distance unit accoding the following rules.
 * - For metric:
 *   - Values >= 1000m are converted to kilometers
 *   - Values >= 1m are kept as meters
 *   - Values < 1m are converted to centimeters
 * - For imperial:
 *   - Values >= 5280ft (1 mile) are converted to miles
 *   - Values >= 1ft are kept as feet
 *   - Values < 1ft are converted to inches
 *
 * If a specific unit is set, the value is converted to that unit.
 */
export type forceDistanceUnitType =
	| DistanceUnitCallBackType
	| MetricDistanceUnit
	| ImperialDistanceUnit
	| undefined;

/**
 * Elevation unit types for metric
 */
export type MetricElevationUnit = 'meter';

/**
 * Elevation unit types for imperial
 */
export type ImperialElevationUnit = 'foot';

/**
 * Type definition for measure unit symbols
 */
export type MeasureUnitSymbolType = Record<
	| MetricDistanceUnit
	| ImperialDistanceUnit
	| MetricAreaUnit
	| ImperialAreaUnit
	| MetricElevationUnit
	| ImperialElevationUnit,
	string
>;
