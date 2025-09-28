import { describe, it, expect } from 'vitest';
import { convertAreaUnit } from './convertAreaUnit';

describe('convertAreaUnit', () => {
	describe('Auto unit conversion (existing behavior)', () => {
		it('should return area in m² if metric and value < 100', () => {
			expect(convertAreaUnit(50, 'metric')).toEqual({ area: 50, unit: 'm²' });
		});

		it('should return area in a if metric and value >= 100 and < 10000', () => {
			expect(convertAreaUnit(5000, 'metric')).toEqual({ area: 50, unit: 'a' });
		});

		it('should convert to hectares (ha) if metric and value >= 10000', () => {
			expect(convertAreaUnit(20000, 'metric')).toEqual({ area: 2, unit: 'ha' });
		});

		it('should convert to square kilometers (km²) if metric and value >= 1000000', () => {
			expect(convertAreaUnit(5000000, 'metric')).toEqual({ area: 5, unit: 'km²' });
		});

		it('should return area in ft² if imperial and value < 0.83612736', () => {
			expect(convertAreaUnit(0.5, 'imperial')).toEqual({ area: 5.381955208354861, unit: 'ft²' });
		});

		it('should convert to square yards (yd²) if imperial and value >= 0.83612736', () => {
			expect(convertAreaUnit(1, 'imperial')).toEqual({ area: 1.1959900463010802, unit: 'yd²' });
		});

		it('should convert to acres (acre) if imperial and value >= 4046.856', () => {
			expect(convertAreaUnit(8093.712, 'imperial')).toEqual({ area: 2, unit: 'acres' });
		});

		it('should convert to square miles (mi²) if imperial and value >= 2589988.11', () => {
			expect(convertAreaUnit(5179976.22, 'imperial')).toEqual({ area: 2, unit: 'mi²' });
		});
	});

	describe('ForceUnit - Metric units', () => {
		it('should force conversion to m² when forceUnit is m2', () => {
			expect(convertAreaUnit(20000, 'metric', 'square meters')).toEqual({
				area: 20000,
				unit: 'm²'
			});
		});

		it('should force conversion to a when forceUnit is a', () => {
			expect(convertAreaUnit(20000, 'metric', 'ares')).toEqual({ area: 200, unit: 'a' });
		});

		it('should force conversion to hectares when forceUnit is hectares', () => {
			expect(convertAreaUnit(5000, 'metric', 'hectares')).toEqual({ area: 0.5, unit: 'ha' });
		});

		it('should force conversion to km² when forceUnit is km²', () => {
			expect(convertAreaUnit(500000, 'metric', 'square kilometers')).toEqual({
				area: 0.5,
				unit: 'km²'
			});
		});
	});

	describe('ForceUnit - Imperial units', () => {
		it('should force conversion to ft² when forceUnit is ft2', () => {
			expect(convertAreaUnit(1, 'imperial', 'square feet')).toEqual({
				area: 10.763910416709722,
				unit: 'ft²'
			});
		});

		it('should force conversion to yd² when forceUnit is yd²', () => {
			expect(convertAreaUnit(10, 'imperial', 'square yards')).toEqual({
				area: 11.959900463010802,
				unit: 'yd²'
			});
		});

		it('should force conversion to acres when forceUnit is acres', () => {
			expect(convertAreaUnit(8093.712, 'imperial', 'acres')).toEqual({
				area: 2,
				unit: 'acres'
			});
		});

		it('should force conversion to mi² when forceUnit is mi2', () => {
			expect(convertAreaUnit(2589988.11, 'imperial', 'square miles')).toEqual({
				area: 1,
				unit: 'mi²'
			});
		});
	});

	describe('ForceUnit - Invalid unit type fallback to auto', () => {
		it('should fallback to auto when metric is selected but imperial unit is forced', () => {
			// Should auto-select 'ha' instead of forcing 'acre'
			expect(convertAreaUnit(20000, 'metric', 'acres')).toEqual({ area: 2, unit: 'ha' });
		});

		it('should fallback to auto when imperial is selected but metric unit is forced', () => {
			// Should auto-select 'yd²' instead of forcing 'hectares'
			expect(convertAreaUnit(1, 'imperial', 'hectares')).toEqual({
				area: 1.1959900463010802,
				unit: 'yd²'
			});
		});

		it('should fallback to auto when metric is selected but another invalid imperial unit is forced', () => {
			// Should auto-select 'km²' instead of forcing 'mi2'
			expect(convertAreaUnit(5000000, 'metric', 'square miles')).toEqual({ area: 5, unit: 'km²' });
		});
	});

	describe('ForceUnit - Explicit auto parameter', () => {
		it('should behave normally when forceUnit is explicitly set to auto', () => {
			expect(convertAreaUnit(20000, 'metric', 'auto')).toEqual({ area: 2, unit: 'ha' });
			expect(convertAreaUnit(8093.712, 'imperial', 'auto')).toEqual({ area: 2, unit: 'acres' });
		});
	});

	describe('Edge cases', () => {
		it('should handle zero values correctly', () => {
			expect(convertAreaUnit(0, 'metric')).toEqual({ area: 0, unit: 'm²' });
			expect(convertAreaUnit(0, 'imperial')).toEqual({ area: 0, unit: 'ft²' });
		});

		it('should handle very small values', () => {
			expect(convertAreaUnit(0.01, 'metric')).toEqual({ area: 0.01, unit: 'm²' });
			expect(convertAreaUnit(0.01, 'imperial')).toEqual({
				area: 0.10763910416709722,
				unit: 'ft²'
			});
		});
	});
});
