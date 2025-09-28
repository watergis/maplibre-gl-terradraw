import type {
	MeasureUnitType,
	forceAreaUnitType,
	imperialAreaUnit,
	metricAreaUnit
} from '../interfaces';

/**
 * convert area unit to metric or imperial
 * @param value area value in m2
 * @param unit area unit either metric or imperial
 * @param forceUnit Default is `auto`. If `auto` is set, unit is converted depending on the value and selection of area unit. If a specific unit is specified, it returns the value always the same. If a selected unit is not the same type of unit either metric of imperial, it will be ignored, and `auto` will be applied.
 * @returns result object with area and unit properties adter unit conversion
 */
export const convertAreaUnit = (
	value: number,
	unit: MeasureUnitType,
	forceUnit: forceAreaUnitType = 'auto'
) => {
	// Define metric and imperial units
	const metricUnits = ['m2', 'km2', 'a', 'ha'];
	const imperialUnits = ['ft2', 'yd2', 'acre', 'mi2'];

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

	if (unit === 'metric') {
		if (effectiveForceUnit !== 'auto') {
			return convertMetricUnit(value, effectiveForceUnit as metricAreaUnit);
		} else {
			if (value >= 1000000) {
				return convertMetricUnit(value, 'km2');
			} else if (value >= 10000) {
				return convertMetricUnit(value, 'ha');
			} else if (value >= 100) {
				return convertMetricUnit(value, 'a');
			} else {
				return convertMetricUnit(value, 'm2');
			}
		}
	} else {
		if (effectiveForceUnit !== 'auto') {
			return convertImperialUnit(value, effectiveForceUnit as imperialAreaUnit);
		} else {
			if (value >= 2589988.11) {
				return convertImperialUnit(value, 'mi2');
			} else if (value >= 4046.856) {
				return convertImperialUnit(value, 'acre');
			} else if (value >= 0.83612736) {
				return convertImperialUnit(value, 'yd2');
			} else {
				return convertImperialUnit(value, 'ft2');
			}
		}
	}
};

const convertMetricUnit = (value: number, unit: metricAreaUnit) => {
	let outputArea = value;
	let outputUnit = 'm²';
	switch (unit) {
		case 'm2':
			outputArea = value;
			outputUnit = 'm²';
			break;
		case 'a':
			// 1a = 100 m²
			outputArea = value / 100;
			outputUnit = 'a';
			break;
		case 'ha':
			// 1 ha = 10,000 m²
			outputArea = value / 10000;
			outputUnit = 'ha';
			break;
		case 'km2':
			// 1 km² = 1,000,000 m²
			outputArea = value / 1000000;
			outputUnit = 'km²';
			break;
	}
	return {
		area: outputArea,
		unit: outputUnit
	};
};

const convertImperialUnit = (value: number, unit: imperialAreaUnit) => {
	let outputArea = value / 2589988.11;
	let outputUnit = 'm²';
	switch (unit) {
		case 'ft2':
			// 1 ft² = 0.09290304 m²
			outputArea = value / 0.09290304;
			outputUnit = 'ft²';
			break;
		case 'yd2':
			// 1 yd² = 0.83612736 m²
			outputArea = value / 0.83612736;
			outputUnit = 'yd²';
			break;
		case 'acre':
			// 1 acre = 4,046.856 m²
			outputArea = value / 4046.856;
			outputUnit = 'acre';
			break;
		case 'mi2':
			// 1 mi² = 2,589,988.11 m²
			outputArea = value / 2589988.11;
			outputUnit = 'mi²';
			break;
	}
	return {
		area: outputArea,
		unit: outputUnit
	};
};
