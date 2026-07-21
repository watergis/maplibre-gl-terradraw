import { describe, it, expect, vi, afterEach } from 'vitest';

// This suite drives real TerraDrawLineStringMode/TerraDrawBaseDrawMode behavior
// (state machine, store validation, closing points), so it opts out of the
// project-wide terra-draw mock declared in src/setupTest.ts.
vi.unmock('terra-draw');

import { TerraDrawExtend } from 'terra-draw';
import {
	TerraDrawValhallaRoutingMode,
	type ValhallaRoutingModeOptions
} from './TerraDrawValhallaRoutingMode';

/* eslint-disable @typescript-eslint/no-explicit-any */

const { GeoJSONStore } = TerraDrawExtend;

vi.mock('../helpers/valhallaRouting', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../helpers/valhallaRouting')>();
	return {
		...actual,
		ValhallaRouting: vi.fn().mockImplementation(function () {
			return {
				calcRoute: vi.fn().mockResolvedValue({
					feature: {
						type: 'Feature',
						geometry: {
							type: 'LineString',
							coordinates: [
								[30.0, -2.0],
								[30.01, -2.01],
								[30.02, -2.02]
							]
						},
						properties: {
							costingModel: 'Car',
							distance: 1.5,
							distance_unit: 'km',
							time: 3
						}
					},
					pointFeatures: {
						type: 'FeatureCollection',
						features: [
							{
								type: 'Feature',
								id: 'node-0',
								geometry: { type: 'Point', coordinates: [30.0, -2.0] },
								properties: { sequence: 0, text: 'Start' }
							},
							{
								type: 'Feature',
								id: 'node-1',
								geometry: { type: 'Point', coordinates: [30.02, -2.02] },
								properties: {
									sequence: 1,
									text: 'Goal',
									distance: 1.5,
									distance_unit: 'km',
									time: 3
								}
							}
						]
					}
				})
			};
		})
	};
});

vi.mock('maplibre-gl', () => ({
	LngLat: class {
		lng: number;
		lat: number;
		constructor(lng: number, lat: number) {
			this.lng = lng;
			this.lat = lat;
		}
	}
}));

const mockEvent = (overrides = {}): any => ({
	lng: 30.0,
	lat: -2.0,
	containerX: 100,
	containerY: 200,
	button: 'left',
	heldKeys: [],
	...overrides
});

function mountMode(options: Partial<ValhallaRoutingModeOptions> = {}) {
	const mode = new TerraDrawValhallaRoutingMode({
		url: 'https://valhalla.test.com',
		costingModel: 'auto',
		distanceUnit: 'kilometers',
		...options
	});
	const store = new GeoJSONStore();
	mode.register({
		mode: 'routing',
		store,
		setDoubleClickToZoom: vi.fn(),
		setCursor: vi.fn(),
		onChange: vi.fn(),
		onSelect: vi.fn(),
		onDeselect: vi.fn(),
		onFinish: vi.fn(),
		project: vi.fn((lng: number, lat: number) => ({ x: lng * 100, y: lat * 100 })),
		unproject: vi.fn((x: number, y: number) => ({ lng: x / 100, lat: y / 100 })),
		coordinatePrecision: 9,
		undoRedoMaxStackSize: 3
	} as any);
	mode.start();
	return { mode, store };
}

describe('TerraDrawValhallaRoutingMode', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('lifecycle', () => {
		it('initialises with correct mode name', () => {
			const mode = new TerraDrawValhallaRoutingMode({ url: 'https://test.com' });
			expect(mode.mode).toBe('routing');
		});

		it('sets options from constructor', () => {
			const mode = new TerraDrawValhallaRoutingMode({
				url: 'https://test.com',
				costingModel: 'bicycle',
				distanceUnit: 'miles'
			});
			expect(mode.url).toBe('https://test.com');
			expect(mode.costingModel).toBe('bicycle');
			expect(mode.distanceUnit).toBe('miles');
		});

		it('defaults costingModel to auto and distanceUnit to kilometers', () => {
			const mode = new TerraDrawValhallaRoutingMode({ url: '' });
			expect(mode.costingModel).toBe('auto');
			expect(mode.distanceUnit).toBe('kilometers');
		});

		it('start/stop/cleanUp leave no orphaned features', () => {
			const { mode, store } = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			expect(store.copyAll().length).toBeGreaterThan(0);
			mode.stop();
			expect(store.copyAll()).toEqual([]);
		});
	});

	describe('drawing interaction', () => {
		it('first click creates a LineString feature', () => {
			const { mode, store } = mountMode();
			mode.onClick(mockEvent());
			const features = store.copyAll();
			expect(features).toHaveLength(1);
			expect(features[0].geometry.type).toBe('LineString');
			expect(features[0].properties?.mode).toBe('routing');
		});

		it('subsequent click adds a coordinate', () => {
			const { mode, store } = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			mode.onClick(mockEvent({ lng: 30.02, lat: -2.02 }));

			const lineFeatures = store.copyAll().filter((f) => f.geometry.type === 'LineString');
			expect(lineFeatures).toHaveLength(1);
			const geometry = lineFeatures[0].geometry as any;
			expect(geometry.coordinates.length).toBeGreaterThanOrEqual(3);
		});

		it('does not create a duplicate line feature on subsequent clicks', () => {
			const { mode, store } = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			const lineFeatures = store.copyAll().filter((f) => f.geometry.type === 'LineString');
			expect(lineFeatures).toHaveLength(1);
		});
	});

	describe('Enter key finishes', () => {
		it('Enter finishes drawing and triggers routing', async () => {
			const { mode, store } = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			mode.onClick(mockEvent({ lng: 30.02, lat: -2.02 }));

			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				const line = store.copyAll().find((f) => f.geometry.type === 'LineString');
				expect((line?.geometry as any).coordinates).toEqual([
					[30.0, -2.0],
					[30.01, -2.01],
					[30.02, -2.02]
				]);
			});
		});
	});

	describe('Escape cancels', () => {
		it('Escape deletes the in-progress feature and makes no routing call', async () => {
			const { ValhallaRouting } = await import('../helpers/valhallaRouting');
			const { mode, store } = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));

			mode.onKeyUp({ key: 'Escape', heldKeys: [], preventDefault: vi.fn() } as any);

			expect(store.copyAll()).toEqual([]);
			await new Promise((r) => setTimeout(r, 20));
			expect(ValhallaRouting).not.toHaveBeenCalled();
		});
	});

	describe('computeRoute', () => {
		it('calls ValhallaRouting with correct parameters', async () => {
			const { ValhallaRouting } = await import('../helpers/valhallaRouting');
			const { mode } = mountMode({ costingModel: 'bicycle', distanceUnit: 'miles' });

			await (mode as any).computeRoute('feature-1', [
				[30.0, -2.0],
				[30.01, -2.01],
				[30.02, -2.02]
			]);

			expect(ValhallaRouting).toHaveBeenCalledWith('https://valhalla.test.com');
		});

		it('updates feature geometry on success', async () => {
			const { mode, store } = mountMode();
			const [featureId] = store.create([
				{
					geometry: {
						type: 'LineString',
						coordinates: [
							[30.0, -2.0],
							[30.02, -2.02]
						]
					},
					properties: { mode: 'routing' }
				}
			]);

			await (mode as any).computeRoute(featureId, [
				[30.0, -2.0],
				[30.01, -2.01],
				[30.02, -2.02]
			]);

			const geometry = store.getGeometryCopy(featureId) as any;
			expect(geometry.coordinates).toEqual([
				[30.0, -2.0],
				[30.01, -2.01],
				[30.02, -2.02]
			]);
		});

		it('stores route summary in feature properties without maneuvers on node points', async () => {
			const { mode, store } = mountMode();
			const [featureId] = store.create([
				{
					geometry: {
						type: 'LineString',
						coordinates: [
							[30.0, -2.0],
							[30.02, -2.02]
						]
					},
					properties: { mode: 'routing' }
				}
			]);

			await (mode as any).computeRoute(featureId, [
				[30.0, -2.0],
				[30.01, -2.01],
				[30.02, -2.02]
			]);

			const routeFeature = store.copyAll().find((f) => f.id === featureId);
			expect(routeFeature?.properties).toMatchObject({
				groupId: String(featureId),
				costingModel: 'auto',
				distance: 1.5,
				distance_unit: 'km',
				time: 3
			});

			const nodeFeatures = store.copyAll().filter((f) => f.geometry.type === 'Point');
			expect(nodeFeatures).toHaveLength(2);
			for (const f of nodeFeatures) {
				expect(f.properties).not.toHaveProperty('maneuvers');
				expect(f.properties).toMatchObject({
					mode: 'routing',
					originalId: String(featureId),
					groupId: String(featureId)
				});
			}
			expect(nodeFeatures[0].properties?.text).toBe('Start');
			expect(nodeFeatures[1].properties?.text).toBe('Goal');
		});

		it('calls onFinish after successful computation', async () => {
			const { mode, store } = mountMode();
			const onFinishSpy = vi.fn();
			(mode as any).onFinish = onFinishSpy;
			const [featureId] = store.create([
				{
					geometry: {
						type: 'LineString',
						coordinates: [
							[30.0, -2.0],
							[30.02, -2.02]
						]
					},
					properties: { mode: 'routing' }
				}
			]);

			await (mode as any).computeRoute(featureId, [
				[30.0, -2.0],
				[30.01, -2.01],
				[30.02, -2.02]
			]);

			expect(onFinishSpy).toHaveBeenCalledWith(featureId, { mode: 'routing', action: 'draw' });
		});

		it('does not compute when url is empty', async () => {
			const { ValhallaRouting } = await import('../helpers/valhallaRouting');
			const { mode } = mountMode({ url: '' });

			await (mode as any).computeRoute('feature-1', [
				[30.0, -2.0],
				[30.01, -2.01]
			]);

			expect(ValhallaRouting).not.toHaveBeenCalled();
		});
	});

	describe('public property setters', () => {
		it('url setter updates the url', () => {
			const { mode } = mountMode();
			mode.url = 'https://new-url.com';
			expect(mode.url).toBe('https://new-url.com');
		});

		it('costingModel setter updates the costing model', () => {
			const { mode } = mountMode();
			mode.costingModel = 'pedestrian';
			expect(mode.costingModel).toBe('pedestrian');
		});

		it('distanceUnit setter updates the distance unit', () => {
			const { mode } = mountMode();
			mode.distanceUnit = 'miles';
			expect(mode.distanceUnit).toBe('miles');
		});
	});

	describe('validateFeature', () => {
		it('returns valid for LineString with mode=routing', () => {
			const { mode } = mountMode();
			const result = mode.validateFeature({
				id: crypto.randomUUID(),
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [
						[0, 0],
						[1, 1]
					]
				},
				properties: { mode: 'routing' }
			} as any);
			expect(result.valid).toBe(true);
		});

		it('returns valid for node Point with originalId', () => {
			const { mode } = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'routing', originalId: 'feature-1' }
			} as any);
			expect(result.valid).toBe(true);
		});

		it('returns invalid for node Point with wrong mode', () => {
			const { mode } = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'linestring', originalId: 'feature-1' }
			} as any);
			expect(result.valid).toBe(false);
		});
	});

	describe('styleFeature', () => {
		it('styles node points by their text label', () => {
			const { mode } = mountMode();
			const styleOf = (text: string) =>
				mode.styleFeature({
					id: '1',
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [0, 0] },
					properties: { mode: 'routing', originalId: 'feature-1', text }
				} as any);
			expect(styleOf('Start').pointColor).toBe('#0000FF');
			expect(styleOf('Goal').pointColor).toBe('#FFFF00');
			expect(styleOf('No.2').pointColor).toBe('#FFFFFF');
		});

		it('styles node points with default width and outline', () => {
			const { mode } = mountMode();
			const style = mode.styleFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'routing', originalId: 'feature-1', text: 'Start' }
			} as any);
			expect(style.pointWidth).toBe(3);
			expect(style.pointOutlineColor).toBe('#000000');
			expect(style.pointOutlineWidth).toBe(1);
		});

		it('allows node point styles to be overridden per node type', () => {
			const { mode } = mountMode({
				styles: {
					startPointColor: '#111111',
					startPointWidth: 8,
					startPointOutlineColor: '#111100',
					startPointOutlineWidth: 2,
					goalPointColor: '#222222',
					goalPointWidth: 9,
					goalPointOutlineColor: '#222200',
					goalPointOutlineWidth: 3,
					viaPointColor: '#333333',
					viaPointWidth: 10,
					viaPointOutlineColor: '#333300',
					viaPointOutlineWidth: 4
				}
			});
			const styleOf = (text: string) =>
				mode.styleFeature({
					id: '1',
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [0, 0] },
					properties: { mode: 'routing', originalId: 'feature-1', text }
				} as any);

			expect(styleOf('Start')).toMatchObject({
				pointColor: '#111111',
				pointWidth: 8,
				pointOutlineColor: '#111100',
				pointOutlineWidth: 2
			});
			expect(styleOf('Goal')).toMatchObject({
				pointColor: '#222222',
				pointWidth: 9,
				pointOutlineColor: '#222200',
				pointOutlineWidth: 3
			});
			expect(styleOf('No.2')).toMatchObject({
				pointColor: '#333333',
				pointWidth: 10,
				pointOutlineColor: '#333300',
				pointOutlineWidth: 4
			});
		});

		it('delegates non-node-point features to the base LineString styling', () => {
			const { mode } = mountMode({
				styles: { lineStringColor: '#00FF00', lineStringWidth: 4 }
			});
			const style = mode.styleFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'LineString', coordinates: [] },
				properties: { mode: 'routing' }
			} as any);
			expect(style.lineStringColor).toBe('#00FF00');
			expect(style.lineStringWidth).toBe(4);
		});
	});
});
