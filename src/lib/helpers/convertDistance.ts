import type { DistanceUnit, DistanceUnitShortName, forceDistanceUnitType } from '../interfaces';

/**
 * Convert distance according to the distance unit given.
 *
 * Converts a distance in kilometers to the appropriate unit (km, m, or cm) if distanceUnit is "kilometers".
 * - If the value is 1 km or more, it returns the value in kilometers.
 * - If the value is less than 1 km but 1 meter or more, it returns the value in meters.
 * - If the value is less than 1 meter, it returns the value in centimeters.
 *
 * If distanceUnit is "degrees", "radians", or "miles", it returns the value unchanged with the corresponding unit symbol.
 *
 * @param value - The distance in the unit specified by the `unit` parameter.
 * @param unit - The unit of the input distance type either "degrees" or "radians" or "miles" or "kilometers" (default is 'kilometers').
 * @param forceUnit Default is `auto`. If `auto` is set, unit is converted depending on the value in metric. If DistanceUnit is set to other than 'kilometers', it will be ignored, and `auto` will be applied.
 */
export const convertDistance = (
	value: number,
	unit: DistanceUnit = 'kilometers',
	forceUnit: forceDistanceUnitType = 'auto'
): { distance: number; unit: DistanceUnitShortName } => {
	// Define metric and imperial units
	const metricUnits = ['cm', 'm', 'km'];

	// Check if forceUnit matches the selected unit type, otherwise treat as 'auto'
	let effectiveForceUnit = forceUnit;
	if (forceUnit !== 'auto') {
		const isMetricForceUnit = metricUnits.includes(forceUnit);

		if (unit === 'kilometers' && !isMetricForceUnit) {
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
		result.unit = 'mi';
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
