import { describe, it, expect } from 'vitest';
import { convertDistance } from './convertDistance';

describe('convertDistance with metric unit', () => {
	it('should return kilometers when distance is 1 or more', () => {
		expect(convertDistance(1, 'metric', 'auto')).toEqual({ distance: 1, unit: 'km' });
		expect(convertDistance(2.5, 'metric', 'auto')).toEqual({ distance: 2.5, unit: 'km' });
	});

	it('should return meters when distance is less than 1 km but 1 m or more', () => {
		expect(convertDistance(0.5, 'metric', 'auto')).toEqual({ distance: 500, unit: 'm' });
		expect(convertDistance(0.001, 'metric', 'auto')).toEqual({ distance: 1, unit: 'm' });
	});

	it('should return centimeters when distance is less than 1 meter', () => {
		expect(convertDistance(0.0005, 'metric', 'auto')).toEqual({ distance: 50, unit: 'cm' });
		expect(convertDistance(0.00001, 'metric', 'auto')).toEqual({ distance: 1, unit: 'cm' });
	});

	it('should handle edge case of 0 km', () => {
		expect(convertDistance(0, 'metric', 'auto')).toEqual({ distance: 0, unit: 'cm' });
	});

	it('should handle floating point edge values accurately', () => {
		expect(convertDistance(0.999, 'metric', 'auto')).toEqual({ distance: 999, unit: 'm' });
		const result = convertDistance(0.000009, 'metric', 'auto');
		expect(result.unit).toBe('cm');
		expect(result.distance).toBeCloseTo(0.9, 5);
	});

	it('should return kilometers when forceDistanceUnit is kilometers', () => {
		expect(convertDistance(1, 'metric', 'kilometer')).toEqual({ distance: 1, unit: 'km' });
		expect(convertDistance(2.5, 'metric', 'kilometer')).toEqual({ distance: 2.5, unit: 'km' });
	});

	it('should return meters when forceDistanceUnit is meters', () => {
		expect(convertDistance(1, 'metric', 'meter')).toEqual({ distance: 1000, unit: 'm' });
		expect(convertDistance(2.5, 'metric', 'meter')).toEqual({ distance: 2500, unit: 'm' });
	});

	it('should return centimeters when forceDistanceUnit is centimeters', () => {
		expect(convertDistance(1, 'metric', 'centimeter')).toEqual({ distance: 100000, unit: 'cm' });
		expect(convertDistance(2.5, 'metric', 'centimeter')).toEqual({ distance: 250000, unit: 'cm' });
	});
});

describe('convertDistance with imperial unit', () => {
	it('should return miles when forceDistanceUnit is miles', () => {
		expect(convertDistance(1, 'imperial', 'mile')).toEqual({ distance: 1, unit: 'mi' });
		expect(convertDistance(2.5, 'imperial', 'mile')).toEqual({ distance: 2.5, unit: 'mi' });
	});

	it('should return feet when forceDistanceUnit is feet', () => {
		expect(convertDistance(1, 'imperial', 'foot')).toEqual({ distance: 5280, unit: 'ft' });
		expect(convertDistance(0.5, 'imperial', 'foot')).toEqual({ distance: 2640, unit: 'ft' });
	});

	it('should return inches when forceDistanceUnit is inches', () => {
		expect(convertDistance(1, 'imperial', 'inch')).toEqual({ distance: 63360, unit: 'in' });
		expect(convertDistance(0.5, 'imperial', 'inch')).toEqual({ distance: 31680, unit: 'in' });
	});

	it('should auto-scale to the appropriate unit when forceDistanceUnit is auto', () => {
		expect(convertDistance(1, 'imperial', 'auto')).toEqual({ distance: 1, unit: 'mi' });
		expect(convertDistance(0.5, 'imperial', 'auto')).toEqual({ distance: 2640, unit: 'ft' });
		expect(convertDistance(0.0001, 'imperial', 'auto')).toEqual({ distance: 6.336, unit: 'in' });
	});
});
