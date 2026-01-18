import { defaultMeasureUnitSymbols } from '../constants';
import type { forceDistanceUnitType, MeasureUnitSymbolType, MeasureUnitType } from '../interfaces';

/**
 * Convert distance according to the distance unit given.
 *
 * Converts a distance in meters to the appropriate unit based on the `unit` and `forceUnit` parameters.
 * - For `metric`, it converts to km, m, or cm depending on the value and `forceUnit`.
 * - For `imperial`, it converts to mi, ft, or in depending on the value and `forceUnit`.
 *
 * @param value - The distance in meters.
 * @param unit - The unit system for output: "metric" or "imperial" (default is 'metric').
 * @param forceUnit - Default is `auto`. If `auto` is set, the unit is converted automatically based on the value. If a specific unit is set, the value is converted to that unit.
 * @param measureUnitSymbols Optional parameter to provide custom unit symbols
 * @returns The converted value and unit.
 */
export const convertDistance = (
	value: number,
	unit: MeasureUnitType = 'metric',
	forceUnit: forceDistanceUnitType = 'auto',
	measureUnitSymbols = defaultMeasureUnitSymbols
): { distance: number; unit: string } => {
	// Define metric and imperial units
	const metricUnits = ['centimeter', 'meter', 'kilometer'];
	const imperialUnits = ['inch', 'foot', 'mile'];

	let result: { distance: number; unit: string } = {
		distance: value,
		unit: measureUnitSymbols['meter']
	};

	// If forceUnit is specified (not 'auto'), use it regardless of unit parameter
	if (forceUnit !== 'auto') {
		const isMetricForceUnit = metricUnits.includes(forceUnit);
		const isImperialForceUnit = imperialUnits.includes(forceUnit);

		if (isMetricForceUnit) {
			result = convertMetricUnit(value, forceUnit, measureUnitSymbols);
		} else if (isImperialForceUnit) {
			result = convertImperialUnit(value, forceUnit, measureUnitSymbols);
		}
	} else {
		// If forceUnit is 'auto', use the unit parameter to determine the unit system
		if (unit === 'metric') {
			result = convertMetricUnit(value, 'auto', measureUnitSymbols);
		} else if (unit === 'imperial') {
			result = convertImperialUnit(value, 'auto', measureUnitSymbols);
		}
	}
	// Default case: return meters if unit is not recognized
	return result;
};

const convertMetricUnit = (
	value: number,
	unit: forceDistanceUnitType,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	let result: { distance: number; unit: string } = {
		distance: value,
		unit: measureUnitSymbols['meter']
	};
	// Convert based on the specified or auto-detected unit
	// Input value is in meters
	switch (unit) {
		case 'meter':
			result.distance = value;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'centimeter':
			result.distance = value * 100;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'kilometer':
			result.distance = value / 1000;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'auto':
			// if auto, determine the best unit based on the value
			if (value >= 1000) {
				result = convertMetricUnit(value, 'kilometer', measureUnitSymbols);
			} else if (value >= 1) {
				result = convertMetricUnit(value, 'meter', measureUnitSymbols);
			} else {
				result = convertMetricUnit(value, 'centimeter', measureUnitSymbols);
			}
			break;
		default:
			// meter as a fallback
			result.distance = value;
			result.unit = measureUnitSymbols['meter'];
			break;
	}
	return result;
};

const convertImperialUnit = (
	value: number,
	unit: forceDistanceUnitType,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	// Convert meters to feet first (1 meter = 3.28084 feet)
	// Round to 1 decimal place to avoid floating point precision issues
	const valueInFeet = Math.round(value * 3.28084 * 10) / 10;

	let result: { distance: number; unit: string } = {
		distance: valueInFeet / 5280,
		unit: measureUnitSymbols['mile']
	};
	// Convert based on the specified or auto-detected unit
	switch (unit) {
		case 'foot':
			result.distance = valueInFeet;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'inch':
			result.distance = valueInFeet * 12;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'auto':
			// if auto, determine the best unit based on the value in feet
			if (valueInFeet >= 5280) {
				result = convertImperialUnit(value, 'mile', measureUnitSymbols);
			} else if (valueInFeet >= 1) {
				result = convertImperialUnit(value, 'foot', measureUnitSymbols);
			} else {
				result = convertImperialUnit(value, 'inch', measureUnitSymbols);
			}
			break;
		case 'mile':
		default:
			// mile as a fallback
			result.distance = valueInFeet / 5280;
			result.unit = measureUnitSymbols['mile'];
			break;
	}
	return result;
};
