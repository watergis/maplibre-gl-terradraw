import type { ControlOptions } from '$lib/interfaces/ControlOptions.js';

export const defaultControlOptions: ControlOptions = {
	point: true,
	line: true,
	polygon: true,
	rectangle: true,
	circle: true,
	freehand: true,
	angledRectangle: true,
	select: true
};
