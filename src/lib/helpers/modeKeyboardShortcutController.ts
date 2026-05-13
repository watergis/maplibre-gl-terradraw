import { defaultModeKeyboardShortcuts, defaultValhallaModeKeyboardShortcuts } from '../constants';
import {
	type TerradrawMode,
	type ModeKeyboardShortcuts,
	type KeyboardShortcut,
	type TerradrawValhallaMode
} from '../interfaces';
import type { TerraDraw } from 'terra-draw';

const ACTION_MODES = new Set([
	'delete',
	'delete-selection',
	'download',
	'redo',
	'settings',
	'undo'
] as const);
type ActionMode = typeof ACTION_MODES extends Set<infer T> ? T : never;

type ModeActionsOptions = {
	onValhallaMode?: (mode: TerradrawValhallaMode) => void;
	onDelete?: () => void;
	onValhallaSettingsSelected?: () => void;
};

const VALHALLA_MODES = new Set(Object.keys(defaultValhallaModeKeyboardShortcuts));

export class ModeKeyboardShortcutController {
	private handler: ((e: KeyboardEvent) => void) | undefined;
	private shortcuts: ModeKeyboardShortcuts;

	constructor(
		private terradraw: TerraDraw,
		private controlContainer?: HTMLElement,
		shortcuts?: ModeKeyboardShortcuts,
		private modeActions?: ModeActionsOptions
	) {
		const allDefaults: ModeKeyboardShortcuts = {
			...defaultModeKeyboardShortcuts,
			...defaultValhallaModeKeyboardShortcuts
		};

		this.shortcuts = shortcuts ? { ...allDefaults, ...shortcuts } : allDefaults;
		this.modeActions = modeActions;
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

			// action modes first — may have held keys
			if (this.initialiseModeActionKeyboardShortcuts(e)) return;

			// mode switching — no held keys allowed
			if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

			const match = Object.entries(this.shortcuts)
				.filter(([mode]) => !ACTION_MODES.has(mode as ActionMode))
				.find(([, shortcut]) => shortcut && this.matchesShortcut(e, shortcut));

			if (!match) return;

			e.preventDefault();
			const [mode] = match;

			if (VALHALLA_MODES.has(mode)) {
				this.modeActions?.onValhallaMode?.(mode as TerradrawValhallaMode);
			} else {
				if (this.terradraw.enabled) {
					this.terradraw.setMode(mode as TerradrawMode);
				}
				this.syncButtonStates(mode);
			}
		};

		window.addEventListener('keydown', this.handler);
	}

	/**
	 * Returns true if an action was matched so mount() can early return
	 */
	private initialiseModeActionKeyboardShortcuts(e: KeyboardEvent): boolean {
		const actionShortcuts = Object.entries(this.shortcuts).filter(([mode]) =>
			ACTION_MODES.has(mode as ActionMode)
		);

		for (const [action, shortcut] of actionShortcuts) {
			if (!shortcut) continue;

			if (this.matchesShortcut(e, shortcut)) {
				if (!e.defaultPrevented) {
					e.preventDefault();
					const isUndoRedo = action === 'undo' || action === 'redo';
					const features = this.terradraw.getSnapshot();
					if (isUndoRedo || features.length > 0) {
						this.executeAction(action as ActionMode);
					}
				}
				return true;
			}
		}

		return false;
	}

	/**
	 * Matches a keyboard event against a shortcut config
	 */
	private matchesShortcut(e: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
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

		return keyMatches && heldKeysMatch;
	}

	private executeAction(action: ActionMode): void {
		switch (action) {
			case 'delete': {
				this.modeActions?.onDelete?.();
				break;
			}
			case 'delete-selection': {
				const selected = this.terradraw.getSnapshot().filter((f) => f.properties?.selected);
				const ids = selected.map((f) => f.id);
				if (ids.length) {
					this.terradraw.removeFeatures(ids as string[]);
					this.syncButtonStates(this.terradraw.getMode());
				}
				break;
			}
			case 'download': {
				const fc = {
					type: 'FeatureCollection',
					features: this.terradraw.getSnapshot()
				};
				const dataStr =
					'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fc));
				const a = document.createElement('a');
				a.setAttribute('href', dataStr);
				a.setAttribute('download', 'data.geojson');
				document.body.appendChild(a);
				a.click();
				a.remove();
				break;
			}

			case 'undo': {
				if (this.terradraw.canUndo()) {
					this.terradraw.undo();
				}
				break;
			}
			case 'redo': {
				if (this.terradraw.canRedo()) {
					this.terradraw.redo();
				}
				break;
			}

			case 'settings': {
				this.modeActions?.onValhallaSettingsSelected?.();
				break;
			}
		}
	}

	private validateShortcuts(): void {
		const entries = Object.entries(this.shortcuts).filter(([, shortcut]) => shortcut != null);

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

			if (this.terradraw?.enabled) {
				this.terradraw.stop();
			}
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
