import type { ModeOptions } from './ModeOptions.js';
import type { TerradrawMode } from './TerradrawMode.js';

/**
 * Terradraw Control Plugin control constructor options
 */
export interface TerradrawControlOptions {
	/**
	 * Terradraw modes added to the control.
	 * The mode will be added in the same order of the array.
	 * Default is all modes in the below order:
	 * ['point', 'linestring', 'polygon', 'rectangle', 'angled-rectangle', 'circle', 'freehand', 'select']
	 *
	 * You can change the order of modes, or can get rid of some modes which you don't need for your app.
	 */
	modes?: TerradrawMode[];
	/**
	 * Open editor as default if true. Default is false
	 */
	open?: boolean;

	/**
	 * Overwrite Terra Draw mode options if you specified.
	 */
	modeOptions?: ModeOptions;
}
