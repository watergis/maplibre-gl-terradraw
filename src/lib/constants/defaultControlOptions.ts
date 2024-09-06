import type { ControlOptions } from '../interfaces/ControlOptions.js';

/**
 * Default control options
 */
export const defaultControlOptions: ControlOptions = {
	point: true,
	line: true,
	polygon: true,
	rectangle: true,
	circle: true,
	freehand: true,
	angledRectangle: true,
	select: true,
	open: false
};
