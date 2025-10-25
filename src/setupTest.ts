import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';
import type { MapOptions } from 'maplibre-gl';
expect.extend(matchers);

vi.mock('terra-draw', () => ({
	TerraDraw: vi.fn().mockImplementation(function () {
		return {
			setMode: vi.fn(),
			getMode: vi.fn(() => 'render'),
			getSnapshot: vi.fn(() => []),
			enabled: true,
			start: vi.fn(),
			stop: vi.fn(),
			on: vi.fn(),
			clear: vi.fn(),
			removeFeatures: vi.fn(),
			deselectFeature: vi.fn()
		};
	}),
	TerraDrawRenderMode: vi.fn().mockImplementation(function (options) {
		return { mode: options?.modeName || 'render' };
	}),
	TerraDrawSelectMode: vi.fn().mockImplementation(function () {
		return { mode: 'select' };
	}),
	TerraDrawPointMode: vi.fn().mockImplementation(function () {
		return { mode: 'point' };
	}),
	TerraDrawLineStringMode: vi.fn().mockImplementation(function () {
		return { mode: 'linestring' };
	}),
	TerraDrawPolygonMode: vi.fn().mockImplementation(function () {
		return { mode: 'polygon' };
	}),
	TerraDrawRectangleMode: vi.fn().mockImplementation(function () {
		return { mode: 'rectangle' };
	}),
	TerraDrawCircleMode: vi.fn().mockImplementation(function () {
		return { mode: 'circle' };
	}),
	TerraDrawFreehandMode: vi.fn().mockImplementation(function () {
		return { mode: 'freehand' };
	}),
	TerraDrawFreehandLineStringMode: vi.fn().mockImplementation(function () {
		return { mode: 'freehand-linestring' };
	}),
	TerraDrawAngledRectangleMode: vi.fn().mockImplementation(function () {
		return { mode: 'angled-rectangle' };
	}),
	TerraDrawSectorMode: vi.fn().mockImplementation(function () {
		return { mode: 'sector' };
	}),
	TerraDrawMarkerMode: vi.fn().mockImplementation(function () {
		return { mode: 'marker' };
	}),
	TerraDrawSensorMode: vi.fn().mockImplementation(function () {
		return { mode: 'sensor' };
	}),
	ValidateNotSelfIntersecting: vi.fn(),
	TerraDrawExtend: vi.fn().mockImplementation(function () {
		return {};
	})
}));

vi.mock('terra-draw-maplibre-gl-adapter', () => ({
	TerraDrawMapLibreGLAdapter: vi.fn().mockImplementation(function () {
		return {};
	})
}));

vi.mock('maplibre-gl', () => {
	return {
		Map: class MockMap {
			constructor(options?: MapOptions) {
				return {
					addControl: vi.fn(),
					removeControl: vi.fn(),
					getContainer: vi.fn(() => document.createElement('div')),
					on: vi.fn(),
					off: vi.fn(),
					once: vi.fn(),
					remove: vi.fn(),
					getStyle: vi.fn(() => options?.style || {}),
					setStyle: vi.fn(),
					getSource: vi.fn(),
					addSource: vi.fn(),
					addLayer: vi.fn(),
					removeLayer: vi.fn(),
					removeSource: vi.fn(),
					hasImage: vi.fn(() => false),
					addImage: vi.fn(),
					fire: vi.fn(),
					queryRenderedFeatures: vi.fn(() => []),
					loaded: vi.fn(() => false),
					isEnabled: vi.fn(() => true),
					getPaintProperty: vi.fn(),
					setPaintProperty: vi.fn(),
					getLayoutProperty: vi.fn(),
					setLayoutProperty: vi.fn(),
					queryTerrainElevation: vi.fn(),
					doubleClickZoom: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					},
					boxZoom: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					},
					dragPan: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					},
					dragRotate: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					},
					keyboard: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					},
					scrollZoom: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					},
					touchZoomRotate: {
						isEnabled: vi.fn(() => true),
						disable: vi.fn(),
						enable: vi.fn()
					}
				};
			}
		},
		GeolocateControl: vi.fn(),
		NavigationControl: vi.fn()
	};
});
