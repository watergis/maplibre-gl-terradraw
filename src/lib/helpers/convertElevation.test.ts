import { describe, it, expect } from 'vitest';
import { convertElevation } from './convertElevation';
import { defaultMeasureUnitSymbols } from '../constants';

describe('convertElevation', () => {
	it('should convert meters to meters for metric unit', () => {
		const result = convertElevation(100, 'metric');
		expect(result.elevation).toBe(100);
		expect(result.unit).toBe('m');
	});

	it('should convert meters to feet for imperial unit', () => {
		const result = convertElevation(100, 'imperial');
		expect(result.elevation).toBeCloseTo(328.084, 3);
		expect(result.unit).toBe('ft');
	});

	it('should use custom unit symbols when provided', () => {
		const customSymbols = {
			...defaultMeasureUnitSymbols,
			meter: 'meters',
			foot: 'feet'
		};
		
		const metricResult = convertElevation(50, 'metric', customSymbols);
		expect(metricResult.unit).toBe('meters');
		
		const imperialResult = convertElevation(50, 'imperial', customSymbols);
		expect(imperialResult.unit).toBe('feet');
	});

	it('should default to metric when no unit type is specified', () => {
		const result = convertElevation(75);
		expect(result.elevation).toBe(75);
		expect(result.unit).toBe('m');
	});

	it('should handle zero elevation', () => {
		const metricResult = convertElevation(0, 'metric');
		expect(metricResult.elevation).toBe(0);
		expect(metricResult.unit).toBe('m');

		const imperialResult = convertElevation(0, 'imperial');
		expect(imperialResult.elevation).toBe(0);
		expect(imperialResult.unit).toBe('ft');
	});

	it('should handle negative elevation', () => {
		const metricResult = convertElevation(-50, 'metric');
		expect(metricResult.elevation).toBe(-50);
		expect(metricResult.unit).toBe('m');

		const imperialResult = convertElevation(-50, 'imperial');
		expect(imperialResult.elevation).toBeCloseTo(-164.042, 3);
		expect(imperialResult.unit).toBe('ft');
	});

	it('should handle very small values', () => {
		const result = convertElevation(0.5, 'imperial');
		expect(result.elevation).toBeCloseTo(1.64042, 5);
		expect(result.unit).toBe('ft');
	});

	it('should handle very large values', () => {
		const result = convertElevation(8848, 'imperial'); // Mount Everest height in meters
		expect(result.elevation).toBeCloseTo(29028.87, 2);
		expect(result.unit).toBe('ft');
	});
});