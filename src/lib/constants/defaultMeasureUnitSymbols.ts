import type { MeasureUnitSymbolType } from '../interfaces';

/**
 * Map of default measure unit symbols for each unit of metric and imperial
 * This value each unit is shown on map label.
 * You can override this value by providing `measureUnitSymbols` property in `MeasureControlOptions`.
 */
export const defaultMeasureUnitSymbols: MeasureUnitSymbolType = {
	kilometer: 'km',
	meter: 'm',
	centimeter: 'cm',
	mile: 'mi',
	foot: 'ft',
	inch: 'in',
	'square meters': 'm²',
	'square kilometers': 'km²',
	ares: 'a',
	hectares: 'ha',
	'square feet': 'ft²',
	'square yards': 'yd²',
	acres: 'acres',
	'square miles': 'mi²'
};
