import { describe, it, expect, vi, afterEach } from 'vitest';
import { TerraDrawTextMode } from './TerraDrawTextMode';
import {
	defaultTextAreaStyleOptions,
	defaultSubmitButtonStyleOptions,
	defaultTextAreaWrapperStyleOptions
} from '../constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

const mockEvent = (overrides = {}): any => ({
	lng: 10,
	lat: 20,
	containerX: 100,
	containerY: 200,
	button: 'left',
	heldKeys: [],
	...overrides
});

const mockStore = () => ({
	create: vi.fn().mockReturnValue(['feature-1']),
	delete: vi.fn(),
	copyAll: vi.fn().mockReturnValue([]),
	updateGeometry: vi.fn(),
	updateProperty: vi.fn()
});

const mountMode = (options = {}) => {
	const mode = new TerraDrawTextMode(options);

	// mock internal TerraDraw base class methods
	(mode as any).store = mockStore();
	(mode as any).project = vi.fn().mockReturnValue({ x: 100, y: 200 });
	(mode as any).unproject = vi.fn();
	(mode as any).pointerDistance = 40;
	(mode as any).setCursor = vi.fn();
	(mode as any).onFinish = vi.fn();
	(mode as any).setStarted = vi.fn();
	(mode as any).setStopped = vi.fn();
	(mode as any).allowPointerEvent = vi.fn().mockReturnValue(true);
	(mode as any).pointerEvents = {
		rightClick: true
	};
	(mode as any)._mapContainer = document.createElement('div');
	document.body.appendChild((mode as any)._mapContainer);

	return mode;
};

describe('MaplibreTerradrawTextMode', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	// 1. Lifecycle
	describe('lifecycle', () => {
		it('initialises with default options when none are passed', () => {
			const mode = new TerraDrawTextMode();
			expect(mode.mode).toBe('text');
		});

		it('sets editable from options', () => {
			const mode = mountMode({ editable: true });
			expect((mode as any).editable).toBe(true);
		});

		it('defaults editable to false when not passed', () => {
			const mode = mountMode();
			expect((mode as any).editable).toBe(false);
		});

		it('start() sets started state and crosshair cursor', () => {
			const mode = mountMode();
			mode.start();
			expect((mode as any).setStarted).toHaveBeenCalled();
			expect((mode as any).setCursor).toHaveBeenCalledWith('crosshair');
		});

		it('stop() calls cleanUp, setStopped and resets cursor', () => {
			const mode = mountMode();
			const cleanUpSpy = vi.spyOn(mode as any, 'cleanUp');
			mode.stop();
			expect(cleanUpSpy).toHaveBeenCalled();
			expect((mode as any).setStopped).toHaveBeenCalled();
			expect((mode as any).setCursor).toHaveBeenCalledWith('unset');
		});

		it('cleanUp() removes textarea wrapper, textarea, and resets drag state', () => {
			const mode = mountMode();
			const textAreaWrapper = document.createElement('div');
			const textarea = document.createElement('textarea');

			(mode as any)._mapContainer.appendChild(textAreaWrapper);
			textAreaWrapper.appendChild(textarea);

			(mode as any).activeWrapper = textAreaWrapper;
			(mode as any).activeTextarea = textarea;
			(mode as any).activeFeatureId = 'feature-1';

			mode.cleanUp();

			expect((mode as any).activeTextarea).toBeNull();
			expect(document.body.contains(textAreaWrapper)).toBe(false);
		});

		it('cleanUp() deletes uncommitted feature', () => {
			const mode = mountMode();
			(mode as any).activeFeatureId = 'feature-1';
			mode.cleanUp();
			expect((mode as any).store.delete).toHaveBeenCalledWith(['feature-1']);
		});
	});

	// 2. Text area creation
	describe('textarea creation', () => {
		it('appends textarea to map container on click', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			const textarea = (mode as any)._mapContainer.querySelector('textarea');
			expect(textarea).not.toBeNull();
		});

		it('textarea uses custom placeholder when provided', () => {
			const mode = mountMode({ placeholder: 'Custom placeholder' });
			mode.onClick(mockEvent());
			const textarea = (mode as any)._mapContainer.querySelector('textarea');
			expect(textarea?.placeholder).toBe('Custom placeholder');
		});

		it('textarea defaults to "Enter label..." when no placeholder provided', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			const textarea = (mode as any)._mapContainer.querySelector('textarea');
			expect(textarea?.placeholder).toBe('Enter label...');
		});

		it('does not append duplicate textareas on multiple clicks', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			mode.onClick(mockEvent());
			const textareas = (mode as any)._mapContainer.querySelectorAll('textarea');
			expect(textareas.length).toBe(0);
		});

		it('positions textarea wrapper relative to click coordinates', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			const textAreaWrapper = (mode as any)._mapContainer.querySelector(
				'div'
			) as HTMLTextAreaElement;
			expect(textAreaWrapper.style.left).toBe('100px');
			expect(textAreaWrapper.style.top).toBe('200px');
		});

		it('submit button is disabled when textarea is empty', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			const btn = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;
			expect(btn.disabled).toBe(true);
		});

		it('submit button is enabled when textarea has text', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			const btn = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;

			textarea.value = 'Enabled button';
			textarea.dispatchEvent(new Event('input', { bubbles: true }));

			expect(btn.disabled).toBe(false);
		});
	});

	// 3. Committing text
	describe('text commit', () => {
		it('does not commit text on Shift+Enter', () => {
			const onTextCommit = vi.fn();
			const mode = mountMode({ onTextCommit });
			mode.onClick(mockEvent());

			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea.value = 'Hello';
			textarea.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true })
			);

			expect((mode as any).store.updateProperty).not.toHaveBeenCalled();
			expect(onTextCommit).not.toHaveBeenCalled();
		});

		it('calls onFinish after committing text', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			const submitButton = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea.value = 'Label';
			textarea.dispatchEvent(new Event('input', { bubbles: true }));

			submitButton?.click();

			expect((mode as any).onFinish).toHaveBeenCalledWith('feature-1', {
				mode: 'text',
				action: 'draw'
			});
		});

		it('does not commit whitespace-only text', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			const submitButton = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea.value = '   ';

			submitButton?.click();

			expect((mode as any).store.delete).not.toHaveBeenCalled();
			expect((mode as any).store.delete).not.toHaveBeenCalledWith(['feature-1']);
		});

		it('closes and discards text when clicking outside open textarea', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea.value = 'Outside click commit';

			// second click = outside click
			mode.onClick(mockEvent({ lng: 99, lat: 99 }));

			expect((mode as any).store.updateProperty).not.toHaveBeenCalled();
			expect((mode as any).store.delete).toHaveBeenCalledWith(['feature-1']);
		});

		it('does not create a new feature when clicking outside open textarea', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());
			const createCallCount = ((mode as any).store.create as ReturnType<typeof vi.fn>).mock.calls
				.length;

			mode.onClick(mockEvent({ lng: 99, lat: 99 }));

			expect((mode as any).store.create).toHaveBeenCalledTimes(createCallCount);
		});

		it('removes textarea wrapper from DOM after commit via button click', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			const submitButton = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;

			textarea.value = 'Circle 1';
			textarea.dispatchEvent(new Event('input', { bubbles: true }));

			submitButton.click();

			expect((mode as any)._mapContainer.querySelector('textarea')).toBeNull();
			expect((mode as any)._mapContainer.querySelector('div')).toBeNull();
			expect((mode as any).activeWrapper).toBeNull();
			expect((mode as any).activeTextarea).toBeNull();
		});
	});

	// 4. Escape handling
	describe('escape handling', () => {
		it('Escape dismisses textarea and deletes uncommitted feature', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

			expect((mode as any).store.delete).toHaveBeenCalledWith(['feature-1']);
			expect((mode as any)._mapContainer.querySelector('textarea')).toBeNull();
		});

		it('onKeyUp Escape dismisses textarea and deletes feature', () => {
			const mode = mountMode();
			mode.onClick(mockEvent());

			mode.onKeyUp({ key: 'Escape', heldKeys: [], preventDefault: vi.fn() } as any);

			expect((mode as any).store.delete).toHaveBeenCalled();
		});

		it('Escape during edit does not delete committed feature', () => {
			const mode = mountMode({ editable: true });
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Existing', draggable: true }
				}
			]);
			vi.spyOn(mode as any, 'getNearestPointFeature').mockReturnValue({ id: 'feature-1' });

			// Click on an existing label to open the edit textarea.
			mode.onClick(mockEvent());

			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

			expect((mode as any).store.delete).not.toHaveBeenCalled();
		});
	});

	// 5. Edit mode
	describe('edit (click on existing label)', () => {
		it('creates a new feature when editable is false even if near an existing label', () => {
			const mode = mountMode({ editable: false });
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Existing' }
				}
			]);
			const nearestSpy = vi.spyOn(mode as any, 'getNearestPointFeature');

			mode.onClick(mockEvent());

			// editable is off, so no hit-test is performed and a new feature is created.
			expect(nearestSpy).not.toHaveBeenCalled();
			expect((mode as any).store.create).toHaveBeenCalled();
		});

		it('opens textarea pre-filled with existing text when clicking near an existing label', () => {
			const mode = mountMode({ editable: true });
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Existing label', draggable: true }
				}
			]);
			vi.spyOn(mode as any, 'getNearestPointFeature').mockReturnValue({ id: 'feature-1' });

			mode.onClick(mockEvent());

			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			expect(textarea).not.toBeNull();
			expect(textarea?.value).toBe('Existing label');
			expect((mode as any).store.create).not.toHaveBeenCalled();
		});

		it('creates a new feature when clicking away from existing labels', () => {
			const mode = mountMode({ editable: true });
			vi.spyOn(mode as any, 'getNearestPointFeature').mockReturnValue(null);

			mode.onClick(mockEvent());

			expect((mode as any).store.create).toHaveBeenCalled();
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			expect(textarea).not.toBeNull();
			expect(textarea?.value).toBe('');
		});

		it('updates feature text on edit commit', () => {
			const mode = mountMode({ editable: true });
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Old text', draggable: true }
				}
			]);
			vi.spyOn(mode as any, 'getNearestPointFeature').mockReturnValue({ id: 'feature-1' });

			mode.onClick(mockEvent());

			const submitButton = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			textarea.value = 'New text';
			textarea.dispatchEvent(new Event('input', { bubbles: true }));

			submitButton.click();

			expect((mode as any).store.updateProperty).toHaveBeenCalledWith([
				{
					id: 'feature-1',
					property: 'text',
					value: 'New text'
				}
			]);
			expect((mode as any).store.create).not.toHaveBeenCalled();
		});
	});

	// 7. getNearestPointFeature
	describe('getNearestPointFeature()', () => {
		it('returns nearest committed text feature within pointer distance', () => {
			const mode = mountMode();
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Label' }
				}
			]);
			(mode as any).project = vi.fn().mockReturnValue({ x: 105, y: 205 }); // within 40px

			const result = (mode as any).getNearestPointFeature(105, 205);
			expect(result).toEqual({ id: 'feature-1' });
		});

		it('returns null when no features are within pointer distance', () => {
			const mode = mountMode();
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [0, 0] },
					properties: { mode: 'text', text: 'Label' }
				}
			]);
			(mode as any).project = vi
				.fn()
				.mockReturnValueOnce({ x: 100, y: 200 }) // pointer position
				.mockReturnValueOnce({ x: 500, y: 500 }); // feature position — ~500px away

			const result = (mode as any).getNearestPointFeature(mockEvent());
			expect(result).toBeNull();
		});

		it('ignores uncommitted features (no text property)', () => {
			const mode = mountMode();
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: '' }
				}
			]);

			const result = (mode as any).getNearestPointFeature(mockEvent());
			expect(result).toBeNull();
		});

		it('ignores features from other modes', () => {
			const mode = mountMode();
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'point', text: 'Label' }
				}
			]);

			const result = (mode as any).getNearestPointFeature(mockEvent());
			expect(result).toBeNull();
		});

		it('ignores non-Point geometry', () => {
			const mode = mountMode();
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Polygon', coordinates: [[[10, 20]]] },
					properties: { mode: 'text', text: 'Label' }
				}
			]);

			const result = (mode as any).getNearestPointFeature(mockEvent());
			expect(result).toBeNull();
		});

		it('returns the closest feature when multiple are within range', () => {
			const mode = mountMode();
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'far',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Far' }
				},
				{
					id: 'near',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Near' }
				}
			]);

			// first call returns far coords, second returns near coords
			(mode as any).project = vi
				.fn()
				.mockReturnValueOnce({ x: 100, y: 200 }) // pointer
				.mockReturnValueOnce({ x: 130, y: 230 }) // far feature — 42px away
				.mockReturnValueOnce({ x: 100, y: 200 }) // pointer
				.mockReturnValueOnce({ x: 105, y: 205 }); // near feature — 7px away

			const result = (mode as any).getNearestPointFeature(130, 230);
			expect(result?.id).toBe('near');
		});
	});

	// 8. validateFeature
	describe('validateFeature()', () => {
		it('returns valid for a Point with mode=text', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'text' }
			} as any);
			expect(result.valid).toBe(true);
		});

		it('returns invalid for a non-Point geometry', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'LineString', coordinates: [[0, 0]] },
				properties: { mode: 'text' }
			} as any);
			expect(result.valid).toBe(false);
		});

		it('returns invalid for wrong mode', () => {
			const mode = mountMode();
			const result = mode.validateFeature({
				id: '1',
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [0, 0] },
				properties: { mode: 'point' }
			} as any);
			expect(result.valid).toBe(false);
		});
	});

	// 10. Load default style options for the textarea wrapper, textarea and button DOM Elements
	describe('default DOM style options', () => {
		const openEditPopup = (modeOptions = {}) => {
			const mode = mountMode({ editable: true, ...modeOptions });
			(mode as any).store.copyAll = vi.fn().mockReturnValue([
				{
					id: 'feature-1',
					geometry: { type: 'Point', coordinates: [10, 20] },
					properties: { mode: 'text', text: 'Hello', draggable: true }
				}
			]);
			vi.spyOn(mode as any, 'getNearestPointFeature').mockReturnValue({ id: 'feature-1' });
			mode.onClick(mockEvent());
			return mode;
		};

		// i) createDomStyles unit tests — these avoid JSDOM CSS normalisation issues
		it('createDomStyles returns default textarea styles', () => {
			const mode = mountMode();
			expect((mode as any).createDomStyles('textArea')).toEqual(defaultTextAreaStyleOptions);
		});

		it('createDomStyles returns default submit button styles', () => {
			const mode = mountMode();
			expect((mode as any).createDomStyles('submitButton')).toEqual(
				defaultSubmitButtonStyleOptions
			);
		});

		it('createDomStyles returns default textarea wrapper styles', () => {
			const mode = mountMode();
			expect((mode as any).createDomStyles('textAreaWrapper')).toEqual(
				defaultTextAreaWrapperStyleOptions
			);
		});

		it('createDomStyles merges custom textarea styles over defaults', () => {
			const mode = mountMode({ domStyles: { textArea: { fontSize: '16px', color: 'red' } } });
			expect((mode as any).createDomStyles('textArea')).toEqual({
				...defaultTextAreaStyleOptions,
				fontSize: '16px',
				color: 'red'
			});
		});

		it('createDomStyles merges custom submit button styles over defaults', () => {
			const mode = mountMode({ domStyles: { submitButton: { backgroundColor: 'green' } } });
			expect((mode as any).createDomStyles('submitButton')).toEqual({
				...defaultSubmitButtonStyleOptions,
				backgroundColor: 'green'
			});
		});

		// ii) DOM integration tests
		it('applies default styles to the textarea element in the DOM', () => {
			const mode = openEditPopup();
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			expect(textarea).not.toBeNull();
			expect(textarea.style.padding).toBe(defaultTextAreaStyleOptions.padding);
			expect(textarea.style.fontSize).toBe(defaultTextAreaStyleOptions.fontSize);
			expect(textarea.style.fontFamily).toBe(defaultTextAreaStyleOptions.fontFamily);
			expect(textarea.style.width).toBe(defaultTextAreaStyleOptions.width);
			expect(textarea.style.position).toBe(defaultTextAreaStyleOptions.position);
		});

		it('applies default styles to the submit button element in the DOM', () => {
			const mode = openEditPopup();
			const button = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;
			expect(button).not.toBeNull();
			expect(button.style.padding).toBe(defaultSubmitButtonStyleOptions.padding);
			expect(button.style.fontSize).toBe(defaultSubmitButtonStyleOptions.fontSize);
			expect(button.style.fontFamily).toBe(defaultSubmitButtonStyleOptions.fontFamily);
			expect(button.style.minWidth).toBe(defaultSubmitButtonStyleOptions.minWidth);
			expect(button.style.position).toBe(defaultSubmitButtonStyleOptions.position);
		});

		it('applies default styles to the textarea wrapper element in the DOM', () => {
			const mode = openEditPopup();
			const wrapper = (mode as any)._mapContainer.querySelector(
				'#text-area-wrapper'
			) as HTMLDivElement;
			expect(wrapper).not.toBeNull();
			expect(wrapper.style.position).toBe(defaultTextAreaWrapperStyleOptions.position);
			expect(wrapper.style.zIndex).toBe(defaultTextAreaWrapperStyleOptions.zIndex);
			expect(wrapper.style.display).toBe(defaultTextAreaWrapperStyleOptions.display);
			expect(wrapper.style.flexDirection).toBe(defaultTextAreaWrapperStyleOptions.flexDirection);
			expect(wrapper.style.minWidth).toBe(defaultTextAreaWrapperStyleOptions.minWidth);
			expect(wrapper.style.maxWidth).toBe(defaultTextAreaWrapperStyleOptions.maxWidth);
		});

		it('applies custom textarea styles to the DOM element', () => {
			const mode = openEditPopup({ domStyles: { textArea: { fontSize: '18px' } } });
			const textarea = (mode as any)._mapContainer.querySelector('textarea') as HTMLTextAreaElement;
			expect(textarea.style.fontSize).toBe('18px');
			expect(textarea.style.fontFamily).toBe(defaultTextAreaStyleOptions.fontFamily);
		});

		it('applies custom submit button styles to the DOM element', () => {
			const mode = openEditPopup({ domStyles: { submitButton: { width: '60%' } } });
			const button = (mode as any)._mapContainer.querySelector('button') as HTMLButtonElement;
			expect(button.style.width).toBe('60%');
		});
	});
});
