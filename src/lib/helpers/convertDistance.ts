import { defaultMeasureUnitSymbols } from '../constants';
import type { forceDistanceUnitType, MeasureUnitSymbolType, MeasureUnitType } from '../interfaces';

/**
 * Convert distance according to the distance unit given.
 *
 * Converts a distance in kilometers or miles to the appropriate unit based on the `unit` and `forceUnit` parameters.
 * - For `kilometers`, it converts to km, m, or cm depending on the value and `forceUnit`.
 * - For `miles`, it converts to mi, ft, or in depending on the value and `forceUnit`.
 * - For `degrees` or `radians`, it returns the value unchanged with the corresponding unit symbol.
 *
 * @param value - The distance in the unit specified by the `unit` parameter.
 * @param unit - The unit of the input distance type: "metric", or "imperial" (default is 'metric').
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

	// Check if forceUnit matches the selected unit type, otherwise treat as 'auto'
	let effectiveForceUnit = forceUnit;
	if (forceUnit !== 'auto') {
		const isMetricForceUnit = metricUnits.includes(forceUnit);
		const isImperialForceUnit = imperialUnits.includes(forceUnit);

		if (
			(unit === 'metric' && !isMetricForceUnit) ||
			(unit === 'imperial' && !isImperialForceUnit)
		) {
			effectiveForceUnit = 'auto';
		}
	}

	let result: { distance: number; unit: string } = {
		distance: value,
		unit: measureUnitSymbols['kilometer']
	};

	if (unit === 'metric') {
		result = convertMetricUnit(value, effectiveForceUnit, measureUnitSymbols);
	} else if (unit === 'imperial') {
		result = convertImperialUnit(value, effectiveForceUnit, measureUnitSymbols);
	}
	// Default case: return kilometers if unit is not recognized
	return result;
};

const convertMetricUnit = (
	value: number,
	unit: forceDistanceUnitType,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	let result: { distance: number; unit: string } = {
		distance: value,
		unit: measureUnitSymbols['kilometer']
	};
	// Convert based on the specified or auto-detected unit
	switch (unit) {
		case 'meter':
			result.distance = value * 1000;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'centimeter':
			result.distance = value * 100000;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'auto':
			// if auto, determine the best unit based on the value
			if (value >= 1) {
				result = convertMetricUnit(value, 'kilometer', measureUnitSymbols);
			} else if (value * 1000 >= 1) {
				result = convertMetricUnit(value, 'meter', measureUnitSymbols);
			} else {
				result = convertMetricUnit(value, 'centimeter', measureUnitSymbols);
			}
			break;
		case 'kilometer':
		default:
			// km as a fallback
			result.distance = value;
			result.unit = measureUnitSymbols['kilometer'];
			break;
	}
	return result;
};

const convertImperialUnit = (
	value: number,
	unit: forceDistanceUnitType,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	let result: { distance: number; unit: string } = {
		distance: value,
		unit: measureUnitSymbols['mile']
	};
	// Convert based on the specified or auto-detected unit
	switch (unit) {
		case 'foot':
			result.distance = value * 5280;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'inch':
			result.distance = value * 63360;
			result.unit = measureUnitSymbols[unit];
			break;
		case 'auto':
			// if auto, determine the best unit based on the value
			if (value >= 1) {
				result = convertImperialUnit(value, 'mile', measureUnitSymbols);
			} else if (value * 5280 >= 1) {
				result = convertImperialUnit(value, 'foot', measureUnitSymbols);
			} else {
				result = convertImperialUnit(value, 'inch', measureUnitSymbols);
			}
			break;
		case 'mile':
		default:
			// mile as a fallback
			result.distance = value;
			result.unit = measureUnitSymbols['mile'];
			break;
	}
	return result;
};
