import { describe, it, expect } from 'vitest';
import { convertArea } from './convertArea';

describe('convertArea', () => {
	describe('Auto unit conversion (existing behavior)', () => {
		it('should return area in m² if metric and value < 100', () => {
			expect(convertArea(50, 'metric')).toEqual({ area: 50, unit: 'm²' });
		});

		it('should return area in a if metric and value >= 100 and < 10000', () => {
			expect(convertArea(5000, 'metric')).toEqual({ area: 50, unit: 'a' });
		});

		it('should convert to hectares (ha) if metric and value >= 10000', () => {
			expect(convertArea(20000, 'metric')).toEqual({ area: 2, unit: 'ha' });
		});

		it('should convert to square kilometers (km²) if metric and value >= 1000000', () => {
			expect(convertArea(5000000, 'metric')).toEqual({ area: 5, unit: 'km²' });
		});

		it('should return area in ft² if imperial and value < 0.83612736', () => {
			expect(convertArea(0.5, 'imperial')).toEqual({ area: 5.381955208354861, unit: 'ft²' });
		});

		it('should convert to square yards (yd²) if imperial and value >= 0.83612736', () => {
			expect(convertArea(1, 'imperial')).toEqual({ area: 1.1959900463010802, unit: 'yd²' });
		});

		it('should convert to acres (acre) if imperial and value >= 4046.856', () => {
			expect(convertArea(8093.712, 'imperial')).toEqual({ area: 2, unit: 'acres' });
		});

		it('should convert to square miles (mi²) if imperial and value >= 2589988.11', () => {
			expect(convertArea(5179976.22, 'imperial')).toEqual({ area: 2, unit: 'mi²' });
		});
	});

	describe('ForceUnit - Metric units', () => {
		it('should force conversion to m² when forceUnit is m2', () => {
			expect(convertArea(20000, 'metric', 'square meters')).toEqual({
				area: 20000,
				unit: 'm²'
			});
		});

		it('should force conversion to a when forceUnit is a', () => {
			expect(convertArea(20000, 'metric', 'ares')).toEqual({ area: 200, unit: 'a' });
		});

		it('should force conversion to hectares when forceUnit is hectares', () => {
			expect(convertArea(5000, 'metric', 'hectares')).toEqual({ area: 0.5, unit: 'ha' });
		});

		it('should force conversion to km² when forceUnit is km²', () => {
			expect(convertArea(500000, 'metric', 'square kilometers')).toEqual({
				area: 0.5,
				unit: 'km²'
			});
		});
	});

	describe('ForceUnit - Imperial units', () => {
		it('should force conversion to ft² when forceUnit is ft2', () => {
			expect(convertArea(1, 'imperial', 'square feet')).toEqual({
				area: 10.763910416709722,
				unit: 'ft²'
			});
		});

		it('should force conversion to yd² when forceUnit is yd²', () => {
			expect(convertArea(10, 'imperial', 'square yards')).toEqual({
				area: 11.959900463010802,
				unit: 'yd²'
			});
		});

		it('should force conversion to acres when forceUnit is acres', () => {
			expect(convertArea(8093.712, 'imperial', 'acres')).toEqual({
				area: 2,
				unit: 'acres'
			});
		});

		it('should force conversion to mi² when forceUnit is mi2', () => {
			expect(convertArea(2589988.11, 'imperial', 'square miles')).toEqual({
				area: 1,
				unit: 'mi²'
			});
		});
	});

	describe('ForceUnit - Cross-unit type conversion', () => {
		it('should force conversion to acres even when metric is selected', () => {
			// Should force 'acres' regardless of measureUnitType being 'metric'
			expect(convertArea(20000, 'metric', 'acres')).toEqual({
				area: 4.942108145187276,
				unit: 'acres'
			});
		});

		it('should force conversion to hectares even when imperial is selected', () => {
			// Should force 'hectares' regardless of measureUnitType being 'imperial'
			expect(convertArea(1, 'imperial', 'hectares')).toEqual({
				area: 0.0001,
				unit: 'ha'
			});
		});

		it('should force conversion to square miles even when metric is selected', () => {
			// Should force 'mi²' regardless of measureUnitType being 'metric'
			expect(convertArea(5000000, 'metric', 'square miles')).toEqual({
				area: 1.930510792962675,
				unit: 'mi²'
			});
		});

		it('should force conversion to square meters even when imperial is selected', () => {
			// Should force 'm²' regardless of measureUnitType being 'imperial'
			expect(convertArea(8093.712, 'imperial', 'square meters')).toEqual({
				area: 8093.712,
				unit: 'm²'
			});
		});

		it('should force conversion to square feet even when metric is selected', () => {
			// Should force 'ft²' regardless of measureUnitType being 'metric'
			expect(convertArea(100, 'metric', 'square feet')).toEqual({
				area: 1076.3910416709721,
				unit: 'ft²'
			});
		});
	});

	describe('ForceUnit - Explicit auto parameter', () => {
		it('should behave normally when forceUnit is explicitly set to auto', () => {
			expect(convertArea(20000, 'metric', undefined)).toEqual({ area: 2, unit: 'ha' });
			expect(convertArea(8093.712, 'imperial', undefined)).toEqual({ area: 2, unit: 'acres' });
		});
	});

	describe('Custom conversion function', () => {
		it('should return corresponding value when forceAreaUnit is custom callback', () => {
			expect(
				convertArea(1000, 'metric', (areaInSquareMeters) => ({
					area: areaInSquareMeters / 1000,
					unit: 'KM2'
				}))
			).toEqual({ area: 1, unit: 'KM2' });
		});
	});

	describe('Custom unit symbols (measureUnitSymbols)', () => {
		const customSymbols = {
			kilometer: 'km',
			meter: 'm',
			centimeter: 'cm',
			mile: 'mi',
			foot: 'ft',
			inch: 'in',
			'square meters': 'sqm',
			'square kilometers': 'sqkm',
			ares: 'are',
			hectares: 'hect',
			'square feet': 'sqft',
			'square yards': 'sqyd',
			acres: 'ac',
			'square miles': 'sqmi'
		};

		it('should use custom symbols for metric units in auto mode', () => {
			expect(convertArea(50, 'metric', undefined, customSymbols)).toEqual({
				area: 50,
				unit: 'sqm'
			});
			expect(convertArea(5000, 'metric', undefined, customSymbols)).toEqual({
				area: 50,
				unit: 'are'
			});
			expect(convertArea(20000, 'metric', undefined, customSymbols)).toEqual({
				area: 2,
				unit: 'hect'
			});
			expect(convertArea(5000000, 'metric', undefined, customSymbols)).toEqual({
				area: 5,
				unit: 'sqkm'
			});
		});

		it('should use custom symbols for imperial units in auto mode', () => {
			expect(convertArea(0.5, 'imperial', undefined, customSymbols)).toEqual({
				area: 5.381955208354861,
				unit: 'sqft'
			});
			expect(convertArea(1, 'imperial', undefined, customSymbols)).toEqual({
				area: 1.1959900463010802,
				unit: 'sqyd'
			});
			expect(convertArea(8093.712, 'imperial', undefined, customSymbols)).toEqual({
				area: 2,
				unit: 'ac'
			});
			expect(convertArea(5179976.22, 'imperial', undefined, customSymbols)).toEqual({
				area: 2,
				unit: 'sqmi'
			});
		});

		it('should use custom symbols when forceUnit is specified for metric units', () => {
			expect(convertArea(20000, 'metric', 'square meters', customSymbols)).toEqual({
				area: 20000,
				unit: 'sqm'
			});
			expect(convertArea(20000, 'metric', 'ares', customSymbols)).toEqual({
				area: 200,
				unit: 'are'
			});
			expect(convertArea(5000, 'metric', 'hectares', customSymbols)).toEqual({
				area: 0.5,
				unit: 'hect'
			});
			expect(convertArea(500000, 'metric', 'square kilometers', customSymbols)).toEqual({
				area: 0.5,
				unit: 'sqkm'
			});
		});

		it('should use custom symbols when forceUnit is specified for imperial units', () => {
			expect(convertArea(1, 'imperial', 'square feet', customSymbols)).toEqual({
				area: 10.763910416709722,
				unit: 'sqft'
			});
			expect(convertArea(10, 'imperial', 'square yards', customSymbols)).toEqual({
				area: 11.959900463010802,
				unit: 'sqyd'
			});
			expect(convertArea(8093.712, 'imperial', 'acres', customSymbols)).toEqual({
				area: 2,
				unit: 'ac'
			});
			expect(convertArea(2589988.11, 'imperial', 'square miles', customSymbols)).toEqual({
				area: 1,
				unit: 'sqmi'
			});
		});
	});

	describe('Edge cases', () => {
		it('should handle zero values correctly', () => {
			expect(convertArea(0, 'metric')).toEqual({ area: 0, unit: 'm²' });
			expect(convertArea(0, 'imperial')).toEqual({ area: 0, unit: 'ft²' });
		});

		it('should handle very small values', () => {
			expect(convertArea(0.01, 'metric')).toEqual({ area: 0.01, unit: 'm²' });
			expect(convertArea(0.01, 'imperial')).toEqual({
				area: 0.10763910416709722,
				unit: 'ft²'
			});
		});
	});
});
