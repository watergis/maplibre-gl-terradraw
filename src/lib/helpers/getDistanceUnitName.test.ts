import { describe, it, expect } from 'vitest';
import { getDistanceUnitName } from './getDistanceUnitName';
import type { DistanceUnit } from '../interfaces/DistanceUnit';

describe('getDistanceUnitName', () => {
	it('should return "°" for "degrees"', () => {
		expect(getDistanceUnitName('degrees' as DistanceUnit)).toBe('°');
	});

	it('should return "mi" for "miles"', () => {
		expect(getDistanceUnitName('miles' as DistanceUnit)).toBe('mi');
	});

	it('should return "rad" for "radians"', () => {
		expect(getDistanceUnitName('radians' as DistanceUnit)).toBe('rad');
	});

	it('should return "km" for any other value', () => {
		expect(getDistanceUnitName('kilometers' as DistanceUnit)).toBe('km');
	});
});
