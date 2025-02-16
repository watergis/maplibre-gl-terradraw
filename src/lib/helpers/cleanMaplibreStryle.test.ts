import { describe, expect, it } from 'vitest';
import {
	cleanMaplibreStyle,
	TERRADRAW_MEASURE_SOURCE_IDS,
	TERRADRAW_SOURCE_IDS
} from './cleanMaplibreStyle';
import type { StyleSpecification } from 'maplibre-gl';

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
			id: 'td-polygon-outline',
			type: 'line',
			source: 'td-polygon',
			paint: {
				'line-width': ['get', 'polygonOutlineWidth'],
				'line-color': ['get', 'polygonOutlineColor']
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

describe('cleanMaplibreStyle - default control', () => {
	it('should return the original style when no options are set', () => {
		const result = cleanMaplibreStyle(maplibreStyle);
		expect(result).toEqual(maplibreStyle);
	});

	it('should exclude TerraDraw layers when excludeTerraDrawLayers is true', () => {
		const result = cleanMaplibreStyle(maplibreStyle, { excludeTerraDrawLayers: true });
		expect(
			result.layers.some(
				(layer) => 'source' in layer && TERRADRAW_SOURCE_IDS.includes(layer.source as string)
			)
		).toBe(false);
		expect(
			Object.keys(result.sources).some((source) => TERRADRAW_SOURCE_IDS.includes(source))
		).toBe(false);
	});

	it('should include only TerraDraw layers when onlyTerraDrawLayers is true', () => {
		const result = cleanMaplibreStyle(maplibreStyle, { onlyTerraDrawLayers: true });
		expect(
			result.layers.every(
				(layer) => 'source' in layer && TERRADRAW_SOURCE_IDS.includes(layer.source as string)
			)
		).toBe(true);
		expect(
			Object.keys(result.sources).every((source) => TERRADRAW_SOURCE_IDS.includes(source))
		).toBe(true);
	});
});

describe('cleanMaplibreStyle - measure control', () => {
	it('should return the original style when no options are set', () => {
		const result = cleanMaplibreStyle(maplibreStyle);
		expect(result).toEqual(maplibreStyle);
	});

	it('should exclude TerraDraw layers when excludeTerraDrawLayers is true', () => {
		const result = cleanMaplibreStyle(maplibreStyle, { excludeTerraDrawLayers: true });
		expect(
			result.layers.some(
				(layer) =>
					'source' in layer && TERRADRAW_MEASURE_SOURCE_IDS.includes(layer.source as string)
			)
		).toBe(false);
		expect(
			Object.keys(result.sources).some((source) => TERRADRAW_MEASURE_SOURCE_IDS.includes(source))
		).toBe(false);
	});

	it('should include only TerraDraw layers when onlyTerraDrawLayers is true', () => {
		const result = cleanMaplibreStyle(maplibreStyle, { onlyTerraDrawLayers: true });
		expect(
			result.layers.every(
				(layer) =>
					'source' in layer && TERRADRAW_MEASURE_SOURCE_IDS.includes(layer.source as string)
			)
		).toBe(true);
		expect(
			Object.keys(result.sources).every((source) => TERRADRAW_MEASURE_SOURCE_IDS.includes(source))
		).toBe(true);
	});
});
