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

		it('stores route summary in feature properties without serialized results', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);

			await vi.waitFor(() => {
				expect((mode as any).store.updateProperty).toHaveBeenCalled();
				const call = (mode as any).store.updateProperty.mock.calls[0][0];
				const properties = call.map((c: any) => c.property);
				expect(properties).toEqual([
					'groupId',
					'costingModel',
					'distance',
					'distance_unit',
					'time'
				]);
				expect(properties).not.toContain('routeResult');
				expect(call[0].value).toBe('feature-1');
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

	describe('store-managed node points', () => {
		const drawRoute = async (mode: any) => {
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01, containerX: 200, containerY: 300 }));
			mode.onKeyUp({ key: 'Enter', heldKeys: [], preventDefault: vi.fn() } as any);
			await vi.waitFor(() => {
				expect(mode.onFinish).toHaveBeenCalled();
			});
		};

		it('creates node point features in the store with originalId and groupId', async () => {
			const mode = mountMode();
			await drawRoute(mode);

			// first create is the drawn line, second create is the node points
			expect((mode as any).store.create).toHaveBeenCalledTimes(2);
			const nodeFeatures = (mode as any).store.create.mock.calls[1][0];
			expect(nodeFeatures).toHaveLength(2);
			expect(nodeFeatures[0].geometry.type).toBe('Point');
			expect(nodeFeatures[0].properties).toMatchObject({
				mode: 'routing',
				originalId: 'feature-1',
				groupId: 'feature-1',
				sequence: 0,
				text: 'Start'
			});
			expect(nodeFeatures[1].properties.text).toBe('Goal');
		});

		it('does not store maneuvers on node point features', async () => {
			const mode = mountMode();
			await drawRoute(mode);

			const nodeFeatures = (mode as any).store.create.mock.calls[1][0];
			for (const f of nodeFeatures) {
				expect(f.properties).not.toHaveProperty('maneuvers');
			}
		});

		it('node points are created before onFinish fires', async () => {
			const mode = mountMode();
			let createCallsAtFinish = -1;
			(mode as any).onFinish = vi.fn().mockImplementation(() => {
				createCallsAtFinish = (mode as any).store.create.mock.calls.length;
			});
			await drawRoute(mode);
			expect(createCallsAtFinish).toBe(2);
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

		it('returns valid for node Point with originalId', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'routing', originalId: 'feature-1' }
			} as any);
			expect(result.valid).toBe(true);
		});

		it('returns invalid for Point geometry without originalId', () => {
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
		it('styles node points by their text label', () => {
			const mode = mountMode();
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
