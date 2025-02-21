import type { DistanceUnit } from '../interfaces/DistanceUnit';

/**
 * Get the equivalent unit name for displaying
 * @param distanceUnit distance unit
 * @returns Unit name for displaying
 */
export const getDistanceUnitName = (distanceUnit: DistanceUnit) => {
	if (distanceUnit === 'degrees') {
		return '°';
	} else if (distanceUnit === 'miles') {
		return 'mi';
	} else if (distanceUnit === 'radians') {
		return 'rad';
	} else {
		return 'km';
	}
};
