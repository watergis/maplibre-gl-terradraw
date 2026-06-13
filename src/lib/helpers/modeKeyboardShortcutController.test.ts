import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModeKeyboardShortcutController } from './modeKeyboardShortcutController';
/* eslint-disable */

// Helper functions
function createMockTerraDraw() {
	return {
		enabled: true,
		setMode: vi.fn(),
		getMode: vi.fn(),
		stop: vi.fn(),
		getSnapshot: vi.fn(),
		removeFeatures: vi.fn(),
		undo: vi.fn(),
		redo: vi.fn(),
		canUndo: vi.fn(),
		canRedo: vi.fn()
	};
}

function fireKeydown(
	key: string,
	modifiers: Partial<{
		ctrlKey: boolean;
		metaKey: boolean;
		altKey: boolean;
		shiftKey: boolean;
	}> = {},
	target: Partial<HTMLElement> = {}
) {
	const event = new KeyboardEvent('keydown', {
		key,
		bubbles: true,
		cancelable: true,
		...modifiers
	});

	Object.defineProperty(event, 'target', {
		value: { tagName: 'BODY', isContentEditable: false, ...target },
		writable: false
	});

	window.dispatchEvent(event);
	return event;
}

describe('ModeKeyboardShortcutController', () => {
	let draw: ReturnType<typeof createMockTerraDraw>;

	beforeEach(() => {
		draw = createMockTerraDraw();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// 1. Construction and validation
	describe('constructor validation', () => {
		it('mounts without error when shortcuts are valid', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] },
				polygon: { key: 'g', heldKeys: [] },
				select: { key: 's', heldKeys: [] }
			});
			expect(() => controller.mount()).not.toThrow();
			controller.destroy();
		});

		it('throws when duplicate keys are assigned to different modes', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] },
				polygon: { key: 'p', heldKeys: [] }
			});
			expect(() => controller.mount()).toThrow(
				'MaplibreTerradrawControl: duplicate keyboard shortcut "p" found in both "point" and "polygon"'
			);
		});

		it('throws listing all duplicate keys when multiple duplicates exist', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] },
				polygon: { key: 'p', heldKeys: [] },
				select: { key: 's', heldKeys: [] },
				sensor: { key: 's', heldKeys: [] }
			});
			expect(() => controller.mount()).toThrow(
				'MaplibreTerradrawControl: duplicate keyboard shortcut "p" found in both "point" and "polygon"'
			);
		});

		it('mounts with no shortcuts passed and loads defaults without error', () => {
			const controller = new ModeKeyboardShortcutController(draw as any);
			expect(() => controller.mount()).not.toThrow();
			controller.destroy();
		});

		it('mounts with custom shortcuts merged over defaults without error', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'q', heldKeys: [] }
			});
			expect(() => controller.mount()).not.toThrow();
			controller.destroy();
		});
	});

	// 2. Mode activation
	describe('mode activation', () => {
		let controller: ModeKeyboardShortcutController;

		beforeEach(() => {
			controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] },
				polygon: { key: 'g', heldKeys: [] },
				linestring: { key: 'l', heldKeys: [] },
				rectangle: { key: 'r', heldKeys: [] },
				circle: { key: 'c', heldKeys: [] },
				select: { key: 's', heldKeys: [] }
			});
			controller.mount();
		});

		afterEach(() => {
			controller.destroy();
		});

		it('activates point mode when p is pressed', () => {
			fireKeydown('p');
			expect(draw.setMode).toHaveBeenCalledWith('point');
		});

		it('activates polygon mode when g is pressed', () => {
			fireKeydown('g');
			expect(draw.setMode).toHaveBeenCalledWith('polygon');
		});

		it('activates linestring mode when l is pressed', () => {
			fireKeydown('l');
			expect(draw.setMode).toHaveBeenCalledWith('linestring');
		});

		it('activates rectangle mode when r is pressed', () => {
			fireKeydown('r');
			expect(draw.setMode).toHaveBeenCalledWith('rectangle');
		});

		it('activates circle mode when c is pressed', () => {
			fireKeydown('c');
			expect(draw.setMode).toHaveBeenCalledWith('circle');
		});

		it('activates select mode when s is pressed', () => {
			fireKeydown('s');
			expect(draw.setMode).toHaveBeenCalledWith('select');
		});

		it('is case insensitive — uppercase P activates point mode', () => {
			fireKeydown('P');
			expect(draw.setMode).toHaveBeenCalledWith('point');
		});

		it('does nothing when an unregistered key is pressed', () => {
			fireKeydown('x');
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does nothing when a number key is pressed', () => {
			fireKeydown('1');
			expect(draw.setMode).not.toHaveBeenCalled();
			expect(draw.stop).not.toHaveBeenCalled();
		});
	});

	// 3. Escape key
	describe('escape key', () => {
		let controller: ModeKeyboardShortcutController;

		beforeEach(() => {
			controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
		});

		afterEach(() => {
			controller.destroy();
		});

		it('does nothing when the Escape is pressed', () => {
			fireKeydown('Escape');
			expect(draw.stop).not.toHaveBeenCalled();
		});

		it('does not call setMode when Escape is pressed', () => {
			fireKeydown('Escape');
			expect(draw.setMode).not.toHaveBeenCalled();
		});
	});

	// 4. Modifier key guards
	describe('modifier key guards', () => {
		let controller: ModeKeyboardShortcutController;

		beforeEach(() => {
			controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
		});

		afterEach(() => {
			controller.destroy();
		});

		it('does not activate mode when ctrl is held', () => {
			fireKeydown('p', { ctrlKey: true });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does not activate mode when meta is held', () => {
			fireKeydown('p', { metaKey: true });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does not activate mode when alt is held', () => {
			fireKeydown('p', { altKey: true });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does not stop terradraw when ctrl+Escape is pressed', () => {
			fireKeydown('Escape', { ctrlKey: true });
			expect(draw.stop).not.toHaveBeenCalled();
		});
	});

	// 5. Input field guards
	describe('input field guards', () => {
		let controller: ModeKeyboardShortcutController;

		beforeEach(() => {
			controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
		});

		afterEach(() => {
			controller.destroy();
		});

		it('does not activate mode when key is pressed inside an input', () => {
			fireKeydown('p', {}, { tagName: 'INPUT', isContentEditable: false });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does not activate mode when key is pressed inside a textarea', () => {
			fireKeydown('p', {}, { tagName: 'TEXTAREA', isContentEditable: false });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does not activate mode when key is pressed inside a select', () => {
			fireKeydown('p', {}, { tagName: 'SELECT', isContentEditable: false });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does not activate mode when key is pressed inside a content editable', () => {
			fireKeydown('p', {}, { tagName: 'DIV', isContentEditable: true });
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('does activate mode when key is pressed on the map container', () => {
			fireKeydown('p', {}, { tagName: 'CANVAS', isContentEditable: false });
			expect(draw.setMode).toHaveBeenCalledWith('point');
		});

		it('does activate mode when key is pressed on the body', () => {
			fireKeydown('p', {}, { tagName: 'BODY', isContentEditable: false });
			expect(draw.setMode).toHaveBeenCalledWith('point');
		});
	});

	// 6. Lifecycle
	describe('lifecycle', () => {
		it('does not respond to key events before mount() is called', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			fireKeydown('p');
			expect(draw.setMode).not.toHaveBeenCalled();
			controller.destroy();
		});

		it('does not respond to key events after destroy() is called', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
			controller.destroy();
			fireKeydown('p');
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('can be mounted and destroyed multiple times without error', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			expect(() => {
				controller.mount();
				controller.destroy();
				controller.mount();
				controller.destroy();
			}).not.toThrow();
		});

		it('removes the event listener on destroy', () => {
			const removeListener = vi.spyOn(window, 'removeEventListener');
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
			controller.destroy();
			expect(removeListener).toHaveBeenCalledWith('keydown', expect.any(Function));
		});

		it('does not throw when destroy is called without mount', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			expect(() => controller.destroy()).not.toThrow();
		});
	});

	// 7. Mode Action Activation (delete and delete-selection)
	describe('mode action shortcuts', () => {
		it('does not delete when Backspace is pressed with no selected features', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([]);
			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
			expect(draw.removeFeatures).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('calls onDeleteSelected when Shift+Backspace is pressed with features', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([
				{ id: '1', properties: {} },
				{ id: '2', properties: { selected: true } }
			]);
			const onDeleteSelected = vi.fn();

			const controller = new ModeKeyboardShortcutController(draw as any, undefined, undefined, {
				onDeleteSelected
			});
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', shiftKey: true }));
			expect(onDeleteSelected).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call onDeleteSelected when Shift+Backspace is pressed with no features', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([]);
			const onDeleteSelected = vi.fn();

			const controller = new ModeKeyboardShortcutController(draw as any, undefined, undefined, {
				onDeleteSelected
			});
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', shiftKey: true }));
			expect(onDeleteSelected).not.toHaveBeenCalled();

			controller.destroy();
		});

		// combos that should do nothing
		it('does nothing on Ctrl+Backspace', () => {
			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true }));
			expect(draw.removeFeatures).not.toHaveBeenCalled();
			expect(draw.setMode).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('does nothing on Alt+Backspace', () => {
			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', altKey: true }));
			expect(draw.removeFeatures).not.toHaveBeenCalled();
			expect(draw.setMode).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('does nothing on Ctrl+D (reserved browser shortcut)', () => {
			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));
			expect(draw.removeFeatures).not.toHaveBeenCalled();
			expect(draw.setMode).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('does nothing on Cmd+D (reserved browser shortcut)', () => {
			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true }));
			expect(draw.removeFeatures).not.toHaveBeenCalled();
			expect(draw.setMode).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('does nothing when Backspace is pressed inside a textarea', () => {
			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			const textarea = document.createElement('textarea');
			document.body.appendChild(textarea);
			textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
			expect(draw.removeFeatures).not.toHaveBeenCalled();

			textarea.remove();
			controller.destroy();
		});
	});

	// 8. Delete action (onDelete callback)
	describe('delete action', () => {
		it('calls onDelete when Backspace is pressed and features exist', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([{ id: '1', properties: {} }]);
			const onDelete = vi.fn();
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, undefined, {
				onDelete
			});
			controller.mount();

			fireKeydown('Backspace');
			expect(onDelete).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call onDelete when Backspace is pressed with no features', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([]);
			const onDelete = vi.fn();
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, undefined, {
				onDelete
			});
			controller.mount();

			fireKeydown('Backspace');
			expect(onDelete).not.toHaveBeenCalled();

			controller.destroy();
		});
	});

	// 9. Download action
	describe('download action', () => {
		it('calls onDownload when D is pressed with features', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([
				{
					id: '1',
					type: 'Feature',
					properties: {},
					geometry: { type: 'Point', coordinates: [0, 0] }
				}
			]);
			const onDownload = vi.fn();

			const controller = new ModeKeyboardShortcutController(draw as any, undefined, undefined, {
				onDownload
			});
			controller.mount();

			fireKeydown('d');
			expect(onDownload).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call onDownload when D is pressed with no features', () => {
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([]);
			const onDownload = vi.fn();

			const controller = new ModeKeyboardShortcutController(draw as any, undefined, undefined, {
				onDownload
			});
			controller.mount();

			fireKeydown('d');
			expect(onDownload).not.toHaveBeenCalled();

			controller.destroy();
		});
	});

	// 10. Undo action
	describe('undo action', () => {
		it('calls terradraw.undo() when Cmd+Z is pressed and canUndo returns true', () => {
			(draw.canUndo as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			fireKeydown('z', { metaKey: true });
			expect(draw.undo).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call terradraw.undo() when Cmd+Z is pressed but canUndo returns false', () => {
			(draw.canUndo as ReturnType<typeof vi.fn>).mockReturnValue(false);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			fireKeydown('z', { metaKey: true });
			expect(draw.undo).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('calls undo even when the canvas has no features', () => {
			(draw.canUndo as ReturnType<typeof vi.fn>).mockReturnValue(true);
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([]);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			fireKeydown('z', { metaKey: true });
			expect(draw.undo).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call undo when the event was already defaultPrevented', () => {
			(draw.canUndo as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			const event = new KeyboardEvent('keydown', {
				key: 'z',
				metaKey: true,
				cancelable: true,
				bubbles: true
			});
			Object.defineProperty(event, 'target', {
				value: { tagName: 'BODY', isContentEditable: false },
				writable: false
			});
			event.preventDefault();
			window.dispatchEvent(event);

			expect(draw.undo).not.toHaveBeenCalled();

			controller.destroy();
		});
	});

	// 11. Redo action
	describe('redo action', () => {
		it('calls terradraw.redo() when Cmd+Shift+Z is pressed and canRedo returns true', () => {
			(draw.canRedo as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			fireKeydown('z', { metaKey: true, shiftKey: true });
			expect(draw.redo).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call terradraw.redo() when Cmd+Shift+Z is pressed but canRedo returns false', () => {
			(draw.canRedo as ReturnType<typeof vi.fn>).mockReturnValue(false);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			fireKeydown('z', { metaKey: true, shiftKey: true });
			expect(draw.redo).not.toHaveBeenCalled();

			controller.destroy();
		});

		it('calls redo even when the canvas has no features', () => {
			(draw.canRedo as ReturnType<typeof vi.fn>).mockReturnValue(true);
			(draw.getSnapshot as ReturnType<typeof vi.fn>).mockReturnValue([]);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			fireKeydown('z', { metaKey: true, shiftKey: true });
			expect(draw.redo).toHaveBeenCalledOnce();

			controller.destroy();
		});

		it('does not call redo when the event was already defaultPrevented', () => {
			(draw.canRedo as ReturnType<typeof vi.fn>).mockReturnValue(true);

			const controller = new ModeKeyboardShortcutController(draw as any);
			controller.mount();

			const event = new KeyboardEvent('keydown', {
				key: 'z',
				metaKey: true,
				shiftKey: true,
				cancelable: true,
				bubbles: true
			});
			Object.defineProperty(event, 'target', {
				value: { tagName: 'BODY', isContentEditable: false },
				writable: false
			});
			event.preventDefault();
			window.dispatchEvent(event);

			expect(draw.redo).not.toHaveBeenCalled();

			controller.destroy();
		});
	});

	// Edge Cases
	describe('edge cases', () => {
		it('only calls setMode once per keydown — no double firing', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
			fireKeydown('p');
			expect(draw.setMode).toHaveBeenCalledOnce();
			controller.destroy();
		});

		it('handles a single mode shortcut correctly', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
			fireKeydown('p');
			expect(draw.setMode).toHaveBeenCalledWith('point');
			controller.destroy();
		});

		it('activates different modes on consecutive keypresses', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] },
				polygon: { key: 'g', heldKeys: [] }
			});
			controller.mount();
			fireKeydown('p');
			fireKeydown('g');
			expect(draw.setMode).toHaveBeenNthCalledWith(1, 'point');
			expect(draw.setMode).toHaveBeenNthCalledWith(2, 'polygon');
			controller.destroy();
		});

		it('does not prevent default for unrecognised keys', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
			const event = new KeyboardEvent('keydown', { key: 'x', cancelable: true });
			Object.defineProperty(event, 'target', {
				value: { tagName: 'BODY', isContentEditable: false }
			});
			const preventDefault = vi.spyOn(event, 'preventDefault');
			window.dispatchEvent(event);
			expect(preventDefault).not.toHaveBeenCalled();
			controller.destroy();
		});

		it('prevents default for recognised mode keys', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, undefined, {
				point: { key: 'p', heldKeys: [] }
			});
			controller.mount();
			const event = new KeyboardEvent('keydown', { key: 'p', cancelable: true });
			Object.defineProperty(event, 'target', {
				value: { tagName: 'BODY', isContentEditable: false }
			});
			const preventDefault = vi.spyOn(event, 'preventDefault');
			window.dispatchEvent(event);
			expect(preventDefault).toHaveBeenCalledTimes(1);
			controller.destroy();
		});
	});
});
