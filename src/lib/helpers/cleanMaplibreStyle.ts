import { defaultMeasureControlOptions } from '../constants';
import type { StyleSpecification } from 'maplibre-gl';

export const TERRADRAW_SOURCE_IDS = [
	'td-point',
	'td-point-lower',
	'td-linestring',
	'td-polygon',
	'td-polygon-outline'
];
export const TERRADRAW_MEASURE_SOURCE_IDS = [
	...TERRADRAW_SOURCE_IDS,
	defaultMeasureControlOptions.polygonLayerSpec?.source as string,
	defaultMeasureControlOptions.lineLayerLabelSpec?.source as string,
	defaultMeasureControlOptions.pointLayerLabelSpec?.source as string
];

/**
 * clean maplibre style to filter only for terradraw related layers or without them.
 * If options are not set, returns original style given to the function.
 *
 * This can be useful incase users only want to get terradraw related layers or without it.
 *
 * Usage:
 * `cleanMaplibreStyle(map.getStyle, { excludeTerraDrawLayers: true})`
 * `cleanMaplibreStyle(map.getStyle, { onlyTerraDrawLayers: true})`
 *
 * @param style maplibre style spec
 * @param options.excludeTerraDrawLayers return maplibre style without terradraw layers and sources
 * @param options.onlyTerraDrawLayers return maplibre style with only terradraw layers and sources
 * @param sourceIds terradraw related source IDs (internally used). Use TERRADRAW_SOURCE_IDS or TERRADRAW_MEASURE_SOURCE_IDS
 * @returns maplibre style spec
 */
export const cleanMaplibreStyle = (
	style: StyleSpecification,
	options?: { excludeTerraDrawLayers?: boolean; onlyTerraDrawLayers?: boolean },
	sourceIds = TERRADRAW_SOURCE_IDS
) => {
	const cloned: StyleSpecification = JSON.parse(JSON.stringify(style));
	if (options) {
		if (options.onlyTerraDrawLayers === true) {
			cloned.layers = cloned.layers.filter((l) => {
				return 'source' in l && sourceIds.includes(l.source);
			});
			Object.keys(cloned.sources).forEach((key) => {
				if (!sourceIds.includes(key)) {
					delete cloned.sources[key];
				}
			});
		} else if (options.excludeTerraDrawLayers === true) {
			cloned.layers = cloned.layers.filter((l) => {
				return ('source' in l && !sourceIds.includes(l.source)) || l.type === 'background';
			});
			Object.keys(cloned.sources).forEach((key) => {
				if (sourceIds.includes(key)) {
					delete cloned.sources[key];
				}
			});
		}
	}
	return cloned;
};
