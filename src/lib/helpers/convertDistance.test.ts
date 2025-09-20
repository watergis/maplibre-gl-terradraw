import { describe, it, expect } from 'vitest';
import { convertDistance } from './convertDistance';

describe('convertDistance with metric unit', () => {
	it('should return kilometers when distance is 1 or more', () => {
		expect(convertDistance(1)).toEqual({ distance: 1, unit: 'km' });
		expect(convertDistance(2.5)).toEqual({ distance: 2.5, unit: 'km' });
	});

	it('should return meters when distance is less than 1 km but 1 m or more', () => {
		expect(convertDistance(0.5)).toEqual({ distance: 500, unit: 'm' });
		expect(convertDistance(0.001)).toEqual({ distance: 1, unit: 'm' });
	});

	it('should return centimeters when distance is less than 1 meter', () => {
		expect(convertDistance(0.0005)).toEqual({ distance: 50, unit: 'cm' });
		expect(convertDistance(0.00001)).toEqual({ distance: 1, unit: 'cm' });
	});

	it('should handle edge case of 0 km', () => {
		expect(convertDistance(0)).toEqual({ distance: 0, unit: 'cm' });
	});

	it('should handle floating point edge values accurately', () => {
		expect(convertDistance(0.999)).toEqual({ distance: 999, unit: 'm' });
		const result = convertDistance(0.000009);
		expect(result.unit).toBe('cm');
		expect(result.distance).toBeCloseTo(0.9, 5);
	});
});

describe('convertDistance with other units', () => {
	it('should return degrees when distanceUnit is degrees', () => {
		expect(convertDistance(10, 'degrees')).toEqual({ distance: 10, unit: '°' });
	});

	it('should return radians when distanceUnit is radians', () => {
		expect(convertDistance(5, 'radians')).toEqual({ distance: 5, unit: 'rad' });
	});

	it('should return miles when distanceUnit is miles', () => {
		expect(convertDistance(3, 'miles')).toEqual({ distance: 3, unit: 'mi' });
	});
});
