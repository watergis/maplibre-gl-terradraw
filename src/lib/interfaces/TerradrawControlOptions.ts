import type { ModeOptions } from './ModeOptions';
import type { TerradrawMode } from './TerradrawMode';
import type { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';

/**
 * TerraDrawMapLibreGLAdapter configuration options defined in:
 * https://github.com/JamesLMilner/terra-draw/blob/971d307727911d14dc111934f9eb5b6096117398/packages/terra-draw-maplibre-gl-adapter/src/terra-draw-maplibre-gl-adapter.ts#L21-L30
 * (Excludes the 'map' property)
 */
export type TerraDrawMapLibreGLAdapterConfig = Omit<
	ConstructorParameters<typeof TerraDrawMapLibreGLAdapter>[0],
	'map'
>;

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

	/**
	 * TerraDrawMaplibreGLAdapter options. Please refer the default adapter settings (BaseAdapterConfig) at the below TerraDraw code.
	 * https://github.com/JamesLMilner/terra-draw/blob/806e319d5680a3f69edeff7dd629da3f1b4ff9bf/src/adapters/common/base.adapter.ts#L28-L48
	 *
	 */
	adapterOptions?: TerraDrawMapLibreGLAdapterConfig;

	/**
	 * Show delete confirmation popup when deleting features if true. Default is false
	 */
	showDeleteConfirmation?: boolean;
}
