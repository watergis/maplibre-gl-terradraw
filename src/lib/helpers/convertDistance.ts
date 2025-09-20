import type { DistanceUnit, DistanceUnitName } from '$lib/interfaces/DistanceUnit';

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
 * @param distance - The distance in kilometers.
 * @param distanceUnit - The unit of the input distance type either "degrees" or "radians" or "miles" or "kilometers" (default is 'kilometers').
 * @returns the converted value and unit.
 */
export const convertDistance = (
	distance: number,
	distanceUnit: DistanceUnit = 'kilometers'
): { distance: number; unit: DistanceUnitName } => {
	const result: { distance: number; unit: DistanceUnitName } = {
		distance: distance,
		unit: 'km'
	};

	if (distanceUnit === 'kilometers') {
		if (distance >= 1) {
			result.distance = distance;
			result.unit = 'km';
		} else {
			const meters = distance * 1000;
			if (meters >= 1) {
				result.distance = meters;
				result.unit = 'm';
			} else {
				const centimeters = meters * 100;
				result.distance = centimeters;
				result.unit = 'cm';
			}
		}
	} else if (distanceUnit === 'degrees') {
		result.unit = '°';
	} else if (distanceUnit === 'miles') {
		result.unit = 'mi';
	} else if (distanceUnit === 'radians') {
		result.unit = 'rad';
	}
	// Default case: return kilometers if unit is not recognized
	return result;
};
