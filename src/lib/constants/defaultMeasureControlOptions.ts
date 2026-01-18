import {
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandLineStringMode,
	TerraDrawFreehandMode,
	TerraDrawLineStringMode,
	TerraDrawMarkerMode,
	TerraDrawPointMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawSectorMode,
	TerraDrawSelectMode,
	TerraDrawSensorMode
} from 'terra-draw';
import type { MeasureControlOptions } from '../interfaces/MeasureControlOptions';
import { defaultMeasureUnitSymbols } from './defaultMeasureUnitSymbols';
import markerSvgUrl from '../../scss/icons/marker-grey.svg';
import { MAPTERHORN_TILES } from './terrainSources';

/**
 * Default MeasureControl options
 */
export const defaultMeasureControlOptions: MeasureControlOptions = {
	modes: [
		'render',
		'point',
		'marker',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'sensor',
		'sector',
		'circle',
		'freehand',
		'freehand-linestring',
		'select',
		'delete-selection',
		'delete',
		'download'
	],
	open: false,
	// see styling parameters of Terra Draw at https://github.com/JamesLMilner/terra-draw/blob/main/guides/5.STYLING.md
	modeOptions: {
		point: new TerraDrawPointMode({
			editable: true,
			styles: {
				pointColor: '#FFFFFF',
				pointWidth: 5,
				pointOutlineColor: '#666666',
				pointOutlineWidth: 1
			}
		}),
		marker: new TerraDrawMarkerMode({
			editable: true,
			styles: {
				markerUrl: markerSvgUrl,
				markerWidth: 27,
				markerHeight: 27
			}
		}),
		linestring: new TerraDrawLineStringMode({
			editable: true,
			styles: {
				lineStringColor: '#666666',
				lineStringWidth: 2,
				closingPointColor: '#FFFFFF',
				closingPointWidth: 3,
				closingPointOutlineColor: '#666666',
				closingPointOutlineWidth: 1
			}
		}),
		polygon: new TerraDrawPolygonMode({
			editable: true,
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2,
				closingPointColor: '#FAFAFA',
				closingPointWidth: 3,
				closingPointOutlineColor: '#666666',
				closingPointOutlineWidth: 1
			}
		}),
		rectangle: new TerraDrawRectangleMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2
			}
		}),
		'angled-rectangle': new TerraDrawAngledRectangleMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2
			}
		}),
		circle: new TerraDrawCircleMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2
			}
		}),
		freehand: new TerraDrawFreehandMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2,
				closingPointColor: '#FAFAFA',
				closingPointWidth: 3,
				closingPointOutlineColor: '#666666',
				closingPointOutlineWidth: 1
			}
		}),
		'freehand-linestring': new TerraDrawFreehandLineStringMode({
			styles: {
				lineStringColor: '#666666',
				lineStringWidth: 2,
				closingPointColor: '#FFFFFF',
				closingPointWidth: 3,
				closingPointOutlineColor: '#666666',
				closingPointOutlineWidth: 1
			}
		}),
		sensor: new TerraDrawSensorMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2,
				centerPointColor: '#FAFAFA',
				centerPointWidth: 3,
				centerPointOutlineColor: '#666666',
				centerPointOutlineWidth: 1
			}
		}),
		sector: new TerraDrawSectorMode({
			styles: {
				fillColor: '#EDEFF0',
				fillOpacity: 0.7,
				outlineColor: '#666666',
				outlineWidth: 2
			}
		}),
		select: new TerraDrawSelectMode({
			flags: {
				point: {
					feature: {
						draggable: false
					}
				},
				marker: {
					feature: {
						draggable: false
					}
				},
				polygon: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				linestring: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				freehand: {
					feature: {
						draggable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				'freehand-linestring': {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				circle: {
					feature: {
						draggable: true,
						coordinates: {
							resizable: 'center',
							deletable: false,
							midpoints: false
						}
					}
				},
				rectangle: {
					feature: {
						draggable: true,
						rotateable: true,
						coordinates: {
							resizable: 'opposite',
							deletable: false,
							midpoints: true
						}
					}
				},
				'angled-rectangle': {
					feature: {
						draggable: true,
						rotateable: true,
						coordinates: {
							resizable: 'opposite',
							deletable: false,
							midpoints: true
						}
					}
				},
				sensor: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				sector: {
					feature: {
						draggable: true,
						rotateable: true,
						scaleable: true,
						coordinates: {
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				}
			}
		})
	},
	pointLayerLabelSpec: {
		id: '{prefix}-point-label',
		type: 'symbol',
		source: '{prefix}-point',
		filter: [
			'all',
			['==', '$type', 'Point'],
			['any', ['==', 'mode', 'point'], ['==', 'mode', 'marker']]
		],
		layout: {
			'text-field': [
				'case',
				['all', ['has', 'elevation'], ['>', ['get', 'elevation'], 0]],
				[
					'concat',
					'Alt. ',
					['to-string', ['floor', ['get', 'elevation']]],
					' ',
					['get', 'elevationUnit']
				],
				''
			],
			'symbol-placement': 'point',
			'text-size': [
				'interpolate',
				['linear'],
				['zoom'],
				5,
				10,
				10,
				12.0,
				13,
				14.0,
				14,
				16.0,
				18,
				18.0
			],
			'text-overlap': 'always',
			'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
			'text-radial-offset': 0.5,
			'text-justify': 'center',
			'text-letter-spacing': 0.05
		},
		paint: {
			'text-halo-color': '#F7F7F7',
			'text-halo-width': 2,
			'text-color': '#232E3D'
		}
	},
	lineLayerLabelSpec: {
		id: '{prefix}-line-label',
		type: 'symbol',
		source: '{prefix}-line-source',
		filter: ['==', '$type', 'Point'],
		layout: {
			'text-field': [
				'concat',
				['to-string', ['get', 'distance']],
				' ',
				['get', 'unit'],
				[
					'case',
					['==', ['get', 'total'], 0],
					'',
					['concat', '\n(', ['to-string', ['get', 'total']], ' ', ['get', 'totalUnit'], ')']
				],
				[
					'case',
					['all', ['has', 'elevation'], ['>', ['get', 'elevation'], 0]],
					[
						'concat',
						'\nAlt. ',
						['to-string', ['floor', ['get', 'elevation']]],
						' ',
						['get', 'elevationUnit']
					],
					''
				]
			],
			'symbol-placement': 'point',
			'text-size': [
				'interpolate',
				['linear'],
				['zoom'],
				5,
				10,
				10,
				12.0,
				13,
				14.0,
				14,
				16.0,
				18,
				18.0
			],
			'text-overlap': 'always',
			'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
			'text-radial-offset': 0.5,
			'text-justify': 'center',
			'text-letter-spacing': 0.05
		},
		paint: {
			'text-halo-color': '#F7F7F7',
			'text-halo-width': 2,
			'text-color': '#232E3D'
		}
	},
	routingLineLayerNodeSpec: {
		id: '{prefix}-line-node',
		type: 'circle',
		source: '{prefix}-line-source',
		filter: ['==', '$type', 'Point'],
		layout: {},
		paint: {
			'circle-radius': 3,
			'circle-color': '#FFFFFF',
			'circle-stroke-color': '#000000',
			'circle-stroke-width': 1
		}
	},
	polygonLayerSpec: {
		id: '{prefix}-polygon-label',
		type: 'symbol',
		source: '{prefix}-polygon-source',
		filter: ['==', '$type', 'Point'],
		layout: {
			'text-field': ['concat', ['to-string', ['get', 'area']], ' ', ['get', 'unit']],
			'symbol-placement': 'point',
			'text-size': [
				'interpolate',
				['linear'],
				['zoom'],
				5,
				10,
				10,
				12.0,
				13,
				14.0,
				14,
				16.0,
				18,
				18.0
			],
			'text-overlap': 'always',
			'text-letter-spacing': 0.05
		},
		paint: {
			'text-halo-color': '#F7F7F7',
			'text-halo-width': 2,
			'text-color': '#232E3D'
		}
	},
	computeElevation: false,
	terrainSource: MAPTERHORN_TILES,
	measureUnitType: 'metric',
	distancePrecision: 2,
	forceDistanceUnit: undefined,
	areaPrecision: 2,
	forceAreaUnit: 'auto',
	measureUnitSymbols: JSON.parse(JSON.stringify(defaultMeasureUnitSymbols)),
	elevationCacheConfig: {
		enabled: true,
		maxSize: 1000,
		ttl: 60 * 60 * 1000, // 1 hour
		precision: 9 // 9 is default precision of terra-draw adapter setting
	},
	adapterOptions: {
		prefixId: 'td-measure'
	}
};
