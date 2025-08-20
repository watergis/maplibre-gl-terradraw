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
	}
};
