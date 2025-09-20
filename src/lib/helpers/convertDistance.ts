import type { DistanceUnit, DistanceUnitShortName, forceDistanceUnitType } from '../interfaces';

/**
 * Convert distance according to the distance unit given.
 *
 * Converts a distance in kilometers or miles to the appropriate unit based on the `unit` and `forceUnit` parameters.
 * - For `kilometers`, it converts to km, m, or cm depending on the value and `forceUnit`.
 * - For `miles`, it converts to mi, ft, or in depending on the value and `forceUnit`.
 * - For `degrees` or `radians`, it returns the value unchanged with the corresponding unit symbol.
 *
 * @param value - The distance in the unit specified by the `unit` parameter.
 * @param unit - The unit of the input distance type: "degrees", "radians", "miles", or "kilometers" (default is 'kilometers').
 * @param forceUnit - Default is `auto`. If `auto` is set, the unit is converted automatically based on the value. If a specific unit is set, the value is converted to that unit.
 * @returns The converted value and unit.
 */
export const convertDistance = (
	value: number,
	unit: DistanceUnit = 'kilometers',
	forceUnit: forceDistanceUnitType = 'auto'
): { distance: number; unit: DistanceUnitShortName } => {
	// Define metric and imperial units
	const metricUnits = ['cm', 'm', 'km'];
	const imperialUnits = ['in', 'ft', 'mi'];

	// Check if forceUnit matches the selected unit type, otherwise treat as 'auto'
	let effectiveForceUnit = forceUnit;
	if (forceUnit !== 'auto') {
		const isMetricForceUnit = metricUnits.includes(forceUnit);
		const isImperialForceUnit = imperialUnits.includes(forceUnit);

		if (
			(unit === 'kilometers' && !isMetricForceUnit) ||
			(unit === 'miles' && !isImperialForceUnit)
		) {
			effectiveForceUnit = 'auto';
		}
	}

	let result: { distance: number; unit: DistanceUnitShortName } = {
		distance: value,
		unit: 'km'
	};

	if (unit === 'kilometers') {
		result = convertMetricUnit(value, effectiveForceUnit);
	} else if (unit === 'degrees') {
		result.unit = '°';
	} else if (unit === 'miles') {
		result = convertImperialUnit(value, effectiveForceUnit);
	} else if (unit === 'radians') {
		result.unit = 'rad';
	}
	// Default case: return kilometers if unit is not recognized
	return result;
};

const convertMetricUnit = (value: number, unit: forceDistanceUnitType) => {
	let result: { distance: number; unit: DistanceUnitShortName } = {
		distance: value,
		unit: 'km'
	};
	// Convert based on the specified or auto-detected unit
	switch (unit) {
		case 'km':
			result.distance = value;
			result.unit = 'km';
			break;
		case 'm':
			result.distance = value * 1000;
			result.unit = 'm';
			break;
		case 'cm':
			result.distance = value * 100000;
			result.unit = 'cm';
			break;
		case 'auto':
			// if auto, determine the best unit based on the value
			if (value >= 1) {
				result = convertMetricUnit(value, 'km');
			} else if (value * 1000 >= 1) {
				result = convertMetricUnit(value, 'm');
			} else {
				result = convertMetricUnit(value, 'cm');
			}
			break;
		default:
			// km as a fallback
			result.distance = value;
			result.unit = 'km';
			break;
	}
	return result;
};

const convertImperialUnit = (value: number, unit: forceDistanceUnitType) => {
	let result: { distance: number; unit: DistanceUnitShortName } = {
		distance: value,
		unit: 'mi'
	};
	// Convert based on the specified or auto-detected unit
	switch (unit) {
		case 'mi':
			result.distance = value;
			result.unit = 'mi';
			break;
		case 'ft':
			result.distance = value * 5280;
			result.unit = 'ft';
			break;
		case 'in':
			result.distance = value * 63360;
			result.unit = 'in';
			break;
		case 'auto':
			// if auto, determine the best unit based on the value
			if (value >= 1) {
				result = convertImperialUnit(value, 'mi');
			} else if (value * 5280 >= 1) {
				result = convertImperialUnit(value, 'ft');
			} else {
				result = convertImperialUnit(value, 'in');
			}
			break;
		default:
			// mi as a fallback
			result.distance = value;
			result.unit = 'mi';
			break;
	}
	return result;
};
