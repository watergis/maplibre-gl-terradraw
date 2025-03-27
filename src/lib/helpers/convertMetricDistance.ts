/**
 * Converts a distance in kilometers to the appropriate unit (km, m, or cm).
 * - If the value is 1 km or more, it returns the value in kilometers.
 * - If the value is less than 1 km but 1 meter or more, it returns the value in meters.
 * - If the value is less than 1 meter, it returns the value in centimeters.
 *
 * @param value - The distance in kilometers.
 * @returns the converted value and unit.
 */
export const convertMetricDistance = (
	distance: number
): { distance: number; unit: 'km' | 'm' | 'cm' } => {
	if (distance >= 1) {
		return {
			distance: distance,
			unit: 'km'
		};
	}

	const meters = distance * 1000;
	if (meters >= 1) {
		return {
			distance: meters,
			unit: 'm'
		};
	}

	const centimeters = meters * 100;
	return {
		distance: centimeters,
		unit: 'cm'
	};
};
