import { defaultMeasureUnitSymbols } from '../constants';
import type {
	MeasureUnitType,
	forceAreaUnitType,
	ImperialAreaUnit,
	MetricAreaUnit,
	MeasureUnitSymbolType
} from '../interfaces';

/**
 * convert area unit to metric or imperial
 * @param value area value in m2
 * @param unit area unit either metric or imperial
 * @param forceUnit Default is `auto`. If `auto` is set, unit is converted depending on the value and selection of area unit. If a specific unit is specified, it returns the value always the same. If a selected unit is not the same type of unit either metric of imperial, it will be ignored, and `auto` will be applied.
 * @param measureUnitSymbols Optional parameter to provide custom unit symbols
 * @returns result object with area and unit properties adter unit conversion
 */
export const convertAreaUnit = (
	value: number,
	unit: MeasureUnitType,
	forceUnit: forceAreaUnitType = 'auto',
	measureUnitSymbols = defaultMeasureUnitSymbols
) => {
	// Define metric and imperial units
	const metricUnits = ['square meters', 'square kilometers', 'ares', 'hectares'];
	const imperialUnits = ['square feet', 'square yards', 'acres', 'square miles'];

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
			return convertMetricUnit(value, effectiveForceUnit as MetricAreaUnit, measureUnitSymbols);
		} else {
			if (value >= 1000000) {
				return convertMetricUnit(value, 'square kilometers', measureUnitSymbols);
			} else if (value >= 10000) {
				return convertMetricUnit(value, 'hectares', measureUnitSymbols);
			} else if (value >= 100) {
				return convertMetricUnit(value, 'ares', measureUnitSymbols);
			} else {
				return convertMetricUnit(value, 'square meters', measureUnitSymbols);
			}
		}
	} else {
		if (effectiveForceUnit !== 'auto') {
			return convertImperialUnit(value, effectiveForceUnit as ImperialAreaUnit, measureUnitSymbols);
		} else {
			if (value >= 2589988.11) {
				return convertImperialUnit(value, 'square miles', measureUnitSymbols);
			} else if (value >= 4046.856) {
				return convertImperialUnit(value, 'acres', measureUnitSymbols);
			} else if (value >= 0.83612736) {
				return convertImperialUnit(value, 'square yards', measureUnitSymbols);
			} else {
				return convertImperialUnit(value, 'square feet', measureUnitSymbols);
			}
		}
	}
};

const convertMetricUnit = (
	value: number,
	unit: MetricAreaUnit,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	let outputArea = value;
	let outputUnit = measureUnitSymbols['square meters'];
	switch (unit) {
		case 'square meters':
			outputArea = value;
			outputUnit = measureUnitSymbols['square meters'];
			break;
		case 'ares':
			// 1a = 100 m²
			outputArea = value / 100;
			outputUnit = measureUnitSymbols['ares'];
			break;
		case 'hectares':
			// 1 ha = 10,000 m²
			outputArea = value / 10000;
			outputUnit = measureUnitSymbols['hectares'];
			break;
		case 'square kilometers':
			// 1 km² = 1,000,000 m²
			outputArea = value / 1000000;
			outputUnit = measureUnitSymbols['square kilometers'];
			break;
	}
	return {
		area: outputArea,
		unit: outputUnit
	};
};

const convertImperialUnit = (
	value: number,
	unit: ImperialAreaUnit,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	let outputArea = value / 2589988.11;
	let outputUnit = measureUnitSymbols['square meters'];
	switch (unit) {
		case 'square feet':
			// 1 ft² = 0.09290304 m²
			outputArea = value / 0.09290304;
			outputUnit = measureUnitSymbols['square feet'];
			break;
		case 'square yards':
			// 1 yd² = 0.83612736 m²
			outputArea = value / 0.83612736;
			outputUnit = measureUnitSymbols['square yards'];
			break;
		case 'acres':
			// 1 acre = 4,046.856 m²
			outputArea = value / 4046.856;
			outputUnit = measureUnitSymbols['acres'];
			break;
		case 'square miles':
			// 1 mi² = 2,589,988.11 m²
			outputArea = value / 2589988.11;
			outputUnit = measureUnitSymbols['square miles'];
			break;
	}
	return {
		area: outputArea,
		unit: outputUnit
	};
};
