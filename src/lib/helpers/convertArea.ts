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
 * @param forceUnit Default is `auto`. If `auto` is set, unit is converted depending on the value and selection of area unit. If a specific unit is specified, it returns the value always in that unit regardless of measureUnitType.
 * @param measureUnitSymbols Optional parameter to provide custom unit symbols
 * @returns result object with area and unit properties after unit conversion
 */
export const convertArea = (
	value: number,
	unit: MeasureUnitType,
	forceUnit: forceAreaUnitType = undefined,
	measureUnitSymbols = defaultMeasureUnitSymbols
): { area: number; unit: string } => {
	// Define metric and imperial units
	const metricUnits = ['square meters', 'square kilometers', 'ares', 'hectares'];
	const imperialUnits = ['square feet', 'square yards', 'acres', 'square miles'];

	if (forceUnit && typeof forceUnit !== 'function') {
		// if forceUnit is a specific unit, use it for conversion
		const isMetricForceUnit = metricUnits.includes(forceUnit);
		const isImperialForceUnit = imperialUnits.includes(forceUnit);

		if (isMetricForceUnit) {
			return convertMetricUnit(value, forceUnit as MetricAreaUnit, measureUnitSymbols);
		} else if (isImperialForceUnit) {
			return convertImperialUnit(value, forceUnit as ImperialAreaUnit, measureUnitSymbols);
		}
	}

	if (forceUnit && typeof forceUnit === 'function') {
		// If forceUnit is a callback function, use it for conversion
		return forceUnit(value);
	} else {
		// Auto mode: convert based on measureUnitType and value
		return defaultAutoUnitConversion(value, unit, measureUnitSymbols);
	}
};

/**
 * Automatically converts an area value from square meters to the most appropriate unit
 * based on the specified measurement system and the value's magnitude.
 *
 * For metric system:
 * - Values >= 1,000,000m² are converted to square kilometers
 * - Values >= 10,000m² are converted to hectares
 * - Values >= 100m² are converted to ares
 * - Values < 100m² are kept as square meters
 *
 * For imperial system:
 * - Values >= 2,589,988.11m² (1 square mile) are converted to square miles
 * - Values >= 4,046.856m² (1 acre) are converted to acres
 * - Values >= 0.83612736m² (1 square yard) are converted to square yards
 * - Values < 0.83612736m² are converted to square feet
 *
 * @param valueInSquareMeters - The area value in square meters to be converted
 * @param measureUnitType - The measurement system to use ('metric' or 'imperial')
 * @param measureUnitSymbols - An object containing the symbol representations for each unit
 * @returns An object containing the converted area value and its corresponding unit symbol
 */
const defaultAutoUnitConversion = (
	valueInSquareMeters: number,
	measureUnitType: MeasureUnitType,
	measureUnitSymbols: MeasureUnitSymbolType
) => {
	if (measureUnitType === 'metric') {
		if (valueInSquareMeters >= 1000000) {
			return convertMetricUnit(valueInSquareMeters, 'square kilometers', measureUnitSymbols);
		} else if (valueInSquareMeters >= 10000) {
			return convertMetricUnit(valueInSquareMeters, 'hectares', measureUnitSymbols);
		} else if (valueInSquareMeters >= 100) {
			return convertMetricUnit(valueInSquareMeters, 'ares', measureUnitSymbols);
		} else {
			return convertMetricUnit(valueInSquareMeters, 'square meters', measureUnitSymbols);
		}
	} else {
		if (valueInSquareMeters >= 2589988.11) {
			return convertImperialUnit(valueInSquareMeters, 'square miles', measureUnitSymbols);
		} else if (valueInSquareMeters >= 4046.856) {
			return convertImperialUnit(valueInSquareMeters, 'acres', measureUnitSymbols);
		} else if (valueInSquareMeters >= 0.83612736) {
			return convertImperialUnit(valueInSquareMeters, 'square yards', measureUnitSymbols);
		} else {
			return convertImperialUnit(valueInSquareMeters, 'square feet', measureUnitSymbols);
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
