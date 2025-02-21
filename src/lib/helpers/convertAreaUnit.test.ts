import { describe, it, expect } from 'vitest';
import { convertAreaUnit } from './convertAreaUnit';

describe('convertAreaUnit', () => {
	it('should return area in m² if metric and value < 10000', () => {
		expect(convertAreaUnit(5000, 'metric')).toEqual({ area: 5000, unit: 'm²' });
	});

	it('should convert to hectares (ha) if metric and value >= 10000', () => {
		expect(convertAreaUnit(20000, 'metric')).toEqual({ area: 2, unit: 'ha' });
	});

	it('should convert to square kilometers (km²) if metric and value >= 1000000', () => {
		expect(convertAreaUnit(5000000, 'metric')).toEqual({ area: 5, unit: 'km²' });
	});

	it('should return area in m² if imperial and value < 0.83612736', () => {
		expect(convertAreaUnit(0.5, 'imperial')).toEqual({ area: 0.5, unit: 'm²' });
	});

	it('should convert to square yards (yd²) if imperial and value >= 0.83612736', () => {
		expect(convertAreaUnit(1, 'imperial')).toEqual({ area: 1.1959900463010802, unit: 'yd²' });
	});

	it('should convert to acres (acre) if imperial and value >= 4046.856', () => {
		expect(convertAreaUnit(8093.712, 'imperial')).toEqual({ area: 2, unit: 'acre' });
	});

	it('should convert to square miles (mi²) if imperial and value >= 2589988.11', () => {
		expect(convertAreaUnit(5179976.22, 'imperial')).toEqual({ area: 2, unit: 'mi²' });
	});
});
