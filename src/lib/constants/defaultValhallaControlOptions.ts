import { TerraDrawLineStringMode, TerraDrawRenderMode, TerraDrawSelectMode } from 'terra-draw';
import type { ValhallaControlOptions } from '../interfaces/ValhallaControlOptions';

/**
 * Default ValhallaControl options
 */
export const defaultValhallaControlOptions: ValhallaControlOptions = {
	modes: ['render', 'linestring', 'select', 'delete-selection', 'delete', 'settings', 'download'],
	open: false,
	// see styling parameters of Terra Draw at https://github.com/JamesLMilner/terra-draw/blob/main/guides/5.STYLING.md
	modeOptions: {
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
			meansOfTransport: 'auto',
			distanceUnit: 'kilometers'
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
				['all', ['has', 'meansOfTransport']],
				[
					'concat',
					['to-string', ['get', 'text']],
					'\n(',
					['to-string', ['get', 'meansOfTransport']],
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
	}
};
