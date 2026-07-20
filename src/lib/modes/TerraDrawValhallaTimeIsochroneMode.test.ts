import { describe, it, expect, vi, afterEach } from 'vitest';
import { TerraDrawValhallaTimeIsochroneMode } from './TerraDrawValhallaTimeIsochroneMode';

/* eslint-disable @typescript-eslint/no-explicit-any */

vi.mock('../helpers/valhallaIsochrone', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../helpers/valhallaIsochrone')>();
	return {
		...actual,
		ValhallaIsochrone: vi.fn().mockImplementation(function () {
			return {
				calcIsochrone: vi.fn().mockResolvedValue({
					type: 'FeatureCollection',
					features: [
						{
							type: 'Feature',
							id: 'iso-1',
							geometry: {
								type: 'Polygon',
								coordinates: [
									[
										[30.0, -2.0],
										[30.01, -2.0],
										[30.01, -2.01],
										[30.0, -2.0]
									]
								]
							},
							properties: { contour: 3, fillColor: '#ff0000', fillOpacity: 0.3 }
						},
						{
							type: 'Feature',
							id: 'iso-2',
							geometry: {
								type: 'Polygon',
								coordinates: [
									[
										[30.0, -2.0],
										[30.02, -2.0],
										[30.02, -2.02],
										[30.0, -2.0]
									]
								]
							},
							properties: { contour: 5, fillColor: '#ffff00', fillOpacity: 0.3 }
						}
					]
				})
			};
		})
	};
});

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
	const mode = new TerraDrawValhallaTimeIsochroneMode({
		url: 'https://valhalla.test.com',
		costingModel: 'auto',
		contours: [
			{ time: 3, distance: 1, color: '#ff0000' },
			{ time: 5, distance: 2, color: '#ffff00' }
		],
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

describe('TerraDrawValhallaTimeIsochroneMode', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('lifecycle', () => {
		it('initialises with correct mode name', () => {
			const mode = new TerraDrawValhallaTimeIsochroneMode({ url: 'https://test.com' });
			expect(mode.mode).toBe('time-isochrone');
		});

		it('sets options from constructor', () => {
			const mode = new TerraDrawValhallaTimeIsochroneMode({
				url: 'https://test.com',
				costingModel: 'pedestrian',
				contours: [{ time: 10, distance: 3, color: '#0000ff' }]
			});
			expect(mode.url).toBe('https://test.com');
			expect(mode.costingModel).toBe('pedestrian');
			expect(mode.contours).toEqual([{ time: 10, distance: 3, color: '#0000ff' }]);
		});

		it('defaults costingModel to auto', () => {
			const mode = new TerraDrawValhallaTimeIsochroneMode({ url: '' });
			expect(mode.costingModel).toBe('auto');
		});

		it('start() sets started state and crosshair cursor', () => {
			const mode = mountMode();
			mode.start();
			expect((mode as any).setStarted).toHaveBeenCalled();
			expect((mode as any).setCursor).toHaveBeenCalledWith('crosshair');
		});

		it('stop() calls cleanUp, setStopped and resets cursor', () => {
			const mode = mountMode();
			mode.stop();
			expect((mode as any).setStopped).toHaveBeenCalled();
			expect((mode as any).setCursor).toHaveBeenCalledWith('unset');
		});
	});

	describe('drawing interaction', () => {
		it('click creates a Point feature', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			expect((mode as any).store.create).toHaveBeenCalledWith([
				{
					geometry: {
						type: 'Point',
						coordinates: [30.0, -2.0]
					},
					properties: { mode: 'time-isochrone' }
				}
			]);
		});

		it('each click creates a new Point feature', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent({ lng: 30.01, lat: -2.01 }));
			expect((mode as any).store.create).toHaveBeenCalledTimes(2);
		});
	});

	describe('computeIsochrone', () => {
		it('calls ValhallaIsochrone with contourType=time', async () => {
			const { ValhallaIsochrone } = await import('../helpers/valhallaIsochrone');
			const mode = mountMode({ costingModel: 'pedestrian' });
			mode.onClick(mockEvent());

			await vi.waitFor(() => {
				expect(ValhallaIsochrone).toHaveBeenCalledWith('https://valhalla.test.com');
				const instance = (ValhallaIsochrone as any).mock.results[0].value;
				expect(instance.calcIsochrone).toHaveBeenCalledWith(
					30.0,
					-2.0,
					'time',
					'pedestrian',
					expect.any(Array)
				);
			});
		});

		it('stores result in feature properties', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			await vi.waitFor(() => {
				expect((mode as any).store.updateProperty).toHaveBeenCalled();
				const calls = (mode as any).store.updateProperty.mock.calls[0][0];
				expect(calls[0]).toEqual({ id: 'feature-1', property: 'contourType', value: 'time' });
				expect(calls[1]).toEqual({ id: 'feature-1', property: 'costingModel', value: 'auto' });
				expect(calls[2].property).toBe('result');
				const result = JSON.parse(calls[2].value);
				expect(result).toHaveLength(2);
				expect(result[0].properties.originalId).toBe('feature-1');
				expect(result[0].properties.mode).toBe('time-isochrone');
			});
		});

		it('calls onFinish after successful computation', async () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			await vi.waitFor(() => {
				expect((mode as any).onFinish).toHaveBeenCalledWith('feature-1', {
					mode: 'time-isochrone',
					action: 'draw'
				});
			});
		});

		it('does not compute when url is empty', async () => {
			const { ValhallaIsochrone } = await import('../helpers/valhallaIsochrone');
			const mode = mountMode({ url: '' });
			mode.onClick(mockEvent());

			await new Promise((r) => setTimeout(r, 50));
			expect(ValhallaIsochrone).not.toHaveBeenCalled();
		});

		it('handles API error gracefully', async () => {
			const { ValhallaIsochrone } = await import('../helpers/valhallaIsochrone');
			(ValhallaIsochrone as any).mockImplementation(function () {
				return { calcIsochrone: vi.fn().mockRejectedValue(new Error('API error')) };
			});

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const mode = mountMode();
			mode.onClick(mockEvent());

			await vi.waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					'Valhalla time isochrone error:',
					expect.any(Error)
				);
			});
			expect((mode as any).onFinish).not.toHaveBeenCalled();
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
			mode.costingModel = 'bicycle';
			expect(mode.costingModel).toBe('bicycle');
		});

		it('contours setter updates contours', () => {
			const mode = mountMode();
			const newContours = [{ time: 20, distance: 5, color: '#00ff00' }];
			mode.contours = newContours;
			expect(mode.contours).toEqual(newContours);
		});
	});

	describe('validateFeature', () => {
		it('returns valid for Point with mode=time-isochrone', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'time-isochrone' }
			} as any);
			expect(result.valid).toBe(true);
		});

		it('returns invalid for non-Point geometry', () => {
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
				properties: { mode: 'time-isochrone' }
			} as any);
			expect(result.valid).toBe(false);
		});

		it('returns invalid for wrong mode', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'distance-isochrone' }
			} as any);
			expect(result.valid).toBe(false);
		});
	});

	describe('styleFeature', () => {
		it('returns point styling', () => {
			const mode = mountMode({
				styles: { pointColor: '#FF0000', pointWidth: 8 }
			});
			const style = mode.styleFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'time-isochrone' }
			} as any);
			expect(style.pointColor).toBe('#FF0000');
			expect(style.pointWidth).toBe(8);
		});

		it('uses default styles when none provided', () => {
			const mode = mountMode({ styles: undefined });
			const style = mode.styleFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'time-isochrone' }
			} as any);
			expect(style.pointColor).toBe('#FFFFFF');
			expect(style.pointWidth).toBe(5);
		});
	});
});
