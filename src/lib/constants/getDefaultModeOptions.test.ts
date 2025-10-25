import { describe, it, expect } from 'vitest';
import { getDefaultModeOptions } from './getDefaultModeOptions';

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

	it('should return instances with expected mode properties', () => {
		const modeOptions = getDefaultModeOptions();
		expect(modeOptions.render).toHaveProperty('mode', 'render');
		expect(modeOptions.point).toHaveProperty('mode', 'point');
		expect(modeOptions.marker).toHaveProperty('mode', 'marker');
		expect(modeOptions.linestring).toHaveProperty('mode', 'linestring');
		expect(modeOptions.polygon).toHaveProperty('mode', 'polygon');
		expect(modeOptions.rectangle).toHaveProperty('mode', 'rectangle');
		expect(modeOptions['angled-rectangle']).toHaveProperty('mode', 'angled-rectangle');
		expect(modeOptions.circle).toHaveProperty('mode', 'circle');
		expect(modeOptions.freehand).toHaveProperty('mode', 'freehand');
		expect(modeOptions['freehand-linestring']).toHaveProperty('mode', 'freehand-linestring');
		expect(modeOptions.sensor).toHaveProperty('mode', 'sensor');
		expect(modeOptions.sector).toHaveProperty('mode', 'sector');
		expect(modeOptions.select).toHaveProperty('mode', 'select');
		expect(modeOptions.delete).toHaveProperty('mode', 'render');
		expect(modeOptions['delete-selection']).toHaveProperty('mode', 'render');
		expect(modeOptions.download).toHaveProperty('mode', 'render');
	});
});
