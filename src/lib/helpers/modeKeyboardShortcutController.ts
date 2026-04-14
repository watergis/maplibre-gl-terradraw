import type { TerradrawMode, ModeKeyboardShortcuts } from '../interfaces';
import type { TerraDraw } from 'terra-draw';

export class ModeKeyboardShortcutController {
	private handler: ((e: KeyboardEvent) => void) | undefined;

	constructor(
		private terradraw: TerraDraw,
		private shortcuts: ModeKeyboardShortcuts,
		private controlContainer?: HTMLElement
	) {}

	mount(): void {
		// Validate no duplicate keys before binding
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

			if (e.ctrlKey || e.metaKey || e.altKey) return;
			const key = e.key.toLowerCase();

			// Find which mode this key maps to
			const mode = Object.entries(this.shortcuts).find(([, shortcut]) => shortcut === key)?.[0] as
				| TerradrawMode
				| undefined;

			if (!mode) return;

			e.preventDefault();

			this.terradraw.setMode(mode);
			this.syncButtonStates(mode);
		};

		window.addEventListener('keydown', this.handler);
	}

	private validateShortcuts(): void {
		const keys = Object.values(this.shortcuts);
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
