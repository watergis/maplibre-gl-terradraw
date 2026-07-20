import { type GeoJSONStoreFeatures, type TerraDrawExtend } from 'terra-draw';

/**
 * In-memory registry to keep computed result features (isochrone polygons or
 * routing node points) of Valhalla modes, keyed by the original TerraDraw feature ID.
 *
 * Keys are normalized to string internally because TerraDraw feature IDs can be
 * either string or number depending on the ID strategy, while deletion events
 * deliver IDs as strings.
 */
export class ValhallaResultRegistry {
	private results = new Map<string, GeoJSONStoreFeatures[]>();

	/**
	 * Store result features for the given original feature ID.
	 * Overwrites any previously stored result for the same ID.
	 * @param id Original TerraDraw feature ID
	 * @param features Computed result features
	 */
	public set(id: TerraDrawExtend.FeatureId, features: GeoJSONStoreFeatures[]): void {
		this.results.set(String(id), features);
	}

	/**
	 * Get result features for the given original feature ID.
	 * @param id Original TerraDraw feature ID
	 * @returns Stored result features, or an empty array if none exist
	 */
	public get(id: TerraDrawExtend.FeatureId): GeoJSONStoreFeatures[] {
		return this.results.get(String(id)) ?? [];
	}

	/**
	 * Get all stored result features flattened into a single array (insertion order).
	 * @returns All result features
	 */
	public getAll(): GeoJSONStoreFeatures[] {
		return [...this.results.values()].flat();
	}

	/**
	 * Delete result features.
	 * @param ids Original TerraDraw feature IDs to delete. If omitted, all results are cleared.
	 */
	public delete(ids?: TerraDrawExtend.FeatureId[]): void {
		if (ids === undefined) {
			this.results.clear();
			return;
		}
		for (const id of ids) {
			this.results.delete(String(id));
		}
	}
}
