/**
 * Cache interface
 */
export interface CacheInterface<T> {
	/**
	 * Get a value from the cache. If the item has expired, it will be removed from the cache.
	 */
	get(key: string): T | undefined;
	/**
	 * set a value in the cache.
	 * If the cache size exceeds maxSize, the oldest item will be removed (FIFO).
	 * If ttl is set, the item will expire after ttl milliseconds.
	 */
	set(key: string, value: T): void;
	/**
	 * Check if a key exists in the cache.
	 */
	has(key: string): boolean;
	/**
	 * Delete a key from the cache.
	 */
	delete(key: string): boolean;
	/**
	 * Clear the cache.
	 */
	clear(): void;
	/**
	 * Get the current size of the cache.
	 */
	size: number;
}

/**
 * Memory cache class
 */
export class MemoryCache<T> implements CacheInterface<T> {
	private cache = new Map<string, { value: T; expiry?: number }>();
	private maxSize: number;
	private ttl?: number;

	constructor(maxSize = 1000, ttl?: number) {
		this.maxSize = maxSize;
		this.ttl = ttl;
	}

	/**
	 * Get a value from the cache. If the item has expired, it will be removed from the cache.
	 */
	get(key: string): T | undefined {
		const item = this.cache.get(key);
		if (!item) return undefined;

		if (item.expiry && Date.now() > item.expiry) {
			this.cache.delete(key);
			return undefined;
		}

		return item.value;
	}

	/**
	 * set a value in the cache.
	 * If the cache size exceeds maxSize, the oldest item will be removed (FIFO).
	 * If ttl is set, the item will expire after ttl milliseconds.
	 */
	set(key: string, value: T): void {
		if (this.maxSize === 0) return;
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			if (firstKey) this.cache.delete(firstKey);
		}

		const expiry = this.ttl ? Date.now() + this.ttl : undefined;
		this.cache.set(key, { value, expiry });
	}

	/**
	 * Check if a key exists in the cache.
	 */
	has(key: string): boolean {
		return this.get(key) !== undefined;
	}

	/**
	 * Delete a key from the cache.
	 */
	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	/**
	 * Clear the cache.
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get the current size of the cache.
	 */
	get size(): number {
		return this.cache.size;
	}

	/**
	 * Cleanup expired items from the cache.
	 */
	cleanupExpired(): void {
		if (!this.ttl) return;

		const now = Date.now();
		for (const [key, item] of this.cache.entries()) {
			if (item.expiry && now > item.expiry) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Get cache statistics.
	 */
	getStats(): {
		size: number;
		maxSize: number;
		ttl?: number;
		hitRate?: number;
	} {
		return {
			size: this.size,
			maxSize: this.maxSize,
			ttl: this.ttl
		};
	}
}
