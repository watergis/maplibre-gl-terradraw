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
