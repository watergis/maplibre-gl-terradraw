import { describe, it, expect, vi, afterEach } from 'vitest';
import { TerraDrawValhallaRoutingMode } from './TerraDrawValhallaRoutingMode';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

const mockStore = () => ({
	create: vi.fn().mockReturnValue(['feature-1']),
	delete: vi.fn(),
	copyAll: vi.fn().mockReturnValue([]),
	updateGeometry: vi.fn(),
	updateProperty: vi.fn()
});

const mountMode = (options: Partial<any> = {}) => {
	const mode = new TerraDrawValhallaRoutingMode({
		url: 'https://valhalla.test.com',
		costingModel: 'auto',
		distanceUnit: 'kilometers',
		...options
	});

	(mode as any).store = mockStore();
	(mode as any).project = vi.fn().mockReturnValue({ x: 100, y: 200 });
	(mode as any).setCursor = vi.fn();
	(mode as any).onFinish = vi.fn();
	(mode as any).setStarted = vi.fn();
	(mode as any).setStopped = vi.fn();
	(mode as any).pointerDistance = 40;

	return mode;
};

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

		it('start() sets started state and crosshair cursor', () => {
			const mode = mountMode();
			mode.start();
			expect((mode as any).setStarted).toHaveBeenCalled();
			expect((mode as any).setCursor).toHaveBeenCalledWith('crosshair');
		});

		it('stop() calls cleanUp, setStopped and resets cursor', () => {
			const mode = mountMode();
			const cleanUpSpy = vi.spyOn(mode as any, 'cleanUp');
			mode.stop();
			expect(cleanUpSpy).toHaveBeenCalled();
			expect((mode as any).setStopped).toHaveBeenCalled();
			expect((mode as any).setCursor).toHaveBeenCalledWith('unset');
		});

		it('cleanUp() deletes in-progress feature and resets state', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.cleanUp();
			expect((mode as any).store.delete).toHaveBeenCalledWith(['feature-1']);
			expect((mode as any).currentFeatureId).toBeNull();
			expect((mode as any).currentCoordinates).toEqual([]);
		});
	});

	describe('drawing interaction', () => {
		it('first click creates a LineString feature', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			expect((mode as any).store.create).toHaveBeenCalledWith([
				{
					geometry: {
						type: 'LineString',
						coordinates: [
							[30.0, -2.0],
							[30.0, -2.0]
						]
					},
					properties: { mode: 'routing' }
				}
			]);
			expect((mode as any).currentFeatureId).toBe('feature-1');
		});

		it('subsequent click adds coordinate', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));

			expect((mode as any).store.updateGeometry).toHaveBeenCalledWith([
				{
					id: 'feature-1',
					geometry: {
						type: 'LineString',
						coordinates: [
							[30.0, -2.0],
							[30.01, -2.01],
							[30.0, -2.0]
						]
					}
				}
			]);
		});

		it('does not create duplicate features on second click', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			expect((mode as any).store.create).toHaveBeenCalledTimes(1);
		});
	});

	describe('double click finishes drawing', () => {
		it('finishes drawing on double click with 2+ nodes', async () => {
			const mode = mountMode();

			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			// Double click (same coord, within 300ms)
			vi.spyOn(Date, 'now').mockReturnValue(1000);
			mode.onClick(mockEvent({ lng: 31.0, lat: -3.0 }));
			vi.spyOn(Date, 'now').mockReturnValue(1100);
			mode.onClick(mockEvent({ lng: 31.0, lat: -3.0 }));

			await vi.waitFor(() => {
				expect((mode as any).currentFeatureId).toBeNull();
			});
		});

		it('does not finish on double click with only 1 node', () => {
			const mode = mountMode();

			vi.spyOn(Date, 'now').mockReturnValue(1000);
			mode.onClick(mockEvent());
			vi.spyOn(Date, 'now').mockReturnValue(1100);
			mode.onClick(mockEvent());

			// Only 1 real node + cursor, length is 2, should NOT finish
			expect((mode as any).currentFeatureId).toBe('feature-1');
		});
	});

	describe('Enter key finishes', () => {
		it('Enter finishes drawing when 3+ coordinates exist', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));

			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				expect((mode as any).currentFeatureId).toBeNull();
			});
		});

		it('Enter does nothing when less than 3 coordinates', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			expect((mode as any).currentFeatureId).toBe('feature-1');
		});
	});

	describe('Escape cancels', () => {
		it('Escape deletes in-progress feature and resets', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			mode.onKeyUp({ key: 'Escape', heldKeys: [], preventDefault: vi.fn() } as any);

			expect((mode as any).store.delete).toHaveBeenCalledWith(['feature-1']);
			expect((mode as any).currentFeatureId).toBeNull();
			expect((mode as any).currentCoordinates).toEqual([]);
		});

		it('Escape does nothing when no drawing in progress', () => {
			const mode = mountMode();
			mode.onKeyUp({ key: 'Escape', heldKeys: [], preventDefault: vi.fn() } as any);
			expect((mode as any).store.delete).not.toHaveBeenCalled();
		});
	});

	describe('computeRoute', () => {
		it('calls ValhallaRouting with correct parameters', async () => {
			const { ValhallaRouting } = await import('../helpers/valhallaRouting');
			const mode = mountMode({ costingModel: 'bicycle', distanceUnit: 'miles' });

			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				expect(ValhallaRouting).toHaveBeenCalledWith('https://valhalla.test.com');
			});
		});

		it('updates feature geometry on success', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				const calls = (mode as any).store.updateGeometry.mock.calls;
				const lastCall = calls[calls.length - 1];
				expect(lastCall[0][0].geometry.coordinates).toEqual([
					[30.0, -2.0],
					[30.01, -2.01],
					[30.02, -2.02]
				]);
			});
		});

		it('stores route result in feature properties', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				expect((mode as any).store.updateProperty).toHaveBeenCalled();
				const call = (mode as any).store.updateProperty.mock.calls[0][0];
				expect(call[0].property).toBe('routeResult');
				expect(call[1].property).toBe('costingModel');
				expect(call[1].value).toBe('auto');
			});
		});

		it('calls onFinish after successful computation', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				expect((mode as any).onFinish).toHaveBeenCalledWith('feature-1', {
					mode: 'routing',
					action: 'draw'
				});
			});
		});

		it('does not compute when url is empty', async () => {
			const { ValhallaRouting } = await import('../helpers/valhallaRouting');
			const mode = mountMode({ url: '' });
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await new Promise((r) => setTimeout(r, 50));
			const routingInstance = (ValhallaRouting as any).mock.results[0];
			expect(routingInstance).toBeUndefined();
		});
	});

	describe('result registry', () => {
		const drawRoute = async (mode: any) => {
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);
			await vi.waitFor(() => {
				expect(mode.onFinish).toHaveBeenCalled();
			});
		};

		it('getResultFeatures returns node point features with originalId', async () => {
			const mode = mountMode();
			await drawRoute(mode);

			const features = mode.getResultFeatures('feature-1');
			expect(features).toHaveLength(2);
			expect(features[0].id).toBe('feature-1-node-0');
			expect(features[0].properties.originalId).toBe('feature-1');
		});

		it('registry is populated before onFinish fires', async () => {
			const mode = mountMode();
			let lengthAtFinish = -1;
			(mode as any).onFinish = vi.fn().mockImplementation(() => {
				lengthAtFinish = mode.getResultFeatures('feature-1').length;
			});
			await drawRoute(mode);
			expect(lengthAtFinish).toBe(2);
		});

		it('getAllResultFeatures aggregates results across routes', async () => {
			const mode = mountMode();
			(mode as any).store.create = vi
				.fn()
				.mockReturnValueOnce(['feature-1'])
				.mockReturnValueOnce(['feature-2']);

			await drawRoute(mode);
			await drawRoute(mode);

			expect(mode.getResultFeatures('feature-2')).toHaveLength(2);
			expect(mode.getAllResultFeatures()).toHaveLength(4);
		});

		it('deleteResultFeatures removes only the given IDs', async () => {
			const mode = mountMode();
			(mode as any).store.create = vi
				.fn()
				.mockReturnValueOnce(['feature-1'])
				.mockReturnValueOnce(['feature-2']);

			await drawRoute(mode);
			await drawRoute(mode);

			mode.deleteResultFeatures(['feature-1']);
			expect(mode.getResultFeatures('feature-1')).toEqual([]);
			expect(mode.getResultFeatures('feature-2')).toHaveLength(2);
		});

		it('deleteResultFeatures without arguments clears all results', async () => {
			const mode = mountMode();
			await drawRoute(mode);

			mode.deleteResultFeatures();
			expect(mode.getAllResultFeatures()).toEqual([]);
		});
	});

	describe('public property setters', () => {
		it('url setter updates the url', () => {
			const mode = mountMode();
			mode.url = 'https://new-url.com';
			expect(mode.url).toBe('https://new-url.com');
		});

		it('costingModel setter updates the costing model', () => {
			const mode = mountMode();
			mode.costingModel = 'pedestrian';
			expect(mode.costingModel).toBe('pedestrian');
		});

		it('distanceUnit setter updates the distance unit', () => {
			const mode = mountMode();
			mode.distanceUnit = 'miles';
			expect(mode.distanceUnit).toBe('miles');
		});
	});

	describe('validateFeature', () => {
		it('returns valid for LineString with mode=routing', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
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

		it('returns invalid for Point geometry', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'routing' }
			} as any);
			expect(result.valid).toBe(false);
		});

		it('returns invalid for wrong mode', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [
						[0, 0],
						[1, 1]
					]
				},
				properties: { mode: 'linestring' }
			} as any);
			expect(result.valid).toBe(false);
		});
	});

	describe('styleFeature', () => {
		it('returns line styling', () => {
			const mode = mountMode({
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

		it('uses default styles when none provided', () => {
			const mode = mountMode({ styles: undefined });
			const style = mode.styleFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'LineString', coordinates: [] },
				properties: { mode: 'routing' }
			} as any);
			expect(style.lineStringColor).toBe('#FF0000');
			expect(style.lineStringWidth).toBe(2);
		});
	});
});
