import type { ControlOptions } from '../interfaces/ControlOptions.js';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import {
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawLineStringMode,
	TerraDrawPointMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawRenderMode,
	TerraDrawSelectMode,
	ValidateNotSelfIntersecting
} from 'terra-draw';

/**
 * This function returns an array of enabled terradraw mode objects from control option
 * @param options Terradraw control options
 * @returns return an array of enabled terradraw mode objects
 */
export const getTerraDrawModes = (options: ControlOptions) => {
	const modes = [];

	modes.push(
		new TerraDrawRenderMode({
			modeName: 'render',
			styles: {}
		})
	);

	if (options.point === true) {
		modes.push(new TerraDrawPointMode());
	}
	if (options.line === true) {
		modes.push(new TerraDrawLineStringMode());
	}
	if (options.polygon === true) {
		modes.push(
			new TerraDrawPolygonMode({
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
			})
		);
	}
	if (options.rectangle === true) {
		modes.push(new TerraDrawRectangleMode());
	}
	if (options.angledRectangle === true) {
		modes.push(new TerraDrawAngledRectangleMode());
	}
	if (options.circle === true) {
		modes.push(new TerraDrawCircleMode());
	}
	if (options.freehand === true) {
		modes.push(new TerraDrawFreehandMode());
	}

	if (options.select === true) {
		modes.push(
			new TerraDrawSelectMode({
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
					}
				}
			})
		);
	}

	return modes;
};
