import {
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawLineStringMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawSectorMode,
	TerraDrawSensorMode
} from 'terra-draw';
import type { MeasureControlOptions } from '../interfaces/MeasureControlOptions.js';

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
		'select',
		'delete-selection',
		'delete',
		'download'
	],
	open: false,
	// see styling parameters of Terra Draw at https://github.com/JamesLMilner/terra-draw/blob/main/guides/5.STYLING.md
	modeOptions: {
		linestring: new TerraDrawLineStringMode({
			styles: {
				lineStringColor: '#000000',
				lineStringWidth: 2,
				closingPointColor: '#FFFFFF',
				closingPointWidth: 5,
				closingPointOutlineColor: '#000000',
				closingPointOutlineWidth: 1
			}
		}),
		polygon: new TerraDrawPolygonMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2,
				closingPointColor: '#FFFFFF',
				closingPointWidth: 5,
				closingPointOutlineColor: '#000000',
				closingPointOutlineWidth: 1
			}
		}),
		rectangle: new TerraDrawRectangleMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2
			}
		}),
		'angled-rectangle': new TerraDrawAngledRectangleMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2
			}
		}),
		circle: new TerraDrawCircleMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2
			}
		}),
		freehand: new TerraDrawFreehandMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2
			}
		}),
		sensor: new TerraDrawSensorMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2,
				centerPointColor: '#FFFFFF',
				centerPointWidth: 5,
				centerPointOutlineColor: '#000000',
				centerPointOutlineWidth: 1
			}
		}),
		sector: new TerraDrawSectorMode({
			styles: {
				fillColor: '#FFFFFF',
				fillOpacity: 0.7,
				outlineColor: '#000000',
				outlineWidth: 2
			}
		})
	},
	lineLayerLabelSpec: {
		id: 'terradraw-measure-line-label',
		type: 'symbol',
		source: 'terradraw-measure-line-source',
		filter: ['==', '$type', 'Point'],
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
				],
				[
					'case',
					['all', ['has', 'elevation'], ['>', ['get', 'elevation'], 0]],
					['concat', '\nAlt. ', ['to-string', ['floor', ['get', 'elevation']]], ' m'],
					''
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
	lineLayerNodeSpec: {
		id: 'terradraw-measure-line-node',
		type: 'circle',
		source: 'terradraw-measure-line-source',
		filter: ['==', '$type', 'Point'],
		layout: {},
		paint: {
			'circle-radius': 5,
			'circle-color': '#FFFFFF',
			'circle-stroke-color': '#000000',
			'circle-stroke-width': 1
		}
	},
	polygonLayerSpec: {
		id: 'terradraw-measure-polygon-label',
		type: 'symbol',
		source: 'terradraw-measure-polygon-source',
		filter: ['==', '$type', 'Point'],
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
