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
				markerUrl:
					'data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%20standalone%3D%22no%22%3F%3E%3Csvg%20%20%20xmlns%3Adc%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Felements%2F1.1%2F%22%20%20%20xmlns%3Acc%3D%22http%3A%2F%2Fcreativecommons.org%2Fns%23%22%20%20%20xmlns%3Ardf%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%22%20%20%20xmlns%3Asvg%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%20%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20%20%20xmlns%3Asodipodi%3D%22http%3A%2F%2Fsodipodi.sourceforge.net%2FDTD%2Fsodipodi-0.dtd%22%20%20%20xmlns%3Ainkscape%3D%22http%3A%2F%2Fwww.inkscape.org%2Fnamespaces%2Finkscape%22%20%20%20inkscape%3Aversion%3D%221.0%20(4035a4fb49%2C%202020-05-01)%22%20%20%20sodipodi%3Adocname%3D%22poi.svg%22%20%20%20id%3D%22svg4460%22%20%20%20height%3D%22100%22%20%20%20width%3D%22100%22%20%20%20version%3D%221.1%22%3E%3Csodipodi%3Anamedview%20%20%20%20%20inkscape%3Adocument-rotation%3D%220%22%20%20%20%20%20inkscape%3Acurrent-layer%3D%22svg4460%22%20%20%20%20%20inkscape%3Awindow-maximized%3D%221%22%20%20%20%20%20inkscape%3Awindow-y%3D%22-8%22%20%20%20%20%20inkscape%3Awindow-x%3D%22-8%22%20%20%20%20%20inkscape%3Acy%3D%2270.031285%22%20%20%20%20%20inkscape%3Acx%3D%22-78.460726%22%20%20%20%20%20inkscape%3Azoom%3D%222.02%22%20%20%20%20%20showgrid%3D%22false%22%20%20%20%20%20id%3D%22namedview11%22%20%20%20%20%20inkscape%3Awindow-height%3D%221017%22%20%20%20%20%20inkscape%3Awindow-width%3D%221920%22%20%20%20%20%20inkscape%3Apageshadow%3D%222%22%20%20%20%20%20inkscape%3Apageopacity%3D%220%22%20%20%20%20%20guidetolerance%3D%2210%22%20%20%20%20%20gridtolerance%3D%2210%22%20%20%20%20%20objecttolerance%3D%2210%22%20%20%20%20%20borderopacity%3D%221%22%20%20%20%20%20bordercolor%3D%22%23666666%22%20%20%20%20%20pagecolor%3D%22%23ffffff%22%20%2F%3E%3Cdefs%20%20%20%20%20id%3D%22defs4462%22%20%2F%3E%3Cmetadata%20%20%20%20%20id%3D%22metadata4465%22%3E%3Crdf%3ARDF%3E%3Ccc%3AWork%20%20%20%20%20%20%20%20%20rdf%3Aabout%3D%22%22%3E%3Cdc%3Aformat%3Eimage%2Fsvg%2Bxml%3C%2Fdc%3Aformat%3E%3Cdc%3Atype%20%20%20%20%20%20%20%20%20%20%20rdf%3Aresource%3D%22http%3A%2F%2Fpurl.org%2Fdc%2Fdcmitype%2FStillImage%22%20%2F%3E%3Cdc%3Atitle%3E%3C%2Fdc%3Atitle%3E%3C%2Fcc%3AWork%3E%3C%2Frdf%3ARDF%3E%3C%2Fmetadata%3E%3Cpath%20%20%20%20%20d%3D%22M%2050.001528%2C3.3861402e-7%20C%2030.763177%2C3.3861402e-7%2015%2C15.718144%2015%2C34.901534%20c%200%2C7.432782%202.373565%2C14.339962%206.391689%2C20.019029%20l%2024.338528%2C42.073163%20c%203.40849%2C4.452814%205.674917%2C3.607154%208.509014%2C-0.23458%20L%2081.083105%2C51.075788%20C%2081.625418%2C50.0948%2082.050328%2C49.050173%2082.421327%2C47.983517%2084.078241%2C43.936622%2085.000002%2C39.521943%2085%2C34.901534%2085%2C15.718144%2069.23988%2C3.3861402e-7%2050.001528%2C3.3861402e-7%20Z%20m%200%2C16.35400066138598%20c%2010.359296%2C0%2018.597616%2C8.21783%2018.597618%2C18.547533%200%2C10.329703%20-8.238322%2C18.544487%20-18.597618%2C18.544487%20-10.359299%2C0%20-18.600672%2C-8.214784%20-18.600672%2C-18.544487%200%2C-10.329703%208.241373%2C-18.547533%2018.600672%2C-18.547533%20z%22%20%20%20%20%20style%3D%22fill%3Argb(95%2C%2099%2C%20104)%3Bstroke-width%3A4.26019%22%20%20%20%20%20id%3D%22path4135%22%20%2F%3E%3C%2Fsvg%3E',
				markerWidth: 24,
				markerHeight: 24
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
							midpoints: true,
							draggable: true,
							deletable: true
						}
					}
				},
				rectangle: {
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
				'angled-rectangle': {
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
		source: '{prefix}-point-source',
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
	terrainSource: {
		url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
		encoding: 'terrarium',
		tileSize: 256,
		minzoom: 5,
		maxzoom: 15,
		tms: false
	},
	measureUnitType: 'metric',
	distancePrecision: 2,
	forceDistanceUnit: 'auto',
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
