import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import type { StyleSpecification } from 'maplibre-gl';
import { Map } from 'maplibre-gl';
import { type GeoJSONStoreFeatures } from 'terra-draw';
import { TERRADRAW_SOURCE_IDS } from '../helpers/cleanMaplibreStyle';

const maplibreStyle: StyleSpecification = {
	version: 8,
	name: 'MapLibre',
	metadata: {
		'maptiler:copyright':
			'This style was generated on MapTiler Cloud. Usage is governed by the license terms in https://github.com/maplibre/demotiles/blob/gh-pages/LICENSE',
		'openmaptiles:version': '3.x'
	},
	center: [17.65431710431244, 32.954120326746775],
	zoom: 0.8619833357855968,
	bearing: 0,
	pitch: 0,
	glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
	sources: {
		maplibre: {
			type: 'vector',
			url: 'https://demotiles.maplibre.org/tiles/tiles.json'
		},
		'td-point': {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: []
			},
			tolerance: 0
		},
		'td-linestring': {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: []
			},
			tolerance: 0
		},
		'td-polygon': {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: []
			},
			tolerance: 0
		}
	},
	layers: [
		{
			id: 'background',
			type: 'background',
			maxzoom: 24,
			layout: {
				visibility: 'visible'
			},
			paint: {
				'background-color': '#D8F2FF'
			}
		},
		{
			id: 'td-linestring',
			type: 'line',
			source: 'td-linestring',
			paint: {
				'line-width': ['get', 'lineStringWidth'],
				'line-color': ['get', 'lineStringColor']
			}
		},
		{
			id: 'td-polygon',
			type: 'fill',
			source: 'td-polygon',
			paint: {
				'fill-color': ['get', 'polygonFillColor'],
				'fill-opacity': ['get', 'polygonFillOpacity']
			}
		},
		{
			id: 'td-point',
			type: 'circle',
			source: 'td-point',
			paint: {
				'circle-stroke-color': ['get', 'pointOutlineColor'],
				'circle-stroke-width': ['get', 'pointOutlineWidth'],
				'circle-radius': ['get', 'pointWidth'],
				'circle-color': ['get', 'pointColor']
			}
		}
	]
};

const mockFeatures: GeoJSONStoreFeatures[] = [
	{
		id: '1',
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [0, 0] },
		properties: { mode: 'point', selected: false }
	},
	{
		id: '2',
		type: 'Feature',
		geometry: {
			type: 'LineString',
			coordinates: [
				[0, 0],
				[1, 1]
			]
		},
		properties: { mode: 'linestring', selected: true }
	},
	{
		id: '3',
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [1, 1] },
		properties: { mode: 'select', selected: false }
	}
];

describe('basic functionality', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});
	it('should return top-right as default position', () => {
		const control = new MaplibreTerradrawControl();
		expect(control.getDefaultPosition()).toBe('top-right');
	});

	it('should handle constructor without options', () => {
		const control = new MaplibreTerradrawControl();
		expect(control).toBeDefined();
	});

	it('should handle constructor with options', () => {
		const control = new MaplibreTerradrawControl({
			modes: ['point', 'linestring'],
			open: true
		});
		expect(control).toBeDefined();
	});
});

describe('style cleaning', () => {
	const sourceIds = TERRADRAW_SOURCE_IDS.map((id) => id.replace('{prefix}', 'td'));

	it('should return the original style when no options are set', () => {
		const control = new MaplibreTerradrawControl();
		const result = control.cleanStyle(maplibreStyle);
		expect(result).toEqual(maplibreStyle);
	});

	it('should exclude TerraDraw layers when excludeTerraDrawLayers is true', () => {
		const control = new MaplibreTerradrawControl();
		const result = control.cleanStyle(maplibreStyle, { excludeTerraDrawLayers: true });
		expect(
			result.layers.some((layer) => 'source' in layer && sourceIds.includes(layer.source as string))
		).toBe(false);
		expect(Object.keys(result.sources).some((source) => sourceIds.includes(source))).toBe(false);
	});

	it('should include only TerraDraw layers when onlyTerraDrawLayers is true', () => {
		const control = new MaplibreTerradrawControl();
		const result = control.cleanStyle(maplibreStyle, { onlyTerraDrawLayers: true });
		expect(
			result.layers.every(
				(layer) => 'source' in layer && sourceIds.includes(layer.source as string)
			)
		).toBe(true);
		expect(Object.keys(result.sources).every((source) => sourceIds.includes(source))).toBe(true);
	});
});

describe('getTerraDrawInstance', () => {
	it('should return undefined when terra draw instance is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		const instance = control.getTerraDrawInstance();
		expect(instance).toBe(undefined);
	});

	it('should return a proxy that wraps setMode method when terra draw instance exists', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Initialize terra draw by calling onAdd
		control.onAdd(mockMap);

		const instance = control.getTerraDrawInstance();
		expect(instance).toBeDefined();
		expect(typeof instance?.setMode).toBe('function');
	});

	it('should call terradraw start method when map is loaded', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map loaded method to return true
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).loaded = vi.fn(() => true);

		// Initialize terra draw by calling onAdd
		control.onAdd(mockMap);

		const instance = control.getTerraDrawInstance();
		expect(instance).toBeDefined();

		// Verify that start method was called (line 191)
		expect(instance?.start).toHaveBeenCalled();
	});

	it('should call terradraw start method on map load event when map is not loaded', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map loaded method to return false
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).loaded = vi.fn(() => false);

		// Spy on once method to capture the callback
		let loadCallback: () => void;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).once = vi.fn((event: string, callback: () => void) => {
			if (event === 'load') {
				loadCallback = callback;
			}
		});

		// Initialize terra draw by calling onAdd
		control.onAdd(mockMap);

		const instance = control.getTerraDrawInstance();
		expect(instance).toBeDefined();

		// Verify that once was called with 'load' event
		expect(mockMap.once).toHaveBeenCalledWith('load', expect.any(Function));

		// Simulate map load event to trigger the callback (line 194)
		loadCallback!();

		// Verify that start method was called
		expect(instance?.start).toHaveBeenCalled();
	});
});

describe('event handling', () => {
	it('should register and trigger event handlers', () => {
		const control = new MaplibreTerradrawControl();
		const callback = vi.fn();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.on('mode-changed', callback);
		control.onAdd(mockMap);

		// Mock the getMode method to return a specific mode
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getMode = vi.fn(() => 'point');

		// Dispatch event directly
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).dispatchEvent('mode-changed');

		expect(callback).toHaveBeenCalled();
	});

	it('should unregister event handlers', () => {
		const control = new MaplibreTerradrawControl();
		const callback = vi.fn();

		control.on('mode-changed', callback);
		control.off('mode-changed', callback);

		// Access private events property to verify
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const events = (control as any).events;
		expect(events['mode-changed']).toHaveLength(0);
	});

	it('should handle off method when event does not exist', () => {
		const control = new MaplibreTerradrawControl();
		const callback = vi.fn();
		expect(() => control.off('mode-changed', callback)).not.toThrow();
	});
});

describe('state management', () => {
	it('should handle isExpanded property changes', () => {
		const control = new MaplibreTerradrawControl({ modes: ['render', 'point'], open: false });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		expect(control.isExpanded).toBe(false);

		// Set to expanded
		control.isExpanded = true;
		expect(control.isExpanded).toBe(true);

		// Set back to collapsed
		control.isExpanded = false;
		expect(control.isExpanded).toBe(false);
	});

	it('should dispatch expanded event', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });
		const callback = vi.fn();

		control.on('expanded', callback);
		control.onAdd(mockMap);

		control.isExpanded = true;
		expect(callback).toHaveBeenCalled();
	});

	it('should dispatch collapsed event', () => {
		const control = new MaplibreTerradrawControl({ open: true });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });
		const callback = vi.fn();

		control.on('collapsed', callback);
		control.onAdd(mockMap);

		control.isExpanded = false;
		expect(callback).toHaveBeenCalled();
	});

	it('should toggle button visibility when isExpanded changes', () => {
		const control = new MaplibreTerradrawControl({ modes: ['render', 'point'], open: false });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });
		const controlElement = control.onAdd(mockMap);

		// Initially collapsed - buttons should have 'hidden' class
		expect(control.isExpanded).toBe(false);

		const addControlButtons = controlElement.getElementsByClassName(
			'maplibregl-terradraw-control-render-button'
		);

		// Check that buttons have 'hidden' class when collapsed
		if (addControlButtons.length > 0) {
			for (let i = 0; i < addControlButtons.length; i++) {
				const button = addControlButtons.item(i);
				if (button) {
					expect(button.classList.contains('hidden')).toBe(true);
				}
			}
		}

		// Set to expanded - buttons should not have 'hidden' class
		control.isExpanded = true;

		if (addControlButtons.length > 0) {
			for (let i = 0; i < addControlButtons.length; i++) {
				const button = addControlButtons.item(i);
				if (button) {
					expect(button.classList.contains('hidden')).toBe(false);
				}
			}
		}

		// Set back to collapsed - buttons should have 'hidden' class again
		control.isExpanded = false;

		if (addControlButtons.length > 0) {
			for (let i = 0; i < addControlButtons.length; i++) {
				const button = addControlButtons.item(i);
				if (button) {
					expect(button.classList.contains('hidden')).toBe(true);
				}
			}
		}
	});

	it('should toggle render button enabled class when isExpanded changes', () => {
		const control = new MaplibreTerradrawControl({ modes: ['render'], open: false });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });
		const controlElement = control.onAdd(mockMap);

		// Initially collapsed - render button should not have 'enabled' class
		expect(control.isExpanded).toBe(false);

		const renderButton = controlElement.getElementsByClassName(
			'maplibregl-terradraw-control-render-button'
		);

		if (renderButton.length > 0) {
			const button = renderButton.item(0);
			if (button) {
				expect(button.classList.contains('enabled')).toBe(false);
			}
		}

		// Set to expanded - render button should have 'enabled' class
		control.isExpanded = true;

		if (renderButton.length > 0) {
			const button = renderButton.item(0);
			if (button) {
				expect(button.classList.contains('enabled')).toBe(true);
			}
		}

		// Set back to collapsed - render button should not have 'enabled' class
		control.isExpanded = false;

		if (renderButton.length > 0) {
			const button = renderButton.item(0);
			if (button) {
				expect(button.classList.contains('enabled')).toBe(false);
			}
		}
	});
});

describe('map lifecycle', () => {
	it('should handle onAdd method', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const container = control.onAdd(mockMap);
		expect(container).toBeDefined();
		expect(container).toBeInstanceOf(HTMLElement);
		expect(container.classList.contains('maplibregl-ctrl')).toBe(true);
	});

	it('should handle onRemove method', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const container = control.onAdd(mockMap);
		expect(container).toBeDefined();

		control.onRemove();
		expect(() => control.onRemove()).not.toThrow();
	});

	it('should handle onRemove when not added', () => {
		const control = new MaplibreTerradrawControl();
		expect(() => control.onRemove()).not.toThrow();
	});

	it('should throw error with empty modes', () => {
		const control = new MaplibreTerradrawControl({ modes: [] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		expect(() => control.onAdd(mockMap)).toThrowError('At least a mode must be enabled.');
	});

	it('should handle map load event when not loaded', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).loaded = vi.fn(() => false);

		const container = control.onAdd(mockMap);
		expect(container).toBeDefined();
		expect(mockMap.once).toHaveBeenCalledWith('load', expect.any(Function));
	});
});

describe('features management', () => {
	it('should return undefined when terradraw is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		const result = control.getFeatures();
		expect(result).toBeUndefined();
	});

	it('should return all features when onlySelected is false', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Mock the getSnapshot method
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);

		const result = control.getFeatures(false);
		expect(result).toBeDefined();
		expect(result?.type).toBe('FeatureCollection');
		expect(result?.features).toHaveLength(2); // select mode filtered out
	});

	it('should return only selected features when onlySelected is true', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Mock the getSnapshot method
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);

		const result = control.getFeatures(true);
		expect(result).toBeDefined();
		expect(result?.type).toBe('FeatureCollection');
		expect(result?.features).toHaveLength(1);
		expect(result?.features.every((f) => f.properties.selected === true)).toBe(true);
	});
});

describe('activation and deactivation', () => {
	it('should handle activate when terradraw is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		expect(() => control.activate()).not.toThrow();
	});

	it('should handle deactivate when terradraw is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		expect(() => control.deactivate()).not.toThrow();
	});

	it('should handle activate when already enabled', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Set enabled to true and spy on start method
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;
		const startSpy = vi.spyOn(terradraw, 'start');

		control.activate();
		expect(startSpy).not.toHaveBeenCalled();
	});

	it('should handle deactivate when disabled', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Set enabled to false and spy on stop method
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = false;
		const stopSpy = vi.spyOn(terradraw, 'stop');

		control.deactivate();
		expect(stopSpy).not.toHaveBeenCalled();
	});

	it('should handle resetActiveMode when terradraw is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		expect(() => control.resetActiveMode()).not.toThrow();
	});

	it('should start terradraw when disabled and reset mode', () => {
		const control = new MaplibreTerradrawControl({ modes: ['render', 'point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = false;
		terradraw.getMode = vi.fn(() => 'render');

		// Create spies for the methods we want to test
		const startSpy = vi.spyOn(terradraw, 'start');
		const setModeSpy = vi.spyOn(terradraw, 'setMode');

		control.resetActiveMode();

		expect(startSpy).toHaveBeenCalled();
		expect(setModeSpy).toHaveBeenCalledWith('render');
	});
});

describe('internal methods', () => {
	it('should handle toggleEditor', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getMode = vi.fn(() => 'render');
		terradraw.enabled = true;

		const initialState = control.isExpanded;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).toggleEditor();
		expect(control.isExpanded).toBe(!initialState);
	});

	it('should handle toggleEditor when terradraw is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).toggleEditor()).not.toThrow();
	});

	it('should handle handleDownload', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Mock the getSnapshot method
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);

		// Mock DOM elements
		const mockAnchor = {
			setAttribute: vi.fn(),
			click: vi.fn(),
			remove: vi.fn()
		};

		const originalCreateElement = document.createElement;
		const originalAppendChild = document.body.appendChild;

		document.createElement = vi.fn((tagName) => {
			if (tagName === 'a') return mockAnchor as unknown as HTMLAnchorElement;
			return originalCreateElement.call(document, tagName);
		});
		document.body.appendChild = vi.fn();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).handleDownload();

		expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'data.geojson');
		expect(mockAnchor.click).toHaveBeenCalled();
		expect(mockAnchor.remove).toHaveBeenCalled();

		// Restore
		document.createElement = originalCreateElement;
		document.body.appendChild = originalAppendChild;
	});

	it('should handle clearExtendedFeatures when map is not initialized', () => {
		const control = new MaplibreTerradrawControl();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).clearExtendedFeatures(['source1'])).not.toThrow();
	});

	it('should clear all features when ids is undefined', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const mockGeojsonSource = {
			data: {
				type: 'FeatureCollection',
				features: [
					{ id: '1', properties: {} },
					{ id: '2', properties: {} }
				]
			}
		};

		const mockSource = {
			setData: vi.fn()
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => mockSource);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getStyle = vi.fn(() => ({
			sources: {
				testSource: mockGeojsonSource
			}
		}));

		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).clearExtendedFeatures(['testSource']);

		expect(mockGeojsonSource.data.features).toHaveLength(0);
		expect(mockSource.setData).toHaveBeenCalledWith(mockGeojsonSource.data);
	});
});

describe('button state management', () => {
	it('should handle toggleButtonsWhenNoFeature', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// The terradraw instance is already mocked, no need to manually assign
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).toggleButtonsWhenNoFeature()).not.toThrow();
	});

	it('should handle toggleDeleteSelectionButton', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;
		terradraw.getMode = vi.fn(() => 'select');

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).toggleDeleteSelectionButton()).not.toThrow();
	});

	it('should handle syncButtonStates', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getMode = vi.fn(() => 'render');
		terradraw.enabled = true;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).syncButtonStates('point')).not.toThrow();
	});
});

describe('dispatchEvent method', () => {
	it('should dispatch events with feature snapshot', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });
		const callback = vi.fn();

		control.on('mode-changed', callback);
		control.onAdd(mockMap);

		const mockFeatures: GeoJSONStoreFeatures[] = [
			{
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'point', selected: true }
			}
		];

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);
		terradraw.getMode = vi.fn(() => 'point');

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).dispatchEvent('mode-changed', { custom: 'data' });

		expect(callback).toHaveBeenCalledWith({
			feature: mockFeatures,
			mode: 'point',
			custom: 'data'
		});
	});

	it('should handle dispatchEvent when no callbacks registered', () => {
		const control = new MaplibreTerradrawControl();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).dispatchEvent('mode-changed')).not.toThrow();
	});
});

describe('advanced button state management', () => {
	it('should handle toggleDeleteSelectionButton with active state', () => {
		const control = new MaplibreTerradrawControl({ modes: ['select', 'point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock DOM elements
		const mockButton = {
			classList: {
				remove: vi.fn(),
				add: vi.fn()
			}
		};

		const originalGetElementsByClassName = document.getElementsByClassName;
		document.getElementsByClassName = vi.fn((className: string) => {
			if (className.includes('delete-selection-button')) {
				return {
					length: 1,
					item: vi.fn(() => mockButton)
				} as unknown as HTMLCollectionOf<Element>;
			}
			return {
				length: 0,
				item: vi.fn(() => null)
			} as unknown as HTMLCollectionOf<Element>;
		});

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;
		terradraw.getMode = vi.fn(() => 'select');
		terradraw.getSnapshot = vi.fn(() => [
			{
				id: '1',
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [0, 0] },
				properties: { mode: 'point', selected: false }
			}
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).toggleDeleteSelectionButton();

		expect(mockButton.classList.remove).toHaveBeenCalledWith('hidden-delete-selection');

		// Restore
		document.getElementsByClassName = originalGetElementsByClassName;
	});

	it('should handle toggleDeleteSelectionButton with inactive state', () => {
		const control = new MaplibreTerradrawControl({ modes: ['select', 'point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock DOM elements
		const mockDeleteButton = {
			classList: {
				remove: vi.fn(),
				add: vi.fn()
			}
		};

		const mockSelectButton = {
			classList: {
				remove: vi.fn(),
				add: vi.fn()
			}
		};

		const originalGetElementsByClassName = document.getElementsByClassName;
		document.getElementsByClassName = vi.fn((className: string) => {
			if (className.includes('delete-selection-button')) {
				return {
					length: 1,
					item: vi.fn(() => mockDeleteButton)
				} as unknown as HTMLCollectionOf<Element>;
			}
			if (className.includes('add-select-button')) {
				return {
					length: 1,
					item: vi.fn(() => mockSelectButton)
				} as unknown as HTMLCollectionOf<Element>;
			}
			return {
				length: 0,
				item: vi.fn(() => null)
			} as unknown as HTMLCollectionOf<Element>;
		});

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance with no features
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = false;
		terradraw.getMode = vi.fn(() => 'point');
		terradraw.getSnapshot = vi.fn(() => []);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).toggleDeleteSelectionButton();

		expect(mockDeleteButton.classList.add).toHaveBeenCalledWith('hidden-delete-selection');
		expect(mockSelectButton.classList.remove).toHaveBeenCalledWith('active');

		// Restore
		document.getElementsByClassName = originalGetElementsByClassName;
	});
});

describe('clearExtendedFeatures edge cases', () => {
	it('should handle clearExtendedFeatures with ids parameter', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const mockGeojsonSource = {
			data: {
				type: 'FeatureCollection',
				features: [
					{ id: '1', properties: { originalId: 'original1' } },
					{ id: '2', properties: { originalId: 'original2' } },
					{ id: '3', properties: {} }
				]
			}
		};

		const mockSource = {
			setData: vi.fn()
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => mockSource);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getStyle = vi.fn(() => ({
			sources: {
				testSource: mockGeojsonSource
			}
		}));

		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).clearExtendedFeatures(['testSource'], ['original1']);

		// Should filter out feature with originalId 'original1'
		expect(mockGeojsonSource.data.features).toHaveLength(2);
		expect(mockSource.setData).toHaveBeenCalledWith(mockGeojsonSource.data);
	});

	it('should handle clearExtendedFeatures with features without originalId', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const mockGeojsonSource = {
			data: {
				type: 'FeatureCollection',
				features: [
					{ id: 'feature1', properties: {} },
					{ id: 'feature2', properties: {} }
				]
			}
		};

		const mockSource = {
			setData: vi.fn()
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => mockSource);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getStyle = vi.fn(() => ({
			sources: {
				testSource: mockGeojsonSource
			}
		}));

		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).clearExtendedFeatures(['testSource'], ['feature1']);

		// Should filter out feature with id 'feature1'
		expect(mockGeojsonSource.data.features).toHaveLength(1);
		expect(mockGeojsonSource.data.features[0].id).toBe('feature2');
		expect(mockSource.setData).toHaveBeenCalledWith(mockGeojsonSource.data);
	});

	it('should handle clearExtendedFeatures when source does not exist', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getStyle = vi.fn(() => ({
			sources: {}
		}));

		control.onAdd(mockMap);

		// Should not throw when source doesn't exist
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).clearExtendedFeatures(['nonexistentSource'])).not.toThrow();
	});
});

describe('DOM manipulation edge cases', () => {
	it('should handle null buttons in toggleDeleteSelectionButton', () => {
		const control = new MaplibreTerradrawControl({ modes: ['select'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const originalGetElementsByClassName = document.getElementsByClassName;
		document.getElementsByClassName = vi.fn(
			() =>
				({
					length: 1,
					item: vi.fn(() => null) // Return null button
				}) as unknown as HTMLCollectionOf<Element>
		);

		control.onAdd(mockMap);

		// Should not throw when button is null
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).toggleDeleteSelectionButton()).not.toThrow();

		// Restore
		document.getElementsByClassName = originalGetElementsByClassName;
	});

	it('should handle empty button collections', () => {
		const control = new MaplibreTerradrawControl({ modes: ['point'] });
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;

		// Should not throw with empty button collections
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => (control as any).toggleButtonsWhenNoFeature()).not.toThrow();
	});
});

describe('getFeatures with different modes', () => {
	it('should filter out select mode features correctly', () => {
		const control = new MaplibreTerradrawControl();
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		control.onAdd(mockMap);

		const mockFeatures = [
			{
				id: '1',
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [0, 0] },
				properties: { mode: 'point', selected: false }
			},
			{
				id: '2',
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [1, 1] },
				properties: { mode: 'select', selected: false }
			}
		];

		// Configure the mocked terradraw instance
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);

		const result = control.getFeatures(false);
		expect(result).toBeDefined();
		expect(result?.type).toBe('FeatureCollection');
		expect(result?.features).toHaveLength(1); // select mode should be filtered out
		expect(result?.features[0].properties.mode).toBe('point');
	});
});

describe('advanced button interactions', () => {
	let container: HTMLElement;
	let mockMap: Map;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		mockMap = new Map({ container, style: maplibreStyle });
	});

	it('should handle getTerraDrawInstance proxy setMode method', () => {
		const control = new MaplibreTerradrawControl({ modes: ['rectangle'] });
		control.onAdd(mockMap);

		const instance = control.getTerraDrawInstance();
		const setModeSpy = vi.fn();

		// Mock the terradraw instance to have a setMode method
		const terraDraw = control.getTerraDrawInstance()!;
		terraDraw.setMode = setModeSpy;

		// Call setMode through the proxy
		instance!.setMode('rectangle');

		// Verify the proxy intercepted and called handleModeChange
		expect(setModeSpy).toHaveBeenCalledWith('rectangle');
	});

	it('should handle button interactions through control element', () => {
		const control = new MaplibreTerradrawControl({
			modes: ['rectangle', 'delete', 'delete-selection', 'download']
		});
		const controlElement = control.onAdd(mockMap);

		// Enable terradraw
		control.activate();

		// Add event listeners
		const featureDeletedSpy = vi.fn();
		const modeChangeSpy = vi.fn();
		control.on('feature-deleted', featureDeletedSpy);
		control.on('mode-changed', modeChangeSpy);

		// Find buttons within the control element
		const deleteButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-button'
		) as HTMLButtonElement;
		const deleteSelectionButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-selection-button'
		) as HTMLButtonElement;
		const downloadButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-download-button'
		) as HTMLButtonElement;
		const rectangleButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-add-rectangle-button'
		) as HTMLButtonElement;

		// Test delete button
		if (deleteButton) {
			deleteButton.click();
			expect(featureDeletedSpy).toHaveBeenCalled();
		}

		// Test delete-selection button
		if (deleteSelectionButton) {
			deleteSelectionButton.click();
			expect(featureDeletedSpy).toHaveBeenCalled();
		}

		// Test download button
		if (downloadButton) {
			expect(() => downloadButton.click()).not.toThrow();
		}

		// Test rectangle button for mode change
		if (rectangleButton) {
			rectangleButton.click();
			expect(modeChangeSpy).toHaveBeenCalled();
			expect(rectangleButton.classList.contains('active')).toBe(true);

			// Second click to deactivate
			rectangleButton.click();
			expect(rectangleButton.classList.contains('active')).toBe(false);
		}
	});

	it('should handle proxy pattern for setMode calls', () => {
		const control = new MaplibreTerradrawControl({ modes: ['rectangle'] });
		control.onAdd(mockMap);

		// Test proxy functionality
		const instance = control.getTerraDrawInstance();
		expect(instance).toBeDefined();

		// Test that we can call setMode through the proxy
		expect(() => instance!.setMode('rectangle')).not.toThrow();
	});

	it('should handle delete button when terradraw is disabled', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete'] });
		const controlElement = control.onAdd(mockMap);

		// Don't activate terradraw (keep it disabled)
		const deleteButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-button'
		) as HTMLButtonElement;

		if (deleteButton) {
			// Should not throw when clicking disabled terradraw
			expect(() => deleteButton.click()).not.toThrow();
		}
	});

	it('should handle delete-selection button when no features selected', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete-selection'] });
		const controlElement = control.onAdd(mockMap);

		// Enable terradraw
		control.activate();

		const deleteSelectionButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-selection-button'
		) as HTMLButtonElement;

		if (deleteSelectionButton) {
			// Should handle case when no features are selected
			expect(() => deleteSelectionButton.click()).not.toThrow();
		}
	});

	it('should handle mode button when terradraw is not available', () => {
		const control = new MaplibreTerradrawControl({ modes: ['rectangle'] });
		const controlElement = control.onAdd(mockMap);

		// Don't activate terradraw
		const rectangleButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-add-rectangle-button'
		) as HTMLButtonElement;

		if (rectangleButton) {
			// Should handle case when terradraw is not available
			expect(() => rectangleButton.click()).not.toThrow();
		}
	});

	it('should handle button click edge cases', () => {
		const control = new MaplibreTerradrawControl({
			modes: ['rectangle', 'delete', 'delete-selection']
		});
		const controlElement = control.onAdd(mockMap);

		// Test that control element exists
		expect(controlElement).toBeTruthy();

		// Enable terradraw for full functionality
		control.activate();

		// Test various button states and edge cases
		const rectangleButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-add-rectangle-button'
		) as HTMLButtonElement;
		const deleteButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-button'
		) as HTMLButtonElement;
		const deleteSelectionButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-selection-button'
		) as HTMLButtonElement;

		// Test multiple clicks and state changes
		if (rectangleButton) {
			rectangleButton.click(); // activate
			rectangleButton.click(); // deactivate
			expect(rectangleButton).toBeDefined();
		}

		if (deleteButton) {
			deleteButton.click();
			expect(deleteButton).toBeDefined();
		}

		if (deleteSelectionButton) {
			deleteSelectionButton.click();
			expect(deleteSelectionButton).toBeDefined();
		}

		// Test that at least one button was tested
		expect(controlElement.children.length).toBeGreaterThan(0);
	});

	it('should handle delete button with terradraw enabled and features', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete'] });
		const controlElement = control.onAdd(mockMap);

		// Enable terradraw
		control.activate();

		// Mock terradraw to be enabled
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;
		terradraw.clear = vi.fn();

		const deleteButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-button'
		) as HTMLButtonElement;

		if (deleteButton) {
			deleteButton.click();
			expect(terradraw.clear).toHaveBeenCalled();
		}
	});

	it('should handle delete-selection button with selected features', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete-selection'] });
		const controlElement = control.onAdd(mockMap);

		// Enable terradraw
		control.activate();

		// Mock terradraw with selected features
		const mockFeatures = [
			{
				id: 'feature1',
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [0, 0] },
				properties: { selected: true, mode: 'point' }
			},
			{
				id: 'feature2',
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [1, 1] },
				properties: { selected: false, mode: 'point' }
			}
		];

		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);
		terradraw.removeFeatures = vi.fn();
		terradraw.deselectFeature = vi.fn();

		const deleteSelectionButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-selection-button'
		) as HTMLButtonElement;

		if (deleteSelectionButton) {
			deleteSelectionButton.click();
			expect(terradraw.removeFeatures).toHaveBeenCalledWith(['feature1']);
			expect(terradraw.deselectFeature).toHaveBeenCalledWith('feature1');
		}
	});

	it('should handle mode button activation with inactive button', () => {
		const control = new MaplibreTerradrawControl({ modes: ['rectangle'] });
		const controlElement = control.onAdd(mockMap);

		// Enable terradraw
		control.activate();

		const terradraw = control.getTerraDrawInstance()!;
		terradraw.setMode = vi.fn();

		const rectangleButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-add-rectangle-button'
		) as HTMLButtonElement;

		if (rectangleButton) {
			// Ensure button is not active initially
			rectangleButton.classList.remove('active');

			rectangleButton.click();
			expect(terradraw.setMode).toHaveBeenCalledWith('rectangle');
		}
	});

	it('should handle Reflect.get in proxy for non-setMode properties', () => {
		const control = new MaplibreTerradrawControl({ modes: ['rectangle'] });
		control.onAdd(mockMap);

		const instance = control.getTerraDrawInstance()!;

		// Mock a property access that should go through Reflect.get
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;

		// Access a non-setMode property to trigger Reflect.get path
		expect(instance.enabled).toBe(true);
	});

	it('should handle toggleEditor method', () => {
		const control = new MaplibreTerradrawControl({ modes: ['rectangle'] });
		control.onAdd(mockMap);

		// Test initial expanded state
		const initialExpanded = control.isExpanded;

		// Call toggleEditor (protected method)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(control as any).toggleEditor();

		// Should toggle the expanded state
		expect(control.isExpanded).toBe(!initialExpanded);
	});

	it('should handle render mode button when expanded', () => {
		const control = new MaplibreTerradrawControl({ modes: ['render'], open: true });
		const controlElement = control.onAdd(mockMap);

		// Check that control element has children (buttons are created)
		expect(controlElement.children.length).toBeGreaterThan(0);

		// Test the expanded state
		expect(control.isExpanded).toBe(true);
	});

	it('should handle render mode button when collapsed', () => {
		const control = new MaplibreTerradrawControl({ modes: ['render'], open: false });
		const controlElement = control.onAdd(mockMap);

		// Check that control element has children (buttons are created)
		expect(controlElement.children.length).toBeGreaterThan(0);

		// Test the collapsed state
		expect(control.isExpanded).toBe(false);
	});

	it('should handle delete button when terradraw is disabled', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete'] });
		const controlElement = control.onAdd(mockMap);

		// Don't activate terradraw (keep it disabled)
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = false;

		const deleteButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-button'
		) as HTMLButtonElement;

		if (deleteButton) {
			// Should return early when terradraw is disabled
			expect(() => deleteButton.click()).not.toThrow();
		}
	});

	it('should handle delete-selection button when terradraw is disabled', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete-selection'] });
		const controlElement = control.onAdd(mockMap);

		// Don't activate terradraw (keep it disabled)
		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = false;

		const deleteSelectionButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-selection-button'
		) as HTMLButtonElement;

		if (deleteSelectionButton) {
			// Should return early when terradraw is disabled
			expect(() => deleteSelectionButton.click()).not.toThrow();
		}
	});

	it('should handle delete-selection button with no selected features', () => {
		const control = new MaplibreTerradrawControl({ modes: ['delete-selection'] });
		const controlElement = control.onAdd(mockMap);

		// Enable terradraw
		control.activate();

		// Mock terradraw with no selected features
		const mockFeatures = [
			{
				id: 'feature1',
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [0, 0] },
				properties: { selected: false, mode: 'point' }
			}
		];

		const terradraw = control.getTerraDrawInstance()!;
		terradraw.enabled = true;
		terradraw.getSnapshot = vi.fn(() => mockFeatures);
		terradraw.removeFeatures = vi.fn();

		const deleteSelectionButton = controlElement.querySelector(
			'.maplibregl-terradraw-control-delete-selection-button'
		) as HTMLButtonElement;

		if (deleteSelectionButton) {
			deleteSelectionButton.click();
			// Should not call removeFeatures when no features are selected
			expect(terradraw.removeFeatures).not.toHaveBeenCalled();
		}
	});
});
