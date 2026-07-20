import { describe, it, expect, beforeEach } from 'vitest';
import { ValhallaResultRegistry } from './valhallaResultRegistry';
import type { GeoJSONStoreFeatures } from 'terra-draw';

const createFeature = (id: string, originalId: string | number): GeoJSONStoreFeatures =>
	({
		id,
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [0, 0] },
		properties: { originalId }
	}) as unknown as GeoJSONStoreFeatures;

describe('ValhallaResultRegistry', () => {
	let registry: ValhallaResultRegistry;

	beforeEach(() => {
		registry = new ValhallaResultRegistry();
	});

	it('should return an empty array for unknown IDs', () => {
		expect(registry.get('unknown')).toEqual([]);
	});

	it('should store and retrieve features by ID', () => {
		const features = [createFeature('a-1', 'a'), createFeature('a-2', 'a')];
		registry.set('a', features);
		expect(registry.get('a')).toEqual(features);
	});

	it('should overwrite previously stored features for the same ID', () => {
		registry.set('a', [createFeature('a-1', 'a')]);
		const updated = [createFeature('a-2', 'a')];
		registry.set('a', updated);
		expect(registry.get('a')).toEqual(updated);
	});

	it('should normalize string and number IDs to the same key', () => {
		const features = [createFeature('1-a', 1)];
		registry.set(1, features);
		expect(registry.get('1')).toEqual(features);

		registry.delete(['1']);
		expect(registry.get(1)).toEqual([]);
	});

	it('should return all features flattened in insertion order', () => {
		const featuresA = [createFeature('a-1', 'a'), createFeature('a-2', 'a')];
		const featuresB = [createFeature('b-1', 'b')];
		registry.set('a', featuresA);
		registry.set('b', featuresB);
		expect(registry.getAll()).toEqual([...featuresA, ...featuresB]);
	});

	it('should delete only the specified IDs', () => {
		registry.set('a', [createFeature('a-1', 'a')]);
		registry.set('b', [createFeature('b-1', 'b')]);
		registry.delete(['a']);
		expect(registry.get('a')).toEqual([]);
		expect(registry.get('b')).toHaveLength(1);
	});

	it('should clear all results when called without IDs', () => {
		registry.set('a', [createFeature('a-1', 'a')]);
		registry.set('b', [createFeature('b-1', 'b')]);
		registry.delete();
		expect(registry.getAll()).toEqual([]);
	});
});
