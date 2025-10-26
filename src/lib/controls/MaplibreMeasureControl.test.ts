import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaplibreMeasureControl } from './MaplibreMeasureControl';
import type { StyleSpecification } from 'maplibre-gl';
import { Map } from 'maplibre-gl';
import { TERRADRAW_MEASURE_SOURCE_IDS } from '../helpers/cleanMaplibreStyle';
import { defaultMeasureUnitSymbols } from '$lib/constants/defaultMeasureUnitSymbols';

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
		crimea: {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: []
			}
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
			id: 'coastline',
			type: 'line',
			source: 'maplibre',
			'source-layer': 'countries',
			minzoom: 0,
			maxzoom: 24,
			filter: ['all'],
			layout: {
				'line-cap': 'round',
				'line-join': 'round',
				visibility: 'visible'
			},
			paint: {}
		},
		{
			id: 'countries-fill',
			type: 'fill',
			source: 'maplibre',
			'source-layer': 'countries',
			maxzoom: 24,
			filter: ['all'],
			layout: {
				visibility: 'visible'
			},
			paint: {}
		},
		{
			id: 'countries-boundary',
			type: 'line',
			source: 'maplibre',
			'source-layer': 'countries',
			maxzoom: 24,
			layout: {
				'line-cap': 'round',
				'line-join': 'round',
				visibility: 'visible'
			},
			paint: {}
		},
		{
			id: 'geolines',
			type: 'line',
			source: 'maplibre',
			'source-layer': 'geolines',
			maxzoom: 24,
			filter: ['all', ['!=', 'name', 'International Date Line']],
			layout: {
				visibility: 'visible'
			},
			paint: {}
		},
		{
			id: 'geolines-label',
			type: 'symbol',
			source: 'maplibre',
			'source-layer': 'geolines',
			minzoom: 1,
			maxzoom: 24,
			filter: ['all', ['!=', 'name', 'International Date Line']],
			layout: {},
			paint: {}
		},
		{
			id: 'countries-label',
			type: 'symbol',
			source: 'maplibre',
			'source-layer': 'centroids',
			minzoom: 2,
			maxzoom: 24,
			filter: ['all'],
			layout: {},
			paint: {}
		},
		{
			id: 'crimea-fill',
			type: 'fill',
			source: 'crimea',
			paint: {
				'fill-color': '#D6C7FF'
			}
		},
		{
			id: 'td-measure-linestring',
			type: 'line',
			source: 'td-measure-linestring',
			paint: {
				'line-width': ['get', 'lineStringWidth'],
				'line-color': ['get', 'lineStringColor']
			}
		},
		{
			id: 'td-measure-polygon',
			type: 'fill',
			source: 'td-measure-polygon',
			paint: {
				'fill-color': ['get', 'polygonFillColor'],
				'fill-opacity': ['get', 'polygonFillOpacity']
			}
		},
		{
			id: 'td-measure-polygon-outline',
			type: 'line',
			source: 'td-measure-polygon',
			paint: {
				'line-width': ['get', 'polygonOutlineWidth'],
				'line-color': ['get', 'polygonOutlineColor']
			}
		},
		{
			id: 'td-measure-point',
			type: 'circle',
			source: 'td-measure-point',
			paint: {
				'circle-stroke-color': ['get', 'pointOutlineColor'],
				'circle-stroke-width': ['get', 'pointOutlineWidth'],
				'circle-radius': ['get', 'pointWidth'],
				'circle-color': ['get', 'pointColor']
			}
		}
	]
};

describe('cleanStyle method', () => {
	const sourceIds = TERRADRAW_MEASURE_SOURCE_IDS.map((id) => id.replace('{prefix}', 'td-measure'));

	it('should return the original style when no options are set', () => {
		const control = new MaplibreMeasureControl();
		const result = control.cleanStyle(maplibreStyle);
		expect(result).toEqual(maplibreStyle);
	});

	it('should exclude TerraDraw layers when excludeTerraDrawLayers is true', () => {
		const control = new MaplibreMeasureControl();
		const result = control.cleanStyle(maplibreStyle, { excludeTerraDrawLayers: true });
		expect(
			result.layers.some((layer) => 'source' in layer && sourceIds.includes(layer.source as string))
		).toBe(false);
		expect(Object.keys(result.sources).some((source) => sourceIds.includes(source))).toBe(false);
	});

	it('should include only TerraDraw layers when onlyTerraDrawLayers is true', () => {
		const control = new MaplibreMeasureControl();
		const result = control.cleanStyle(maplibreStyle, { onlyTerraDrawLayers: true });
		expect(
			result.layers.every(
				(layer) => 'source' in layer && sourceIds.includes(layer.source as string)
			)
		).toBe(true);
		expect(Object.keys(result.sources).every((source) => sourceIds.includes(source))).toBe(true);
	});
});

describe('measureUnitType', () => {
	it('should return imperial measure unit type value user set', () => {
		const control = new MaplibreMeasureControl({ measureUnitType: 'imperial' });
		expect(control.measureUnitType).toEqual('imperial');
	});

	it('should return metric measure unit type value user set', () => {
		const control = new MaplibreMeasureControl({ measureUnitType: 'metric' });
		expect(control.measureUnitType).toEqual('metric');
	});

	it('should return metric measure unit type value if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.measureUnitType).toEqual('metric');
	});

	it('should return imperial measure unit type value if user set through property', () => {
		const control = new MaplibreMeasureControl({ computeElevation: true });

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalculateElevationUnits');
		control.measureUnitType = 'imperial';
		expect(control.measureUnitType).toEqual('imperial');
		expect(spy).toHaveBeenCalled();
	});
});

describe('distancePrecision', () => {
	it('should return distance precision value user set', () => {
		const control = new MaplibreMeasureControl({ distancePrecision: 6 });
		expect(control.distancePrecision).toEqual(6);
	});

	it('should return default distance precision value if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.distancePrecision).toEqual(2);
	});

	it('should return imperial measure unit type value if user set through property', () => {
		const control = new MaplibreMeasureControl({ distancePrecision: 6 });

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalc');
		control.distancePrecision = 8;
		expect(control.distancePrecision).toEqual(8);
		expect(spy).toHaveBeenCalled();
	});
});

describe('areaPrecision', () => {
	it('should return area precision value user set', () => {
		const control = new MaplibreMeasureControl({ areaPrecision: 6 });
		expect(control.areaPrecision).toEqual(6);
	});

	it('should return default area precision value if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.areaPrecision).toEqual(2);
	});

	it('should return imperial measure unit type value if user set through property', () => {
		const control = new MaplibreMeasureControl({ areaPrecision: 6 });

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalc');
		control.areaPrecision = 8;
		expect(control.areaPrecision).toEqual(8);
		expect(spy).toHaveBeenCalled();
	});
});

describe('forceDistanceUnit', () => {
	it('should return forceDistanceUnit value user set', () => {
		const control = new MaplibreMeasureControl({ forceDistanceUnit: 'meter' });
		expect(control.forceDistanceUnit).toEqual('meter');
	});

	it('should return default forceDistanceUnit value if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.forceDistanceUnit).toEqual('auto');
	});

	it('should return forceDistanceUnit value if user set through property', () => {
		const control = new MaplibreMeasureControl({
			forceDistanceUnit: 'meter',
			measureUnitType: 'metric'
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalc');
		control.forceDistanceUnit = 'centimeter';
		expect(control.forceDistanceUnit).toEqual('centimeter');
		expect(spy).toHaveBeenCalled();
	});
});

describe('forceAreaUnit', () => {
	it('should return forceAreaUnit value user set', () => {
		const control = new MaplibreMeasureControl({
			forceAreaUnit: 'hectares',
			measureUnitType: 'imperial'
		});
		expect(control.forceAreaUnit).toEqual('hectares');
	});

	it('should return default forceAreaUnit value if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.forceAreaUnit).toEqual('auto');
	});

	it('should return forceAreaUnit value if user set through property', () => {
		const control = new MaplibreMeasureControl({
			forceAreaUnit: 'hectares',
			measureUnitType: 'imperial'
		});

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalc');
		control.forceAreaUnit = 'acres';
		expect(control.forceAreaUnit).toEqual('acres');
		expect(spy).toHaveBeenCalled();
	});
});

describe('measureUnitSymbols', () => {
	it('should return default measure unit symbols if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.measureUnitSymbols).toEqual(defaultMeasureUnitSymbols);
	});

	it('should return default measure unit symbols if user does not specify', () => {
		const control = new MaplibreMeasureControl();

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalc');

		const testSymbols = JSON.parse(JSON.stringify(defaultMeasureUnitSymbols));
		testSymbols.meter = 'meters_custom';
		control.measureUnitSymbols = testSymbols;
		expect(control.measureUnitSymbols).toEqual(testSymbols);
		expect(spy).toHaveBeenCalled();
	});
});

describe('computeElevation', () => {
	it('should return default computeElevation value if user does not specify', () => {
		const control = new MaplibreMeasureControl();
		expect(control.computeElevation).toEqual(false);
	});

	it('should return computeElevation value if user set through property', () => {
		const control = new MaplibreMeasureControl({ computeElevation: false });

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore;
		const spy = vi.spyOn(control, 'recalc');

		control.computeElevation = true;
		expect(control.computeElevation).toEqual(true);
		expect(spy).toHaveBeenCalled();
	});
});

describe('custom font glyphs', () => {
	let control: MaplibreMeasureControl;

	beforeEach(() => {
		control = new MaplibreMeasureControl();
	});

	it('should return font glyph value user set', () => {
		control.fontGlyphs = ['Open Sans Italic'];
		expect(control.fontGlyphs).toEqual(['Open Sans Italic']);
	});

	it('should return undefined if user do not set font glyphs', () => {
		expect(control.fontGlyphs).toEqual(undefined);
	});
});

describe('onAdd method tests', () => {
	let control: MaplibreMeasureControl;

	beforeEach(() => {
		control = new MaplibreMeasureControl({
			modes: ['point', 'linestring', 'polygon']
		});
	});

	it('should call parent onAdd method and return control container', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const result = control.onAdd(mockMap);

		expect(result).toBeInstanceOf(HTMLElement);
		expect(result.classList.contains('maplibregl-ctrl')).toBe(true);
		expect(result.classList.contains('maplibregl-ctrl-group')).toBe(true);
	});

	it('should return HTML element when onAdd is called', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		const result = control.onAdd(mockMap);

		expect(result).toBeInstanceOf(HTMLElement);
	});
});

describe('onRemove method tests', () => {
	let control: MaplibreMeasureControl;

	beforeEach(() => {
		control = new MaplibreMeasureControl({
			modes: ['point', 'linestring', 'polygon']
		});
	});

	it('should call unregisterMesureControl and parent onRemove', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map methods that are used during cleanup
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getLayer = vi.fn(() => true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).removeLayer = vi.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).removeSource = vi.fn();

		// First add the control to set up internal state
		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const unregisterSpy = vi.spyOn(control as any, 'unregisterMesureControl');

		control.onRemove();

		expect(unregisterSpy).toHaveBeenCalled();
	});

	it('should clean up resources when onRemove is called', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map methods that are used during cleanup
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getLayer = vi.fn(() => true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).removeLayer = vi.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => true);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).removeSource = vi.fn();

		// First add the control
		control.onAdd(mockMap);

		// Mock the unregisterMesureControl to verify it's called
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const unregisterSpy = vi.spyOn(control as any, 'unregisterMesureControl');

		control.onRemove();

		expect(unregisterSpy).toHaveBeenCalled();
	});
});
describe('activate method tests', () => {
	let control: MaplibreMeasureControl;

	beforeEach(() => {
		control = new MaplibreMeasureControl({
			modes: ['point', 'linestring', 'polygon']
		});
	});

	it('should call parent activate method and registerMesureControl', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map methods that are used during activation
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getLayer = vi.fn(() => undefined);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).addLayer = vi.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => undefined);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).addSource = vi.fn();

		// First add the control to set up internal state
		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const registerSpy = vi.spyOn(control as any, 'registerMesureControl');

		control.activate();

		expect(registerSpy).toHaveBeenCalled();
	});

	it('should initialize measurement controls when activate is called', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map methods that are used during activation
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getLayer = vi.fn(() => undefined);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).addLayer = vi.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => undefined);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).addSource = vi.fn();

		// First add the control
		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const registerSpy = vi.spyOn(control as any, 'registerMesureControl');

		control.activate();

		expect(registerSpy).toHaveBeenCalled();
	});

	it('should work without errors when called multiple times', () => {
		const mockMap = new Map({ container: document.createElement('div'), style: maplibreStyle });

		// Mock map methods that are used during activation
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getLayer = vi.fn(() => undefined);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).addLayer = vi.fn();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).getSource = vi.fn(() => undefined);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockMap as any).addSource = vi.fn();

		// First add the control
		control.onAdd(mockMap);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const registerSpy = vi.spyOn(control as any, 'registerMesureControl');

		// Call activate multiple times
		control.activate();
		control.activate();
		control.activate();

		expect(registerSpy).toHaveBeenCalledTimes(3);
	});
});
