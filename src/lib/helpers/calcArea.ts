import type { AreaUnit } from '../interfaces/AreaUnit';
import area from '@turf/area';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { convertAreaUnit } from './convertAreaUnit';

/**
 * Calculate area from polygon feature
 * @param feature Polygon GeoJSON feature
 * @param areaUnit Area unit
 * @param areaPrecision Precision of area value
 * @returns  The returning feature will contain `area`,`unit` properties.
 */
export const calcArea = (
	feature: GeoJSONStoreFeatures,
	areaUnit: AreaUnit,
	areaPrecision: number
) => {
	if (feature.geometry.type !== 'Polygon') return feature;
	// caculate area in m2 by using turf/area
	const result = area(feature.geometry);

	const converted = convertAreaUnit(result, areaUnit);
	converted.area = parseFloat(converted.area.toFixed(areaPrecision));

	feature.properties.area = converted.area;
	feature.properties.unit = converted.unit;

	return feature;
};
