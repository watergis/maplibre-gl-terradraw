import type { ModeOptions } from '../interfaces/ModeOptions.js';
import {
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawLineStringMode,
	TerraDrawPointMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawRenderMode,
	TerraDrawSectorMode,
	TerraDrawSelectMode,
	TerraDrawSensorMode,
	ValidateNotSelfIntersecting
} from 'terra-draw';

/**
 * get default Terra Draw mode instances.
 * @returns default TerraDrawMode objects. Key is TerraDraw mode name, and value is Terra Draw mode object instance
 */
export const getDefaultModeOptions = () => {
	const modeOptions: ModeOptions = {
		render: new TerraDrawRenderMode({
			modeName: 'render',
			styles: {}
		}),
		point: new TerraDrawPointMode(),
		linestring: new TerraDrawLineStringMode(),
		polygon: new TerraDrawPolygonMode({
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			validation: (feature: MapGeoJSONFeature, e: { updateType: string }) => {
				const updateType = e.updateType;
				if (updateType === 'finish' || updateType === 'commit') {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					return ValidateNotSelfIntersecting(feature);
				}
				return true;
			}
		}),
		rectangle: new TerraDrawRectangleMode(),
		'angled-rectangle': new TerraDrawAngledRectangleMode(),
		circle: new TerraDrawCircleMode(),
		freehand: new TerraDrawFreehandMode(),
		sensor: new TerraDrawSensorMode(),
		sector: new TerraDrawSectorMode(),
		select: new TerraDrawSelectMode({
			flags: {
				point: {
					feature: {
						draggable: true
					}
				},
				polygon: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				linestring: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				freehand: {
					feature: {
						draggable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				circle: {
					feature: {
						draggable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				rectangle: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				'angled-rectangle': {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				sensor: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				sector: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				}
			}
		}),
		delete: new TerraDrawRenderMode({
			modeName: 'delete',
			styles: {}
		}),
		'delete-selection': new TerraDrawRenderMode({
			modeName: 'delete-selection',
			styles: {}
		})
	};
	return modeOptions;
};
