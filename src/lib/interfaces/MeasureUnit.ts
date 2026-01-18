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
 * The callback type for custom area unit conversion
 * @param valueInSquareMeters The area value in square meters
 * @returns The converted value and unit.
 * @example
 * const customConversion: AreaUnitCallBackType = (valueInSquareMeters) => {
 *     if (valueInSquareMeters >= 1000) {
 *         return { area: valueInSquareMeters / 1000, unit: 'km²' };
 *     } else {
 *         return { area: valueInSquareMeters, unit: 'm²' };
 *     }
 * };
 */
export type AreaUnitCallBackType = (valueInSquareMeters: number) => { area: number; unit: string };

/**
 * The type definition of areaUnitType
 *
 * If undefined is set, it will be treated as 'auto' conversion of area unit accoding the following rules.
 * - For metric:
 *  - Values >= 1,000,000 m² are converted to km²
 * - Values >= 10,000 m² are converted to hectares
 * - Values >= 100 m² are converted to ares
 * - Values < 100 m² are kept as m²
 *
 * - For imperial:
 *  - Values >= 2,589,988.11 m² are converted to mi²
 * - Values >= 4,046.856 m² are converted to acres
 * - Values >= 0.83612736 m² are converted to yd²
 * - Values < 0.83612736 m² are converted to ft²
 *
 * If a specific unit is set, the value is converted to that unit.
 */
export type areaUnitType = AreaUnitCallBackType | MetricAreaUnit | ImperialAreaUnit | undefined;

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
 * The type definition of distanceUnitType
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
export type distanceUnitType =
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
