import {
	TerraDrawLineStringMode,
	TerraDrawPointMode,
	TerraDrawRenderMode,
	TerraDrawSelectMode
} from 'terra-draw';
import type { ValhallaControlOptions } from '../interfaces/ValhallaControlOptions';

/**
 * Default ValhallaControl options
 */
export const defaultValhallaControlOptions: ValhallaControlOptions = {
	modes: [
		'render',
		'linestring',
		'point',
		'select',
		'delete-selection',
		'delete',
		'download',
		'settings'
	],
	open: false,
	// see styling parameters of Terra Draw at https://github.com/JamesLMilner/terra-draw/blob/main/guides/5.STYLING.md
	modeOptions: {
		point: new TerraDrawPointMode({
			editable: false,
			styles: {
				pointColor: '#FFFFFF',
				pointWidth: 5,
				pointOutlineColor: '#666666',
				pointOutlineWidth: 1
			}
		}),
		linestring: new TerraDrawLineStringMode({
			editable: false,
			styles: {
				lineStringColor: '#FF0000',
				lineStringWidth: 2,
				closingPointColor: '#FF0000',
				closingPointWidth: 3,
				closingPointOutlineColor: '#666666',
				closingPointOutlineWidth: 1
			}
		}),
		select: new TerraDrawSelectMode({
			flags: {
				point: {
					feature: {
						draggable: false
					}
				},
				linestring: {
					feature: {
						draggable: false,
						rotateable: false,
						scaleable: false,
						coordinates: {
							midpoints: false,
							draggable: false,
							deletable: false
						}
					}
				}
			}
		}),
		settings: new TerraDrawRenderMode({
			modeName: 'settings',
			styles: {}
		})
	},
	valhallaOptions: {
		url: '',
		routingOptions: {
			costingModel: 'auto',
			distanceUnit: 'kilometers'
		},
		isochroneOptions: {
			contourType: 'time',
			costingModel: 'auto',
			contours: [
				{
					time: 3,
					distance: 1,
					color: '#ff0000'
				},
				{
					time: 5,
					distance: 2,
					color: '#ffff00'
				},
				{
					time: 10,
					distance: 3,
					color: '#0000ff'
				},
				{
					time: 15,
					distance: 4,
					color: '#ff00ff'
				}
			]
		}
	},
	adapterOptions: {
		prefixId: 'td-valhalla'
	},
	lineLayerNodeLabelSpec: {
		id: '{prefix}-line-node-label',
		type: 'symbol',
		source: '{prefix}-line-source',
		filter: ['==', '$type', 'Point'],
		layout: {
			'text-field': [
				'case',
				['all', ['has', 'distance'], ['has', 'distance_unit'], ['has', 'time']],
				[
					'concat',
					['to-string', ['get', 'text']],
					'\n',
					['to-string', ['/', ['round', ['*', ['get', 'distance'], 10]], 10]],
					['to-string', ['get', 'distance_unit']],
					'\n',
					['to-string', ['get', 'time']],
					'min'
				],
				['all', ['has', 'costingModel']],
				[
					'concat',
					['to-string', ['get', 'text']],
					'\n(',
					['to-string', ['get', 'costingModel']],
					')'
				],
				['concat', ['to-string', ['get', 'text']]]
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
			'text-justify': 'left',
			'text-letter-spacing': 0.05
		},
		paint: {
			'text-halo-color': '#F7F7F7',
			'text-halo-width': 2,
			'text-color': '#232E3D'
		}
	},
	lineLayerNodeSpec: {
		id: '{prefix}-line-node',
		type: 'circle',
		source: '{prefix}-line-source',
		filter: ['==', '$type', 'Point'],
		layout: {},
		paint: {
			'circle-radius': 3,
			'circle-color': [
				'case',
				['==', ['get', 'text'], 'Start'],
				'#0000FF',
				['==', ['get', 'text'], 'Goal'],
				'#FFFF00',
				'#FFFFFF'
			],
			'circle-stroke-color': '#000000',
			'circle-stroke-width': 1
		}
	},
	isochronePolygonLayerSpec: {
		id: '{prefix}-isochrone-polygon',
		type: 'fill',
		source: '{prefix}-isochrone-source',
		layout: {},
		paint: {
			'fill-color': ['get', 'fillColor'],
			'fill-opacity': ['get', 'fillOpacity']
		}
	},
	isochroneLineLayerSpec: {
		id: '{prefix}-isochrone-line',
		type: 'line',
		source: '{prefix}-isochrone-source',
		layout: {
			'line-join': 'round',
			'line-cap': 'round'
		},
		paint: {
			'line-color': ['get', 'fillColor'],
			'line-width': 3
		}
	},
	isochroneLabelLayerSpec: {
		id: '{prefix}-isochrone-label',
		type: 'symbol',
		source: '{prefix}-isochrone-source',
		layout: {
			'symbol-placement': 'line',
			'text-pitch-alignment': 'viewport',
			'text-field': [
				'concat',
				['get', 'contour'],
				' ',
				[
					'case',
					['==', ['get', 'metric'], 'time'],
					'min',
					['==', ['get', 'metric'], 'distance'],
					'km',
					''
				]
			],
			'text-size': 12,
			'symbol-spacing': 100,
			'text-max-angle': 45
		},
		paint: {
			'text-color': 'rgb(0, 0, 0)',
			'text-halo-width': 1,
			'text-halo-color': 'rgb(255, 255, 255)'
		}
	}
};
