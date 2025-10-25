import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';
expect.extend(matchers);

// create mock of Map object for test
// please add maplibre's properties which are used in test
export const createMockMaplibreMap = (styleOverride?: unknown) => ({
	addControl: vi.fn(),
	removeControl: vi.fn(),
	getContainer: vi.fn(() => document.createElement('div')),
	on: vi.fn(),
	off: vi.fn(),
	once: vi.fn(),
	remove: vi.fn(),
	getStyle: vi.fn(() => styleOverride),
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
	loaded: vi.fn(() => false), // Return false to avoid starting TerraDraw in tests
	isEnabled: vi.fn(() => true),
	getPaintProperty: vi.fn(),
	setPaintProperty: vi.fn(),
	getLayoutProperty: vi.fn(),
	setLayoutProperty: vi.fn(),
	queryTerrainElevation: vi.fn(),
	// Additional properties that TerraDrawMapLibreGLAdapter might need
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
});

vi.mock('maplibre-gl', () => {
	return {
		Map: vi.fn(() => createMockMaplibreMap()),
		GeolocateControl: vi.fn(),
		NavigationControl: vi.fn()
	};
});
