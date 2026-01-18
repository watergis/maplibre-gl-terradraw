import { describe, it, expect } from 'vitest';
import { convertDistance } from './convertDistance';

describe('convertDistance with metric unit', () => {
	it('should return kilometers when distance is 1000m or more', () => {
		expect(convertDistance(1000, 'metric', undefined)).toEqual({ distance: 1, unit: 'km' });
		expect(convertDistance(2500, 'metric', undefined)).toEqual({ distance: 2.5, unit: 'km' });
	});

	it('should return meters when distance is 1m or more but less than 1000m', () => {
		expect(convertDistance(500, 'metric', undefined)).toEqual({ distance: 500, unit: 'm' });
		expect(convertDistance(1, 'metric', undefined)).toEqual({ distance: 1, unit: 'm' });
	});

	it('should return centimeters when distance is less than 1 meter', () => {
		expect(convertDistance(0.5, 'metric', undefined)).toEqual({ distance: 50, unit: 'cm' });
		expect(convertDistance(0.01, 'metric', undefined)).toEqual({ distance: 1, unit: 'cm' });
	});

	it('should handle edge case of 0 m', () => {
		expect(convertDistance(0, 'metric', undefined)).toEqual({ distance: 0, unit: 'cm' });
	});

	it('should handle floating point edge values accurately', () => {
		expect(convertDistance(999, 'metric', undefined)).toEqual({ distance: 999, unit: 'm' });
		const result = convertDistance(0.009, 'metric', undefined);
		expect(result.unit).toBe('cm');
		expect(result.distance).toBeCloseTo(0.9, 5);
	});

	it('should return kilometers when distanceUnit is kilometers', () => {
		expect(convertDistance(1000, 'metric', 'kilometer')).toEqual({ distance: 1, unit: 'km' });
		expect(convertDistance(2500, 'metric', 'kilometer')).toEqual({ distance: 2.5, unit: 'km' });
	});

	it('should return meters when distanceUnit is meters', () => {
		expect(convertDistance(1000, 'metric', 'meter')).toEqual({ distance: 1000, unit: 'm' });
		expect(convertDistance(2500, 'metric', 'meter')).toEqual({ distance: 2500, unit: 'm' });
	});

	it('should return centimeters when distanceUnit is centimeters', () => {
		expect(convertDistance(1000, 'metric', 'centimeter')).toEqual({ distance: 100000, unit: 'cm' });
		expect(convertDistance(2500, 'metric', 'centimeter')).toEqual({ distance: 250000, unit: 'cm' });
	});

	it('should return distanceUnit value even if distance unit is different', () => {
		// When distanceUnit is 'mile' and unit is 'metric', it should return miles
		const result1 = convertDistance(500, 'metric', 'mile');
		expect(result1.distance).toBeCloseTo(0.31, 2);
		expect(result1.unit).toBe('mi');
		// When distanceUnit is 'foot' and unit is 'metric', it should return feet
		const result2 = convertDistance(1, 'metric', 'foot');
		expect(result2.distance).toBeCloseTo(3.3, 1);
		expect(result2.unit).toBe('ft');
	});

	it('should return corresponding value when distanceUnit is custom callback', () => {
		expect(
			convertDistance(1000, 'metric', (distance) => ({ distance: distance / 1000, unit: 'KM' }))
		).toEqual({ distance: 1, unit: 'KM' });
	});
});

describe('convertDistance with imperial unit', () => {
	it('should return miles when distanceUnit is miles', () => {
		// 1609.34 meters ≈ 1 mile
		const result1 = convertDistance(1609.34, 'imperial', 'mile');
		expect(result1.distance).toBeCloseTo(1, 5);
		expect(result1.unit).toBe('mi');
		// 4023.35 meters ≈ 2.5 miles
		const result2 = convertDistance(4023.35, 'imperial', 'mile');
		expect(result2.distance).toBeCloseTo(2.5, 5);
		expect(result2.unit).toBe('mi');
	});

	it('should return feet when distanceUnit is feet', () => {
		// 1609.34 meters = 1 mile = 5280 feet
		const result1 = convertDistance(1609.34, 'imperial', 'foot');
		expect(result1.distance).toBeCloseTo(5280, 0);
		expect(result1.unit).toBe('ft');
		// 804.67 meters ≈ 0.5 mile = 2640 feet
		const result2 = convertDistance(804.67, 'imperial', 'foot');
		expect(result2.distance).toBeCloseTo(2640, 0);
		expect(result2.unit).toBe('ft');
	});

	it('should return inches when distanceUnit is inches', () => {
		// 1609.34 meters = 1 mile = 63360 inches
		const result1 = convertDistance(1609.34, 'imperial', 'inch');
		expect(result1.distance).toBeCloseTo(63360, 0);
		expect(result1.unit).toBe('in');
		// 804.67 meters ≈ 0.5 mile = 31680 inches
		const result2 = convertDistance(804.67, 'imperial', 'inch');
		expect(result2.distance).toBeCloseTo(31680, 0);
		expect(result2.unit).toBe('in');
	});

	it('should auto-scale to the appropriate unit when distanceUnit is auto', () => {
		// 1609.34 meters ≈ 1 mile
		const result1 = convertDistance(1609.34, 'imperial', undefined);
		expect(result1.distance).toBeCloseTo(1, 5);
		expect(result1.unit).toBe('mi');
		// 804.67 meters ≈ 0.5 mile = 2640 feet
		const result2 = convertDistance(804.67, 'imperial', undefined);
		expect(result2.distance).toBeCloseTo(2640, 0);
		expect(result2.unit).toBe('ft');
		// 0.16 meters ≈ 0.0001 mile ≈ 6.336 inches
		const result3 = convertDistance(0.16, 'imperial', undefined);
		expect(result3.distance).toBeCloseTo(6.3, 0);
		expect(result3.unit).toBe('in');
	});

	it('should return distanceUnit value even if distance unit is different', () => {
		// When distanceUnit is 'meter' and unit is 'imperial', it should return meters
		const result1 = convertDistance(1609.34, 'imperial', 'meter');
		expect(result1.distance).toBe(1609.34);
		expect(result1.unit).toBe('m');
		// When distanceUnit is 'kilometer' and unit is 'imperial', it should return kilometers
		const result2 = convertDistance(5000, 'imperial', 'kilometer');
		expect(result2.distance).toBe(5);
		expect(result2.unit).toBe('km');
	});
});

describe('convertDistance with custom unit symbols (measureUnitSymbols)', () => {
	const customSymbols = {
		kilometer: 'kilometre',
		meter: 'metre',
		centimeter: 'centimetre',
		mile: 'miles',
		foot: 'feet',
		inch: 'inches',
		'square meters': 'm²',
		'square kilometers': 'km²',
		ares: 'a',
		hectares: 'ha',
		'square feet': 'ft²',
		'square yards': 'yd²',
		acres: 'acres',
		'square miles': 'mi²'
	};

	describe('Metric units with custom symbols', () => {
		it('should use custom symbols in auto mode', () => {
			expect(convertDistance(1000, 'metric', undefined, customSymbols)).toEqual({
				distance: 1,
				unit: 'kilometre'
			});
			expect(convertDistance(500, 'metric', undefined, customSymbols)).toEqual({
				distance: 500,
				unit: 'metre'
			});
			expect(convertDistance(0.5, 'metric', undefined, customSymbols)).toEqual({
				distance: 50,
				unit: 'centimetre'
			});
		});

		it('should use custom symbols when forceUnit is specified', () => {
			expect(convertDistance(1000, 'metric', 'kilometer', customSymbols)).toEqual({
				distance: 1,
				unit: 'kilometre'
			});
			expect(convertDistance(1000, 'metric', 'meter', customSymbols)).toEqual({
				distance: 1000,
				unit: 'metre'
			});
			expect(convertDistance(1000, 'metric', 'centimeter', customSymbols)).toEqual({
				distance: 100000,
				unit: 'centimetre'
			});
		});
	});

	describe('Imperial units with custom symbols', () => {
		it('should use custom symbols in auto mode', () => {
			// 1609.34 meters ≈ 1 mile
			const result1 = convertDistance(1609.34, 'imperial', undefined, customSymbols);
			expect(result1.distance).toBeCloseTo(1, 5);
			expect(result1.unit).toBe('miles');
			// 804.67 meters ≈ 0.5 mile = 2640 feet
			const result2 = convertDistance(804.67, 'imperial', undefined, customSymbols);
			expect(result2.distance).toBeCloseTo(2640, 0);
			expect(result2.unit).toBe('feet');
			// 0.16 meters ≈ 6.3 inches
			const result3 = convertDistance(0.16, 'imperial', undefined, customSymbols);
			expect(result3.distance).toBeCloseTo(6.3, 0);
			expect(result3.unit).toBe('inches');
		});

		it('should use custom symbols when forceUnit is specified', () => {
			// 1609.34 meters ≈ 1 mile
			const result1 = convertDistance(1609.34, 'imperial', 'mile', customSymbols);
			expect(result1.distance).toBeCloseTo(1, 5);
			expect(result1.unit).toBe('miles');
			// 1609.34 meters = 1 mile = 5280 feet
			const result2 = convertDistance(1609.34, 'imperial', 'foot', customSymbols);
			expect(result2.distance).toBeCloseTo(5280, 0);
			expect(result2.unit).toBe('feet');
			// 1609.34 meters = 1 mile = 63360 inches
			const result3 = convertDistance(1609.34, 'imperial', 'inch', customSymbols);
			expect(result3.distance).toBeCloseTo(63360, 0);
			expect(result3.unit).toBe('inches');
		});
	});
});
