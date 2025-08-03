/**
 * Cache configuration interface
 */
export interface ElevationCacheConfig {
	/** Whether to enable caching */
	enabled?: boolean;
	/** Maximum cache size (number of items) */
	maxSize?: number;
	/** TTL (Time To Live) in milliseconds. No expiration if not set */
	ttl?: number;
	/** Coordinate precision (decimal places) - default 6 digits */
	precision?: number;
}
