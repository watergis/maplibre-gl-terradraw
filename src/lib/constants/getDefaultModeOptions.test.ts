import { describe, it, expect, vi } from 'vitest';
import { getDefaultModeOptions, polygonValidation } from './getDefaultModeOptions';
import { ValidateNotSelfIntersecting, type GeoJSONStoreFeatures } from 'terra-draw';

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
		expect(modeOptions.delete).toHaveProperty('mode', 'delete');
		expect(modeOptions['delete-selection']).toHaveProperty('mode', 'delete-selection');
		expect(modeOptions.download).toHaveProperty('mode', 'download');
	});
});

describe('polygonValidation', () => {
	const mockFeature: GeoJSONStoreFeatures = {
		id: 'test-polygon',
		type: 'Feature',
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[0, 0],
					[1, 0],
					[1, 1],
					[0, 1],
					[0, 0]
				]
			]
		},
		properties: {}
	};

	it('should return valid true for non-finish/commit updateTypes', () => {
		const result = polygonValidation(mockFeature, { updateType: 'drag' });
		expect(result).toEqual({ valid: true });
	});

	it('should return valid true for update updateType', () => {
		const result = polygonValidation(mockFeature, { updateType: 'update' });
		expect(result).toEqual({ valid: true });
	});

	it('should call ValidateNotSelfIntersecting for finish updateType', () => {
		const mockValidationResult = { valid: true };
		vi.mocked(ValidateNotSelfIntersecting).mockReturnValue(mockValidationResult);

		const result = polygonValidation(mockFeature, { updateType: 'finish' });

		expect(ValidateNotSelfIntersecting).toHaveBeenCalledWith(mockFeature);
		expect(result).toBe(mockValidationResult);
	});

	it('should call ValidateNotSelfIntersecting for commit updateType', () => {
		const mockValidationResult = { valid: false, reason: 'Self-intersecting polygon' };
		vi.mocked(ValidateNotSelfIntersecting).mockReturnValue(mockValidationResult);

		const result = polygonValidation(mockFeature, { updateType: 'commit' });

		expect(ValidateNotSelfIntersecting).toHaveBeenCalledWith(mockFeature);
		expect(result).toBe(mockValidationResult);
	});

	it('should handle invalid polygon from ValidateNotSelfIntersecting', () => {
		const mockValidationResult = { valid: false, reason: 'Invalid geometry' };
		vi.mocked(ValidateNotSelfIntersecting).mockReturnValue(mockValidationResult);

		const result = polygonValidation(mockFeature, { updateType: 'finish' });

		expect(result.valid).toBe(false);
		expect(result.reason).toBe('Invalid geometry');
	});
});
