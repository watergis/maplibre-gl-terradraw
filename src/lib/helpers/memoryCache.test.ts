import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache, type CacheInterface } from './memoryCache';

describe('MemoryCache tests', () => {
	let cache: MemoryCache<string>;

	beforeEach(() => {
		cache = new MemoryCache<string>();
		vi.clearAllTimers();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('Basic functionality', () => {
		it('should implement CacheInterface', () => {
			expect(cache).toBeInstanceOf(MemoryCache);
			expect(cache.get).toBeDefined();
			expect(cache.set).toBeDefined();
			expect(cache.has).toBeDefined();
			expect(cache.delete).toBeDefined();
			expect(cache.clear).toBeDefined();
			expect(cache.size).toBeDefined();
		});

		it('should set and get values', () => {
			cache.set('key1', 'value1');
			expect(cache.get('key1')).toBe('value1');
		});

		it('should return undefined for non-existent keys', () => {
			expect(cache.get('nonexistent')).toBeUndefined();
		});

		it('should check if key exists', () => {
			cache.set('key1', 'value1');
			expect(cache.has('key1')).toBe(true);
			expect(cache.has('nonexistent')).toBe(false);
		});

		it('should delete keys', () => {
			cache.set('key1', 'value1');
			expect(cache.has('key1')).toBe(true);

			const deleted = cache.delete('key1');
			expect(deleted).toBe(true);
			expect(cache.has('key1')).toBe(false);
			expect(cache.get('key1')).toBeUndefined();
		});

		it('should return false when deleting non-existent key', () => {
			const deleted = cache.delete('nonexistent');
			expect(deleted).toBe(false);
		});

		it('should clear all values', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');
			expect(cache.size).toBe(2);

			cache.clear();
			expect(cache.size).toBe(0);
			expect(cache.get('key1')).toBeUndefined();
			expect(cache.get('key2')).toBeUndefined();
		});

		it('should track cache size', () => {
			expect(cache.size).toBe(0);

			cache.set('key1', 'value1');
			expect(cache.size).toBe(1);

			cache.set('key2', 'value2');
			expect(cache.size).toBe(2);

			cache.delete('key1');
			expect(cache.size).toBe(1);
		});
	});

	describe('Size limits', () => {
		it('should respect maxSize limit with FIFO eviction', () => {
			const smallCache = new MemoryCache<string>(2); // maxSize = 2

			smallCache.set('key1', 'value1');
			smallCache.set('key2', 'value2');
			expect(smallCache.size).toBe(2);

			// Adding third item should evict the first
			smallCache.set('key3', 'value3');
			expect(smallCache.size).toBe(2);
			expect(smallCache.get('key1')).toBeUndefined(); // Evicted
			expect(smallCache.get('key2')).toBe('value2');
			expect(smallCache.get('key3')).toBe('value3');
		});

		it('should handle maxSize of 1', () => {
			const tinyCache = new MemoryCache<string>(1);

			tinyCache.set('key1', 'value1');
			expect(tinyCache.size).toBe(1);

			tinyCache.set('key2', 'value2');
			expect(tinyCache.size).toBe(1);
			expect(tinyCache.get('key1')).toBeUndefined();
			expect(tinyCache.get('key2')).toBe('value2');
		});

		it('should use default maxSize when not specified', () => {
			const defaultCache = new MemoryCache<string>();
			const stats = defaultCache.getStats();
			expect(stats.maxSize).toBe(1000);
		});
	});

	describe('TTL (Time To Live)', () => {
		it('should expire items after TTL', () => {
			const ttlCache = new MemoryCache<string>(1000, 5000); // 5 second TTL

			ttlCache.set('key1', 'value1');
			expect(ttlCache.get('key1')).toBe('value1');

			// Fast forward 4 seconds (not expired)
			vi.advanceTimersByTime(4000);
			expect(ttlCache.get('key1')).toBe('value1');

			// Fast forward another 2 seconds (expired)
			vi.advanceTimersByTime(2000);
			expect(ttlCache.get('key1')).toBeUndefined();
			expect(ttlCache.size).toBe(0); // Should be removed
		});

		it('should handle cache without TTL', () => {
			const noTtlCache = new MemoryCache<string>(1000); // No TTL

			noTtlCache.set('key1', 'value1');

			// Fast forward a long time
			vi.advanceTimersByTime(1000000);
			expect(noTtlCache.get('key1')).toBe('value1'); // Should still exist
		});

		it('should handle has() method with expired items', () => {
			const ttlCache = new MemoryCache<string>(1000, 1000); // 1 second TTL

			ttlCache.set('key1', 'value1');
			expect(ttlCache.has('key1')).toBe(true);

			vi.advanceTimersByTime(1500);
			expect(ttlCache.has('key1')).toBe(false);
		});
	});

	describe('cleanupExpired method', () => {
		it('should remove all expired items', () => {
			const ttlCache = new MemoryCache<string>(1000, 2000); // 2 second TTL

			ttlCache.set('key1', 'value1');
			ttlCache.set('key2', 'value2');
			ttlCache.set('key3', 'value3');
			expect(ttlCache.size).toBe(3);

			// Fast forward past TTL
			vi.advanceTimersByTime(3000);

			// Items should still be in cache until cleanup
			expect(ttlCache.size).toBe(3);

			ttlCache.cleanupExpired();
			expect(ttlCache.size).toBe(0);
		});

		it('should not affect cache without TTL', () => {
			const noTtlCache = new MemoryCache<string>(1000); // No TTL

			noTtlCache.set('key1', 'value1');
			noTtlCache.set('key2', 'value2');

			vi.advanceTimersByTime(10000);
			noTtlCache.cleanupExpired();

			expect(noTtlCache.size).toBe(2);
			expect(noTtlCache.get('key1')).toBe('value1');
			expect(noTtlCache.get('key2')).toBe('value2');
		});

		it('should only remove expired items, keep valid ones', () => {
			const ttlCache = new MemoryCache<string>(1000, 3000); // 3 second TTL

			ttlCache.set('key1', 'value1');

			vi.advanceTimersByTime(2000); // 2 seconds passed
			ttlCache.set('key2', 'value2'); // Added after 2 seconds

			vi.advanceTimersByTime(2000); // Total 4 seconds passed
			// key1 should be expired (4 > 3), key2 should be valid (2 < 3)

			ttlCache.cleanupExpired();

			expect(ttlCache.size).toBe(1);
			expect(ttlCache.get('key1')).toBeUndefined();
			expect(ttlCache.get('key2')).toBe('value2');
		});
	});

	describe('getStats method', () => {
		it('should return correct statistics', () => {
			const ttlCache = new MemoryCache<string>(500, 10000);

			const stats = ttlCache.getStats();

			expect(stats.size).toBe(0);
			expect(stats.maxSize).toBe(500);
			expect(stats.ttl).toBe(10000);
		});

		it('should return stats without TTL when not set', () => {
			const noTtlCache = new MemoryCache<string>(100);

			const stats = noTtlCache.getStats();

			expect(stats.size).toBe(0);
			expect(stats.maxSize).toBe(100);
			expect(stats.ttl).toBeUndefined();
		});

		it('should update size in stats', () => {
			cache.set('key1', 'value1');
			cache.set('key2', 'value2');

			const stats = cache.getStats();
			expect(stats.size).toBe(2);
		});
	});

	describe('Type safety', () => {
		it('should work with different types', () => {
			const numberCache = new MemoryCache<number>();
			const objectCache = new MemoryCache<{ id: number; name: string }>();

			numberCache.set('num', 42);
			expect(numberCache.get('num')).toBe(42);

			const testObj = { id: 1, name: 'test' };
			objectCache.set('obj', testObj);
			expect(objectCache.get('obj')).toEqual(testObj);
		});

		it('should handle null and undefined values', () => {
			const nullableCache = new MemoryCache<string | null>();

			nullableCache.set('null', null);

			expect(nullableCache.get('null')).toBeNull();
			expect(nullableCache.has('null')).toBe(true);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty string keys', () => {
			cache.set('', 'empty key');
			expect(cache.get('')).toBe('empty key');
			expect(cache.has('')).toBe(true);
		});

		it('should handle overwriting existing keys', () => {
			cache.set('key1', 'value1');
			cache.set('key1', 'value2');

			expect(cache.get('key1')).toBe('value2');
			expect(cache.size).toBe(1);
		});

		it('should handle very short TTL', () => {
			const shortTtlCache = new MemoryCache<string>(1000, 1); // 1ms TTL

			shortTtlCache.set('key1', 'value1');

			vi.advanceTimersByTime(2);
			expect(shortTtlCache.get('key1')).toBeUndefined();
		});

		it('should handle zero maxSize gracefully', () => {
			const zeroCache = new MemoryCache<string>(0);

			// Should not crash, but won't store anything
			zeroCache.set('key1', 'value1');
			expect(zeroCache.size).toBe(0);
			expect(zeroCache.get('key1')).toBeUndefined();
		});
	});

	describe('Interface compliance', () => {
		it('should satisfy CacheInterface contract', () => {
			const cacheInterface: CacheInterface<string> = new MemoryCache<string>();

			// All interface methods should be available
			cacheInterface.set('test', 'value');
			expect(cacheInterface.get('test')).toBe('value');
			expect(cacheInterface.has('test')).toBe(true);
			expect(cacheInterface.delete('test')).toBe(true);
			expect(cacheInterface.size).toBe(0);

			cacheInterface.set('test2', 'value2');
			cacheInterface.clear();
			expect(cacheInterface.size).toBe(0);
		});
	});
});
