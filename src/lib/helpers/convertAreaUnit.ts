import type { AreaUnit } from '../interfaces';

/**
 * convert area unit to metric or imperial
 * @param value area value in m2
 * @param unit area unit either metric or imperial
 * @returns result object with area and unit properties adter unit conversion
 */
export const convertAreaUnit = (value: number, unit: AreaUnit) => {
	let outputArea = value;
	let outputUnit = 'm²';

	if (unit === 'metric') {
		if (value >= 1000000) {
			// 1 km² = 1,000,000 m²
			outputArea = value / 1000000;
			outputUnit = 'km²';
		} else if (value >= 10000) {
			// 1 ha = 10,000 m²
			outputArea = value / 10000;
			outputUnit = 'ha';
		}
	} else {
		if (value >= 2589988.11) {
			// 1 mi² = 2,589,988.11 m²
			outputArea = value / 2589988.11;
			outputUnit = 'mi²';
		} else if (value >= 4046.856) {
			// 1 acre = 4,046.856 m²
			outputArea = value / 4046.856;
			outputUnit = 'acre';
		} else if (value >= 0.83612736) {
			// 1 yd² = 0.83612736 m²
			outputArea = value / 0.83612736;
			outputUnit = 'yd²';
		}
	}

	return { area: outputArea, unit: outputUnit };
};
