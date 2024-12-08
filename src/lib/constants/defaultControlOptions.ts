import type { MeasureControlOptions } from '../interfaces/MeasureControlOptions.js';
import type { TerradrawControlOptions } from '../interfaces/TerradrawControlOptions.js';

/**
 * Default control options
 */
export const defaultControlOptions: TerradrawControlOptions = {
	modes: [
		'render',
		'point',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'sensor',
		'sector',
		'circle',
		'freehand',
		'select',
		'delete-selection',
		'delete'
	],
	open: false
};

/**
 * Default MeasureControl options
 */
export const defaultMeasureControlOptions: MeasureControlOptions = {
	modes: [
		'render',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'sensor',
		'sector',
		'circle',
		'freehand',
		'delete'
	],
	open: false,
	linelayerSpec: {
		id: 'terradraw-measure-line-label',
		type: 'symbol',
		source: 'terradraw-measure-line-source',
		filter: ['match', ['geometry-type'], ['Point'], true, false],
		layout: {
			'text-field': [
				'concat',
				['to-string', ['get', 'distance']],
				' ',
				['get', 'unit'],
				[
					'case',
					['==', ['get', 'total'], 0],
					'',
					['concat', '\n(', ['to-string', ['get', 'total']], ' ', ['get', 'unit'], ')']
				]
			],
			'symbol-placement': 'point',
			'text-font': ['Open Sans Semibold'],
			'text-size': 12,
			'text-overlap': 'always',
			'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
			'text-radial-offset': 1,
			'text-justify': 'center'
		},
		paint: {
			'text-halo-color': '#ffffff',
			'text-halo-width': 10,
			'text-color': '#000000'
		}
	},
	polygonLayerSpec: {
		id: 'terradraw-measure-polygon-label',
		type: 'symbol',
		source: 'terradraw-measure-polygon-source',
		filter: ['match', ['geometry-type'], ['Point'], true, false],
		layout: {
			'text-field': ['concat', ['to-string', ['get', 'area']], ' ', ['get', 'unit']],
			'symbol-placement': 'point',
			'text-font': ['Open Sans Semibold'],
			'text-size': 12,
			'text-overlap': 'always'
		},
		paint: {
			'text-halo-color': '#ffffff',
			'text-halo-width': 4,
			'text-color': '#000000'
		}
	}
};
