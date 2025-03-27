import { describe, it, expect } from 'vitest';
import { convertMetricDistance } from './convertMetricDistance';

describe('convertMetricDistance', () => {
	it('should return kilometers when distance is 1 or more', () => {
		expect(convertMetricDistance(1)).toEqual({ distance: 1, unit: 'km' });
		expect(convertMetricDistance(2.5)).toEqual({ distance: 2.5, unit: 'km' });
	});

	it('should return meters when distance is less than 1 km but 1 m or more', () => {
		expect(convertMetricDistance(0.5)).toEqual({ distance: 500, unit: 'm' });
		expect(convertMetricDistance(0.001)).toEqual({ distance: 1, unit: 'm' });
	});

	it('should return centimeters when distance is less than 1 meter', () => {
		expect(convertMetricDistance(0.0005)).toEqual({ distance: 50, unit: 'cm' });
		expect(convertMetricDistance(0.00001)).toEqual({ distance: 1, unit: 'cm' });
	});

	it('should handle edge case of 0 km', () => {
		expect(convertMetricDistance(0)).toEqual({ distance: 0, unit: 'cm' });
	});

	it('should handle floating point edge values accurately', () => {
		expect(convertMetricDistance(0.999)).toEqual({ distance: 999, unit: 'm' });
		const result = convertMetricDistance(0.000009);
		expect(result.unit).toBe('cm');
		expect(result.distance).toBeCloseTo(0.9, 5);
	});
});
