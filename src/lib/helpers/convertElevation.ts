import { defaultMeasureUnitSymbols } from '../constants';
import type { MeasureUnitSymbolType, MeasureUnitType } from '../interfaces';

/**
 * Convert elevation according to the unit type given.
 *
 * Converts elevation from meters to the appropriate unit based on the `unit` parameter.
 * - For `metric`, returns value in meters with 'm' symbol.
 * - For `imperial`, converts meters to feet with 'ft' symbol.
 *
 * @param value - The elevation value in meters.
 * @param unit - The unit type: "metric" or "imperial" (default is 'metric').
 * @param measureUnitSymbols - Optional parameter to provide custom unit symbols
 * @returns The converted value and unit symbol.
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