/**
 * The unit of area can be metric (m², ha, km²) or imperial (acre, mi²)
 */
export type AreaUnit = 'metric' | 'imperial';

/**
 * The area unit type for metric
 */
export type metricAreaUnit = 'm2' | 'km2' | 'a' | 'ha';

/**
 * The area unit type for imperial
 */
export type imperialAreaUnit = 'ft2' | 'yd2' | 'acre' | 'mi2';

/**
 * The type definition of forceAreaUnitType
 */
export type forceAreaUnitType = 'auto' | metricAreaUnit | imperialAreaUnit;
