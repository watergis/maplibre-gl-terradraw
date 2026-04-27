import { MODE_ACTION_SHORTCUTS } from '../constants';
import {
	type TerradrawMode,
	type ModeKeyboardShortcuts,
	defaultModeKeyboardShortcuts
} from '../interfaces';
import type { TerraDraw } from 'terra-draw';

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
			this.initialiseModeActionKeyboardShortcuts(e, key);

			if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

			const mode = Object.entries(this.shortcuts as ModeKeyboardShortcuts).find(
				([, shortcut]) => shortcut === key
			)?.[0] as TerradrawMode | undefined;

			if (!mode) return;

			e.preventDefault();
			this.terradraw.setMode(mode);
			this.syncButtonStates(mode);
		};

		window.addEventListener('keydown', this.handler);
	}

	private initialiseModeActionKeyboardShortcuts(e: KeyboardEvent, key: string) {
		for (const [action, shortcut] of Object.entries(MODE_ACTION_SHORTCUTS)) {
			const keyMatches =
				shortcut.key === 'Backspace'
					? e.key === 'Backspace'
					: (shortcut.key as string).toLowerCase() === key;

			const heldKeysMatch =
				shortcut.heldKeys.length === 0
					? !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
					: shortcut.heldKeys.every((hk) => {
							switch (hk) {
								case 'shift':
									return e.shiftKey;
								default:
									return false;
							}
						});

			if (keyMatches && heldKeysMatch) {
				e.preventDefault();
				const features = this.terradraw.getSnapshot();
				if (features.length > 0) {
					this.executeAction(action as keyof typeof MODE_ACTION_SHORTCUTS);
				}
				return;
			}
		}
	}

	private executeAction(action: keyof typeof MODE_ACTION_SHORTCUTS): void {
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
			case 'delete-selected': {
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
		const keys = Object.values(this.shortcuts as ModeKeyboardShortcuts);
		const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);

		if (duplicates.length) {
			throw new Error(
				`MaplibreTerradrawControl: duplicate keyboard shortcut(s) ` +
					`"${duplicates.join(', ')}" in modeKeyboardShortcuts`
			);
		}
	}

	destroy(): void {
		if (this.handler) {
			window.removeEventListener('keydown', this.handler);
		}
	}

	private syncButtonStates(mode: string): void {
		if (!this.controlContainer) return;

		const allButtons = this.controlContainer.getElementsByClassName(
			'maplibregl-terradraw-add-control'
		);
		Array.from(allButtons).forEach((btn) => btn.classList.remove('active'));

		if (mode === 'render') return;

		const activeModeButton = this.controlContainer.getElementsByClassName(
			`maplibregl-terradraw-add-${mode}-button`
		)[0];

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
