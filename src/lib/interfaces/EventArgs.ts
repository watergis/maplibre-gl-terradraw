import type { GeoJSONStoreFeatures, TerraDrawExtend } from 'terra-draw';
import type { TerradrawMode } from './TerradrawMode';

/**
 * Interface of event arguments
 */
export interface EventArgs {
	/**
	 * Current selected features
	 */
	feature?: GeoJSONStoreFeatures[];
	/**
	 * Current selected mode
	 */
	mode: TerradrawMode;
	/**
	 * Deleted feature IDs
	 */
	deletedIds?: TerraDrawExtend.FeatureId[];
}
