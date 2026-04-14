import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModeKeyboardShortcutController } from './modeKeyboardShortcutController';
/* eslint-disable */

// Helper functions
function createMockTerraDraw() {
	return {
		setMode: vi.fn(),
		stop: vi.fn()
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
			const controller = new ModeKeyboardShortcutController(draw as any, {
				point: 'p',
				polygon: 'g',
				select: 's'
			});
			expect(() => controller.mount()).not.toThrow();
			controller.destroy();
		});

		it('throws when duplicate keys are assigned to different modes', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, {
				point: 'p',
				polygon: 'p'
			});
			expect(() => controller.mount()).toThrow('duplicate keyboard shortcut(s) "p"');
		});

		it('throws listing all duplicate keys when multiple duplicates exist', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, {
				point: 'p',
				polygon: 'p',
				select: 's',
				sensor: 's'
			});
			expect(() => controller.mount()).toThrow('duplicate keyboard shortcut(s)');
		});

		it('mounts with an empty shortcuts config without error', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, {});
			expect(() => controller.mount()).not.toThrow();
			controller.destroy();
		});
	});

	// 2. Mode activation
	describe('mode activation', () => {
		let controller: ModeKeyboardShortcutController;

		beforeEach(() => {
			controller = new ModeKeyboardShortcutController(draw as any, {
				point: 'p',
				polygon: 'g',
				linestring: 'l',
				rectangle: 'r',
				circle: 'c',
				select: 's'
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
			controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
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
			controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
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
			controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
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
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			fireKeydown('p');
			expect(draw.setMode).not.toHaveBeenCalled();
			controller.destroy();
		});

		it('does not respond to key events after destroy() is called', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			controller.mount();
			controller.destroy();
			fireKeydown('p');
			expect(draw.setMode).not.toHaveBeenCalled();
		});

		it('can be mounted and destroyed multiple times without error', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			expect(() => {
				controller.mount();
				controller.destroy();
				controller.mount();
				controller.destroy();
			}).not.toThrow();
		});

		it('removes the event listener on destroy', () => {
			const removeListener = vi.spyOn(window, 'removeEventListener');
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			controller.mount();
			controller.destroy();
			expect(removeListener).toHaveBeenCalledWith('keydown', expect.any(Function));
		});

		it('does not throw when destroy is called without mount', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			expect(() => controller.destroy()).not.toThrow();
		});
	});

	// ── Edge cases ───────────────────────────────────────────────────────────

	describe('edge cases', () => {
		it('only calls setMode once per keydown — no double firing', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			controller.mount();
			fireKeydown('p');
			expect(draw.setMode).toHaveBeenCalledOnce();
			controller.destroy();
		});

		it('handles a single mode shortcut correctly', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			controller.mount();
			fireKeydown('p');
			expect(draw.setMode).toHaveBeenCalledWith('point');
			controller.destroy();
		});

		it('activates different modes on consecutive keypresses', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, {
				point: 'p',
				polygon: 'g'
			});
			controller.mount();
			fireKeydown('p');
			fireKeydown('g');
			expect(draw.setMode).toHaveBeenNthCalledWith(1, 'point');
			expect(draw.setMode).toHaveBeenNthCalledWith(2, 'polygon');
			controller.destroy();
		});

		it('does not prevent default for unrecognised keys', () => {
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
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
			const controller = new ModeKeyboardShortcutController(draw as any, { point: 'p' });
			controller.mount();
			const event = new KeyboardEvent('keydown', { key: 'p', cancelable: true });
			Object.defineProperty(event, 'target', {
				value: { tagName: 'BODY', isContentEditable: false }
			});
			const preventDefault = vi.spyOn(event, 'preventDefault');
			window.dispatchEvent(event);
			expect(preventDefault).toHaveBeenCalledOnce();
			controller.destroy();
		});
	});
});
