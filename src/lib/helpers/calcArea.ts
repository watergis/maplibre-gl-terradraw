import type { MeasureUnitType, forceAreaUnitType } from '../interfaces/MeasureUnit';
import area from '@turf/area';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { convertAreaUnit } from './convertAreaUnit';

/**
 * Calculate area from polygon feature
 * @param feature Polygon GeoJSON feature
 * @param areaUnit Area unit
 * @param areaPrecision Precision of area value
 * @param forceUnit Default is `auto`. If `auto` is set, unit is converted depending on the value and selection of area unit. If a specific unit is specified, it returns the value always the same. If a selected unit is not the same type of unit either metric of imperial, it will be ignored, and `auto` will be applied.
 * @returns  The returning feature will contain `area`,`unit` properties.
 */
export const calcArea = (
	feature: GeoJSONStoreFeatures,
	unitType: MeasureUnitType,
	areaPrecision: number,
	forceUnit?: forceAreaUnitType
) => {
	if (feature.geometry.type !== 'Polygon') return feature;
	// caculate area in m2 by using turf/area
	const result = area(feature.geometry);

	const converted = convertAreaUnit(result, unitType, forceUnit);
	converted.area = parseFloat(converted.area.toFixed(areaPrecision));

	feature.properties.area = converted.area;
	feature.properties.unit = converted.unit;

	return feature;
};
