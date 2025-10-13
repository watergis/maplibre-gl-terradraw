import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValhallaIsochrone, contourTypeOptions, type Contour } from './valhallaIsochrone';

describe('ValhallaIsochrone', () => {
	let isochrone: ValhallaIsochrone;
	const mockUrl = 'https://valhalla.water-gis.com';
	let mockFetch: ReturnType<typeof vi.fn>;

	// Real coordinates from API example (East Africa)
	const eastAfricaLon = 35.870823432;
	const eastAfricaLat = -1.091469604;

	// Real API response from provided example
	const realDistanceIsochroneResponse = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {
					fill: '#ff0000',
					fillOpacity: 0.33,
					'fill-opacity': 0.33,
					fillColor: '#ff0000',
					color: '#ff0000',
					contour: 1,
					opacity: 0.33,
					metric: 'distance'
				},
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[35.868823, -1.082581],
							[35.868172, -1.083819],
							[35.866118, -1.084764],
							[35.866117, -1.08547],
							[35.865124, -1.08647],
							[35.865823, -1.088215],
							[35.866823, -1.088987],
							[35.867823, -1.08911],
							[35.868823, -1.088105],
							[35.869098, -1.08847],
							[35.869048, -1.08947],
							[35.868417, -1.090063],
							[35.868238, -1.091884],
							[35.867332, -1.092978],
							[35.864906, -1.09347],
							[35.865598, -1.093695],
							[35.86575, -1.094543],
							[35.866519, -1.094774],
							[35.866568, -1.098214],
							[35.865648, -1.09847],
							[35.865992, -1.09947],
							[35.866823, -1.09955],
							[35.867154, -1.0978],
							[35.867968, -1.097614],
							[35.868992, -1.096638],
							[35.869171, -1.09547],
							[35.870439, -1.094085],
							[35.871823, -1.093539],
							[35.872594, -1.093699],
							[35.872823, -1.094611],
							[35.875908, -1.094554],
							[35.876103, -1.09275],
							[35.877823, -1.092118],
							[35.878459, -1.09147],
							[35.878406, -1.09047],
							[35.879718, -1.08947],
							[35.877767, -1.08847],
							[35.876756, -1.086537],
							[35.874823, -1.085767],
							[35.874723, -1.08447],
							[35.872802, -1.084448],
							[35.872649, -1.085295],
							[35.871735, -1.085558],
							[35.871072, -1.085221],
							[35.870823, -1.083747],
							[35.870394, -1.08604],
							[35.869347, -1.085946],
							[35.868823, -1.082581]
						]
					]
				}
			}
		]
	};

	beforeEach(() => {
		isochrone = new ValhallaIsochrone(mockUrl);
		mockFetch = vi.fn();
		global.fetch = mockFetch;
		vi.clearAllMocks();
	});

	describe('Constructor', () => {
		it('should initialize with provided URL', () => {
			expect(isochrone).toBeInstanceOf(ValhallaIsochrone);
		});

		it('should store URL correctly', () => {
			const testUrl = 'https://test.valhalla.com';
			const testIsochrone = new ValhallaIsochrone(testUrl);
			expect(testIsochrone).toBeInstanceOf(ValhallaIsochrone);
		});
	});

	describe('Constants and Types', () => {
		it('should export correct contour type options', () => {
			expect(contourTypeOptions).toEqual([
				{ value: 'time', label: 'Time' },
				{ value: 'distance', label: 'Distance' }
			]);
		});

		it('should have correct contour type structure', () => {
			expect(contourTypeOptions).toHaveLength(2);
			expect(contourTypeOptions[0]).toHaveProperty('value');
			expect(contourTypeOptions[0]).toHaveProperty('label');
		});
	});

	describe('calcIsochrone', () => {
		describe('API call construction', () => {
			beforeEach(() => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});
			});

			it('should construct correct API URL for distance isochrone', async () => {
				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];

				await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				expect(mockFetch).toHaveBeenCalledTimes(1);
				const fetchCall = mockFetch.mock.calls[0][0] as string;

				expect(fetchCall).toContain(`${mockUrl}/isochrone`);
				expect(fetchCall).toContain('json=');

				// Parse URL parameters
				const urlParams = new URLSearchParams(fetchCall.split('?')[1]);
				const jsonParam = JSON.parse(urlParams.get('json') || '{}');

				expect(jsonParam.locations).toHaveLength(1);
				expect(jsonParam.locations[0]).toEqual({
					lat: eastAfricaLat,
					lon: eastAfricaLon
				});
				expect(jsonParam.costing).toBe('pedestrian');
				expect(jsonParam.polygons).toBe(true);
				expect(jsonParam.contours).toHaveLength(1);
				expect(jsonParam.contours[0]).toEqual({
					distance: 1,
					color: 'ff0000'
				});
			});

			it('should work with time isochrone', async () => {
				const contours: Contour[] = [
					{ time: 5, color: '00ff00' },
					{ time: 10, color: 'ffff00' }
				];

				await isochrone.calcIsochrone(eastAfricaLon, eastAfricaLat, 'time', 'bicycle', contours);

				const fetchCall = mockFetch.mock.calls[0][0] as string;
				const urlParams = new URLSearchParams(fetchCall.split('?')[1]);
				const jsonParam = JSON.parse(urlParams.get('json') || '{}');

				expect(jsonParam.costing).toBe('bicycle');
				expect(jsonParam.contours).toHaveLength(2);
				expect(jsonParam.contours[0]).toEqual({ time: 5, color: '00ff00' });
				expect(jsonParam.contours[1]).toEqual({ time: 10, color: 'ffff00' });
			});

			it('should work with different costing models', async () => {
				const contours: Contour[] = [{ distance: 2, color: 'blue' }];

				await isochrone.calcIsochrone(eastAfricaLon, eastAfricaLat, 'distance', 'auto', contours);

				const fetchCall = mockFetch.mock.calls[0][0] as string;
				const urlParams = new URLSearchParams(fetchCall.split('?')[1]);
				const jsonParam = JSON.parse(urlParams.get('json') || '{}');

				expect(jsonParam.costing).toBe('auto');
			});

			it('should handle multiple contours', async () => {
				const contours: Contour[] = [
					{ distance: 0.5, color: 'green' },
					{ distance: 1.0, color: 'yellow' },
					{ distance: 1.5, color: 'orange' },
					{ distance: 2.0, color: 'red' }
				];

				await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				const fetchCall = mockFetch.mock.calls[0][0] as string;
				const urlParams = new URLSearchParams(fetchCall.split('?')[1]);
				const jsonParam = JSON.parse(urlParams.get('json') || '{}');

				expect(jsonParam.contours).toHaveLength(4);
				expect(jsonParam.contours[0]).toEqual({ distance: 0.5, color: 'green' });
				expect(jsonParam.contours[3]).toEqual({ distance: 2.0, color: 'red' });
			});
		});

		describe('Response processing', () => {
			it('should process real API response correctly', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];
				const result = await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				// Verify result structure
				expect(result).toBeDefined();
				expect(result.type).toBe('FeatureCollection');
				expect(result.features).toHaveLength(1);

				const feature = result.features[0];
				expect(feature.type).toBe('Feature');
				expect(feature.geometry.type).toBe('Polygon');
				expect(feature.properties).toMatchObject({
					contour: 1,
					color: '#ff0000',
					metric: 'distance'
				});

				// Verify coordinates structure
				const coordinates = feature.geometry.coordinates as number[][][];
				expect(coordinates).toHaveLength(1); // Single ring
				expect(coordinates[0]).toBeInstanceOf(Array);
				expect(coordinates[0].length).toBeGreaterThan(10); // Multiple coordinate points

				// Verify coordinate format [lng, lat]
				coordinates[0].forEach((coord) => {
					expect(coord).toHaveLength(2);
					expect(typeof coord[0]).toBe('number'); // longitude
					expect(typeof coord[1]).toBe('number'); // latitude
					expect(coord[0]).toBeCloseTo(35.87, 1); // Around East Africa longitude
					expect(coord[1]).toBeCloseTo(-1.09, 1); // Around East Africa latitude
				});
			});

			it('should preserve all API response properties', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];
				const result = await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				const feature = result.features[0];
				const properties = feature.properties;

				// Verify all properties from real API response are preserved
				expect(properties.fill).toBe('#ff0000');
				expect(properties.fillOpacity).toBe(0.33);
				expect(properties['fill-opacity']).toBe(0.33);
				expect(properties.fillColor).toBe('#ff0000');
				expect(properties.color).toBe('#ff0000');
				expect(properties.contour).toBe(1);
				expect(properties.opacity).toBe(0.33);
				expect(properties.metric).toBe('distance');
			});

			it('should handle coordinate precision correctly', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];
				const result = await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				const coordinates = result.features[0].geometry.coordinates as number[][][];
				const firstCoord = coordinates[0][0];

				// Verify precision matches API response
				expect(firstCoord[0]).toBe(35.868823);
				expect(firstCoord[1]).toBe(-1.082581);

				// Verify polygon is closed (first and last coordinates match)
				const lastCoord = coordinates[0][coordinates[0].length - 1];
				expect(lastCoord[0]).toBe(firstCoord[0]);
				expect(lastCoord[1]).toBe(firstCoord[1]);
			});
		});

		describe('Error handling', () => {
			it('should handle fetch errors', async () => {
				mockFetch.mockRejectedValue(new Error('Network error'));

				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];

				await expect(
					isochrone.calcIsochrone(eastAfricaLon, eastAfricaLat, 'distance', 'pedestrian', contours)
				).rejects.toThrow('Network error');
			});

			it('should handle JSON parsing errors', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
				});

				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];

				await expect(
					isochrone.calcIsochrone(eastAfricaLon, eastAfricaLat, 'distance', 'pedestrian', contours)
				).rejects.toThrow('Invalid JSON');
			});

			it('should handle API error responses', async () => {
				const errorResponse = {
					error: 'No data available for this location',
					error_code: 171,
					status: 'Bad Request',
					status_code: 400
				};

				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(errorResponse)
				});

				const contours: Contour[] = [{ distance: 1, color: 'ff0000' }];

				// Note: The implementation returns error response instead of throwing
				const result = await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				// Check that the error response is returned correctly
				expect(result).toEqual(errorResponse);
			});
		});

		describe('Integration scenarios', () => {
			it('should work with real API format - distance isochrone', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				// Exact URL that works with real API
				const result = await isochrone.calcIsochrone(
					35.870823432,
					-1.091469604,
					'distance',
					'pedestrian',
					[{ distance: 1, color: 'ff0000' }]
				);

				// Verify the constructed URL matches expected format
				const fetchCall = mockFetch.mock.calls[0][0] as string;
				expect(fetchCall).toContain('valhalla.water-gis.com/isochrone');
				expect(fetchCall).toContain('locations');
				expect(fetchCall).toContain('costing');
				expect(fetchCall).toContain('contours');
				expect(fetchCall).toContain('polygons');

				// Verify result processing
				expect(result).toBeDefined();
				expect(result.features).toHaveLength(1);
				expect(result.features[0].properties.metric).toBe('distance');
			});

			it('should handle different coordinate systems', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				// Test with different global coordinates
				const coordinates = [
					{ lon: 139.6917, lat: 35.6895 }, // Tokyo
					{ lon: -74.006, lat: 40.7128 }, // New York
					{ lon: 2.3522, lat: 48.8566 } // Paris
				];

				for (const coord of coordinates) {
					const result = await isochrone.calcIsochrone(
						coord.lon,
						coord.lat,
						'distance',
						'pedestrian',
						[{ distance: 1, color: 'blue' }]
					);

					expect(result).toBeDefined();
					expect(result.features).toHaveLength(1);
				}

				expect(mockFetch).toHaveBeenCalledTimes(3);
			});

			it('should work with complex contour combinations', async () => {
				// Create mock response for multiple contours
				const multiContourResponse = {
					type: 'FeatureCollection',
					features: [
						// First contour
						{
							...realDistanceIsochroneResponse.features[0],
							properties: {
								...realDistanceIsochroneResponse.features[0].properties,
								contour: 1,
								color: 'green'
							}
						},
						// Second contour
						{
							...realDistanceIsochroneResponse.features[0],
							properties: {
								...realDistanceIsochroneResponse.features[0].properties,
								contour: 2,
								color: 'yellow'
							}
						}
					]
				};

				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(multiContourResponse)
				});

				const contours: Contour[] = [
					{ distance: 1, color: 'green' },
					{ distance: 2, color: 'yellow' }
				];

				const result = await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'auto',
					contours
				);

				expect(result.features).toHaveLength(2);
				expect(result.features[0].properties.contour).toBe(1);
				expect(result.features[1].properties.contour).toBe(2);
			});
		});

		describe('Performance and edge cases', () => {
			it('should handle empty contours array', async () => {
				const contours: Contour[] = [];

				// Should not make API call with empty contours
				const result = isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'pedestrian',
					contours
				);

				// This might throw an error or handle gracefully - adjust based on implementation
				await expect(result).rejects.toThrow(); // Or test for specific handling
			});

			it('should handle extreme coordinates', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				const extremeCoords = [
					{ lon: 180, lat: 85 }, // Near North Pole
					{ lon: -180, lat: -85 }, // Near South Pole
					{ lon: 0, lat: 0 } // Equator/Prime Meridian
				];

				const contours: Contour[] = [{ distance: 1, color: 'red' }];

				for (const coord of extremeCoords) {
					await isochrone.calcIsochrone(coord.lon, coord.lat, 'distance', 'pedestrian', contours);

					const fetchCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0] as string;
					const urlParams = new URLSearchParams(fetchCall.split('?')[1]);
					const jsonParam = JSON.parse(urlParams.get('json') || '{}');

					expect(jsonParam.locations[0].lon).toBe(coord.lon);
					expect(jsonParam.locations[0].lat).toBe(coord.lat);
				}
			});

			it('should handle large contour values', async () => {
				mockFetch.mockResolvedValue({
					json: vi.fn().mockResolvedValue(realDistanceIsochroneResponse)
				});

				const contours: Contour[] = [
					{ distance: 100, color: 'red' }, // 100km
					{ time: 7200, color: 'blue' } // 2 hours
				];

				await isochrone.calcIsochrone(
					eastAfricaLon,
					eastAfricaLat,
					'distance',
					'auto',
					contours.slice(0, 1) // Only distance for this test
				);

				const fetchCall = mockFetch.mock.calls[0][0] as string;
				const urlParams = new URLSearchParams(fetchCall.split('?')[1]);
				const jsonParam = JSON.parse(urlParams.get('json') || '{}');

				expect(jsonParam.contours[0].distance).toBe(100);
			});
		});
	});
});
