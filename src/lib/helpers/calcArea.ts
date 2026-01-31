import type {
	MeasureUnitSymbolType,
	MeasureUnitType,
	areaUnitType
} from '../interfaces/MeasureUnit';
import area from '@turf/area';
import type { GeoJSONStoreFeatures } from 'terra-draw';
import { convertArea } from './convertArea';

/**
 * Calculate area from polygon feature
 * @param feature Polygon GeoJSON feature
 * @param unitType measure unit type either metric or imperial
 * @param areaPrecision Precision of area value
 * @param areaUnit If undefined, it will be treated as 'auto' conversion of area unit according the default conversion rules. If a specific unit is set, the value is converted to that unit. If a callback function is set, it will be used for custom conversion.
 * @param measureUnitSymbols Optional parameter to provide custom unit symbols
 * @returns  The returning feature will contain `area`,`unit` properties.
 */
export const calcArea = (
	feature: GeoJSONStoreFeatures,
	unitType: MeasureUnitType,
	areaPrecision: number,
	areaUnit?: areaUnitType,
	measureUnitSymbols?: MeasureUnitSymbolType
) => {
	if (feature.geometry.type !== 'Polygon') return feature;
	// calculate area in m2 by using turf/area
	const result = area(feature.geometry);

	const converted = convertArea(result, unitType, areaUnit, measureUnitSymbols);
	converted.area = parseFloat(converted.area.toFixed(areaPrecision));

	feature.properties.area = converted.area;
	feature.properties.unit = converted.unit;

	return feature;
};
