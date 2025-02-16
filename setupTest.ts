import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi } from 'vitest';
expect.extend(matchers);

// create mock of Map object for test
// please add maplibre's properties which are used in test
vi.mock('maplibre-gl', () => {
	return {
		Map: vi.fn(() => ({
			addControl: vi.fn(),
			on: vi.fn(),
			remove: vi.fn(),
			getStyle: vi.fn(),
			getPaintProperty: vi.fn(),
			setPaintProperty: vi.fn(),
			getLayoutProperty: vi.fn(),
			setLayoutProperty: vi.fn()
		})),
		GeolocateControl: vi.fn(),
		NavigationControl: vi.fn()
	};
});
