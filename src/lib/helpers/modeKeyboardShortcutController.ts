import { defaultModeKeyboardShortcuts } from '../constants';
import { type TerradrawMode, type ModeKeyboardShortcuts } from '../interfaces';
import type { TerraDraw } from 'terra-draw';

const ACTION_MODES = new Set(['delete', 'delete-selection']);
type ActionMode = typeof ACTION_MODES extends Set<infer T> ? T : never;

export class ModeKeyboardShortcutController {
	private handler: ((e: KeyboardEvent) => void) | undefined;

	constructor(
		private terradraw: TerraDraw,
		private controlContainer?: HTMLElement,
		private shortcuts?: ModeKeyboardShortcuts
	) {
		this.shortcuts = shortcuts
			? { ...defaultModeKeyboardShortcuts, ...shortcuts }
			: defaultModeKeyboardShortcuts;
	}

	mount(): void {
		this.validateShortcuts();

		this.handler = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			if (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.tagName === 'SELECT' ||
				target.isContentEditable
			)
				return;

			const key = e.key.toLowerCase();

			// Mode Actions with keys + held Keys
			this.initialiseModeActionKeyboardShortcuts(e);

			if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

			const mode = Object.entries(this.shortcuts as ModeKeyboardShortcuts).find(
				([, shortcut]) => shortcut.key === key
			)?.[0] as TerradrawMode | undefined;

			if (!mode) return;

			e.preventDefault();
			this.terradraw.setMode(mode);
			this.syncButtonStates(mode);
		};

		window.addEventListener('keydown', this.handler);
	}

	private initialiseModeActionKeyboardShortcuts(e: KeyboardEvent) {
		const actionShortcuts = Object.entries(this.shortcuts as ModeKeyboardShortcuts).filter(
			([mode]) => ACTION_MODES.has(mode)
		);

		for (const [action, shortcut] of actionShortcuts) {
			if (!shortcut) continue;

			const keyMatches =
				shortcut.key === 'Backspace'
					? e.key === 'Backspace'
					: shortcut.key.toLowerCase() === e.key.toLowerCase();

			const heldKeysMatch =
				shortcut.heldKeys.length === 0
					? !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
					: shortcut.heldKeys.every((hk) => {
							switch (hk.toLowerCase()) {
								case 'ctrl':
								case 'control':
									return e.ctrlKey || e.metaKey;
								case 'shift':
									return e.shiftKey;
								case 'alt':
									return e.altKey;
								case 'meta':
									return e.metaKey;
								default:
									return false;
							}
						});

			if (keyMatches && heldKeysMatch) {
				e.preventDefault();
				const features = this.terradraw.getSnapshot();
				if (features.length > 0) {
					this.executeAction(action as ActionMode);
				}
				return;
			}
		}
	}

	private executeAction(action: ActionMode): void {
		switch (action) {
			case 'delete': {
				const snapshot = this.terradraw.getSnapshot();
				const ids = snapshot.map((f) => f.id);
				if (ids.length) {
					this.terradraw.removeFeatures(ids as string[]);
					this.syncButtonStates(this.terradraw.getMode());
				}
				break;
			}

			case 'delete-selection': {
				const snapshot = this.terradraw.getSnapshot();
				const selected = snapshot.filter((f) => f.properties?.selected);
				const ids = selected.map((f) => f.id);
				if (ids.length) {
					this.terradraw.removeFeatures(ids as string[]);
					this.syncButtonStates(this.terradraw.getMode());
				}
				break;
			}
		}
	}

	private validateShortcuts(): void {
		const entries = Object.entries(this.shortcuts as ModeKeyboardShortcuts).filter(
			([, shortcut]) => shortcut != null
		);

		const duplicates = new Map<string, string>();

		for (const [mode, shortcut] of entries) {
			if (!shortcut) continue;

			const canonical = [
				shortcut.key.toLowerCase(),
				...shortcut.heldKeys.map((k) => k.toLowerCase()).sort()
			].join('+');

			if (duplicates.has(canonical)) {
				throw new Error(
					`MaplibreTerradrawControl: duplicate keyboard shortcut "${canonical}" ` +
						`found in both "${duplicates.get(canonical)}" and "${mode}"`
				);
			}

			duplicates.set(canonical, mode);
		}
	}

	destroy(): void {
		if (this.handler) {
			window.removeEventListener('keydown', this.handler);
		}
	}

	private syncButtonStates(mode: string): void {
		if (!this.controlContainer) return;

		const allButtons = this.controlContainer.querySelectorAll(
			'.maplibregl-terradraw-add-control, ' +
				'.maplibregl-terradraw-valhalla-add-control, ' +
				'.maplibregl-terradraw-measure-add-control'
		);

		Array.from(allButtons).forEach((btn) => btn.classList.remove('active'));

		if (mode === 'render') return;

		const activeModeButton = this.controlContainer.querySelector(
			`.maplibregl-terradraw-add-${mode}-button, ` +
				`.maplibregl-terradraw-valhalla-add-${mode}-button, ` +
				`.maplibregl-terradraw-measure-add-${mode}-button`
		);

		if (!activeModeButton) return;

		const hasFeatures = (this.terradraw.getSnapshot().length ?? 0) > 0;
		const deleteSelectionButtons = Array.from(
			document.getElementsByClassName('maplibregl-terradraw-delete-selection-button')
		);

		if (mode === 'select') {
			const isActive = hasFeatures && this.terradraw.enabled;

			deleteSelectionButtons.forEach((btn) => {
				btn.classList.toggle('hidden-delete-selection', !isActive);
			});

			if (!hasFeatures) return;

			activeModeButton.classList.add('active');
		} else {
			deleteSelectionButtons.forEach((btn) => {
				btn.classList.add('hidden-delete-selection');
			});

			activeModeButton.classList.add('active');
		}
	}
}
