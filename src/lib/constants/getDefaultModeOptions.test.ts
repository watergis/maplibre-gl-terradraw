import { describe, it, expect } from 'vitest';
import { getDefaultModeOptions } from './getDefaultModeOptions';
import {
	TerraDrawRenderMode,
	TerraDrawPointMode,
	TerraDrawMarkerMode,
	TerraDrawLineStringMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawFreehandLineStringMode,
	TerraDrawSensorMode,
	TerraDrawSectorMode,
	TerraDrawSelectMode
} from 'terra-draw';

describe('getDefaultModeOptions', () => {
	it('should return an object with the expected mode keys', () => {
		const modeOptions = getDefaultModeOptions();
		expect(modeOptions).toHaveProperty('render');
		expect(modeOptions).toHaveProperty('point');
		expect(modeOptions).toHaveProperty('marker');
		expect(modeOptions).toHaveProperty('linestring');
		expect(modeOptions).toHaveProperty('polygon');
		expect(modeOptions).toHaveProperty('rectangle');
		expect(modeOptions).toHaveProperty('angled-rectangle');
		expect(modeOptions).toHaveProperty('circle');
		expect(modeOptions).toHaveProperty('freehand');
		expect(modeOptions).toHaveProperty('freehand-linestring');
		expect(modeOptions).toHaveProperty('sensor');
		expect(modeOptions).toHaveProperty('sector');
		expect(modeOptions).toHaveProperty('select');
		expect(modeOptions).toHaveProperty('delete');
		expect(modeOptions).toHaveProperty('delete-selection');
		expect(modeOptions).toHaveProperty('download');
	});

	it('should return instances of the expected classes', () => {
		const modeOptions = getDefaultModeOptions();
		expect(modeOptions.render).toBeInstanceOf(TerraDrawRenderMode);
		expect(modeOptions.point).toBeInstanceOf(TerraDrawPointMode);
		expect(modeOptions.marker).toBeInstanceOf(TerraDrawMarkerMode);
		expect(modeOptions.linestring).toBeInstanceOf(TerraDrawLineStringMode);
		expect(modeOptions.polygon).toBeInstanceOf(TerraDrawPolygonMode);
		expect(modeOptions.rectangle).toBeInstanceOf(TerraDrawRectangleMode);
		expect(modeOptions['angled-rectangle']).toBeInstanceOf(TerraDrawAngledRectangleMode);
		expect(modeOptions.circle).toBeInstanceOf(TerraDrawCircleMode);
		expect(modeOptions.freehand).toBeInstanceOf(TerraDrawFreehandMode);
		expect(modeOptions['freehand-linestring']).toBeInstanceOf(TerraDrawFreehandLineStringMode);
		expect(modeOptions.sensor).toBeInstanceOf(TerraDrawSensorMode);
		expect(modeOptions.sector).toBeInstanceOf(TerraDrawSectorMode);
		expect(modeOptions.select).toBeInstanceOf(TerraDrawSelectMode);
		expect(modeOptions.delete).toBeInstanceOf(TerraDrawRenderMode);
		expect(modeOptions['delete-selection']).toBeInstanceOf(TerraDrawRenderMode);
		expect(modeOptions.download).toBeInstanceOf(TerraDrawRenderMode);
	});
});
