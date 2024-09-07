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
	if (!(options.modes && options.modes.length > 0)) return [];

	const modes = [];

	modes.push(
		new TerraDrawRenderMode({
			modeName: 'render',
			styles: {}
		})
	);

	options.modes.forEach((m) => {
		if (m === 'point') {
			modes.push(new TerraDrawPointMode());
		} else if (m === 'linestring') {
			modes.push(new TerraDrawLineStringMode());
		} else if (m === 'polygon') {
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
		} else if (m === 'rectangle') {
			modes.push(new TerraDrawRectangleMode());
		} else if (m === 'angled-rectangle') {
			modes.push(new TerraDrawAngledRectangleMode());
		} else if (m === 'circle') {
			modes.push(new TerraDrawCircleMode());
		} else if (m === 'freehand') {
			modes.push(new TerraDrawFreehandMode());
		} else if (m === 'select') {
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
	});
	return modes;
};
