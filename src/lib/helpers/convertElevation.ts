import { defaultMeasureUnitSymbols } from '../constants';
import type { MeasureUnitSymbolType, MeasureUnitType } from '../interfaces';

/**
 * Convert elevation according to the unit type given.
 *
 * Converts elevation from meters to the appropriate unit based on the `unit` parameter.
 * This function is used to display elevation values in the correct unit based on the 
 * measureUnitType setting in MaplibreMeasureControl.
 * 
 * - For `metric`, returns value in meters with 'm' symbol.
 * - For `imperial`, converts meters to feet using the conversion factor 1 meter = 3.28084 feet.
 *
 * @param value - The elevation value in meters (as returned by terrain queries).
 * @param unit - The unit type: "metric" or "imperial" (default is 'metric').
 * @param measureUnitSymbols - Optional parameter to provide custom unit symbols. Uses defaultMeasureUnitSymbols if not provided.
 * @returns An object containing the converted elevation value and the unit symbol string.
 * 
 * @example
 * ```typescript
 * // Convert 100 meters to metric display
 * const metric = convertElevation(100, 'metric');
 * // Returns: { elevation: 100, unit: 'm' }
 * 
 * // Convert 100 meters to imperial display  
 * const imperial = convertElevation(100, 'imperial');
 * // Returns: { elevation: 328.084, unit: 'ft' }
 * ```
 */
export const convertElevation = (
	value: number,
	unit: MeasureUnitType = 'metric',
	measureUnitSymbols = defaultMeasureUnitSymbols
): { elevation: number; unit: string } => {
	if (unit === 'imperial') {
		// Convert meters to feet (1 meter = 3.28084 feet)
		return {
			elevation: value * 3.28084,
			unit: measureUnitSymbols.foot
		};
	} else {
		// Default to metric (meters)
		return {
			elevation: value,
			unit: measureUnitSymbols.meter
		};
	}
};