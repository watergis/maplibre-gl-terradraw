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
				lineStringColor: '#232E3D',
				lineStringWidth: 2,
				closingPointColor: '#FFFFFF',
				closingPointWidth: 3,
				closingPointOutlineColor: '#232E3D',
				closingPointOutlineWidth: 1
			}
		}),
		polygon: new TerraDrawPolygonMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
				outlineWidth: 2,
				closingPointColor: '#FAFAFA',
				closingPointWidth: 3,
				closingPointOutlineColor: '#232E3D',
				closingPointOutlineWidth: 1
			}
		}),
		rectangle: new TerraDrawRectangleMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
				outlineWidth: 2
			}
		}),
		'angled-rectangle': new TerraDrawAngledRectangleMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
				outlineWidth: 2
			}
		}),
		circle: new TerraDrawCircleMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
				outlineWidth: 2
			}
		}),
		freehand: new TerraDrawFreehandMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
				outlineWidth: 2,
				closingPointColor: '#FAFAFA',
				closingPointWidth: 3,
				closingPointOutlineColor: '#232E3D',
				closingPointOutlineWidth: 1
			}
		}),
		sensor: new TerraDrawSensorMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
				outlineWidth: 2,
				centerPointColor: '#FAFAFA',
				centerPointWidth: 3,
				centerPointOutlineColor: '#232E3D',
				centerPointOutlineWidth: 1
			}
		}),
		sector: new TerraDrawSectorMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#232E3D',
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
			'text-size': [
				'interpolate',
				['linear'],
				['zoom'],
				5,
				10,
				10,
				12.0,
				13,
				14.0,
				14,
				16.0,
				18,
				18.0
			],
			'text-overlap': 'always',
			'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
			'text-radial-offset': 0.5,
			'text-justify': 'center',
			'text-letter-spacing': 0.05
		},
		paint: {
			'text-halo-color': '#F7F7F7',
			'text-halo-width': 2,
			'text-color': '#232E3D'
		}
	},
	lineLayerNodeSpec: {
		id: 'terradraw-measure-line-node',
		type: 'circle',
		source: 'terradraw-measure-line-source',
		filter: ['==', '$type', 'Point'],
		layout: {},
		paint: {
			'circle-radius': 3,
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
			'text-size': [
				'interpolate',
				['linear'],
				['zoom'],
				5,
				10,
				10,
				12.0,
				13,
				14.0,
				14,
				16.0,
				18,
				18.0
			],
			'text-overlap': 'always',
			'text-letter-spacing': 0.05
		},
		paint: {
			'text-halo-color': '#F7F7F7',
			'text-halo-width': 2,
			'text-color': '#232E3D'
		}
	}
};
