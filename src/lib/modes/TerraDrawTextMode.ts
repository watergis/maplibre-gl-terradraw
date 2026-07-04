import {
	defaultSubmitButtonStyleOptions,
	defaultTextAreaStyleOptions,
	defaultTextAreaTooltipSpanStyleOptions,
	defaultTextAreaWrapperStyleOptions
} from '../constants';
import {
	type TerraDrawMouseEvent,
	type TerraDrawKeyboardEvent,
	type TerraDrawAdapterStyling,
	type HexColor,
	TerraDrawExtend,
	type GeoJSONStoreFeatures
} from 'terra-draw';

const { TerraDrawBaseDrawMode } = TerraDrawExtend;

/**
 * MapLibre GL paint and layout properties that control how committed text labels
 * appear in the `{prefix}-text-labels` symbol layer.
 *
 * All properties are optional; omitting them falls back to the defaults set in
 * `MaplibreTerradrawControl.createTerradrawTextLayer`.
 *
 * @example
 * ```ts
 * const styles: TextModeStyling = {
 *   textColor: '#1a1a1a',
 *   textSize: 14,
 *   textSelectedSize: 16,
 *   textHaloColor: '#ffffff',
 *   textSelectedHaloColor: '#3f97e0',
 *   textHaloWidth: 2,
 * };
 * ```
 */
export type TextModeStyling = {
	/** Anchor point fill color. Rendered at `pointWidth: 0` by default so the dot is invisible. */
	pointColor?: HexColor;
	/** Anchor point radius in pixels. Default `0` (invisible). */
	pointWidth?: number;
	/** Anchor point outline / stroke color. */
	pointOutlineColor?: HexColor;
	/** Anchor point outline width in pixels. */
	pointOutlineWidth?: number;
	/** MapLibre `text-color` paint property. Default `#000000`. */
	textColor?: HexColor;
	/** MapLibre `text-size` layout property in pixels. Default `12`. */
	textSize?: number;
	/** MapLibre selected `text-size` in pixels. Default `14`. */
	textSelectedSize?: number;
	/** MapLibre `text-halo-color` paint property. Default `#3f97e0`. */
	textHaloColor?: HexColor;
	/** MapLibre selected `text-halo-color` paint property. Default `#ffffff`. */
	textSelectedHaloColor?: HexColor;
	/** MapLibre `text-halo-width` paint property in pixels. Default `5`. */
	textHaloWidth?: number;
	/**
	 * MapLibre `text-font` layout property (font stack). Default `['sans-serif']`.
	 *
	 * The default `sans-serif` is used so labels are not constrained by the
	 * glyphs available in the map style. Set this to a font that exists in your
	 * style's glyphs (e.g. `['Noto Sans Regular']`) to change the label font.
	 */
	textFont?: string[];
};

/**
 * Optional CSS overrides for the textarea popup DOM elements.
 * Each key accepts any valid `CSSStyleDeclaration` property.
 * Provided styles are merged over the built-in defaults.
 */
export type DOMStyles = {
	/** Style overrides for the `<textarea>` element. */
	textArea?: Partial<CSSStyleDeclaration>;
	/** Style overrides for the submit `<button>` element. */
	submitButton?: Partial<CSSStyleDeclaration>;
};

type TextAreaPopup = {
	wrapper: HTMLDivElement;
	textarea: HTMLTextAreaElement;
};

/**
 * Constructor options for {@link TerraDrawTextMode}.
 *
 * @example
 * ```ts
 * new TerraDrawTextMode({
 *   editable: true,
 *   placeholder: 'Add a label…',
 *   styles: { textColor: '#333333', textSize: 14 },
 *   onTextCommit: (id, text) => console.log(id, text),
 * });
 * ```
 */
export type TextModeOptions = {
	/**
	 * MapLibre symbol-layer style overrides applied to committed text features.
	 * Merged over the defaults supplied by `MaplibreTerradrawControl`.
	 */
	styles?: Partial<TextModeStyling>;
	/**
	 * Placeholder text shown in the textarea popup before the user types.
	 * Defaults to `"Enter label..."`.
	 */
	placeholder?: string;
	/**
	 * Called after every successful commit — both new placements and edits.
	 *
	 * @param featureId - The TerraDraw feature ID of the committed Point feature.
	 * @param text - The trimmed text string that was committed.
	 */
	onTextCommit?: (featureId: TerraDrawExtend.FeatureId, text: string) => void;
	/**
	 * @deprecated Not used. Draggability is controlled by the `TerraDrawSelectMode`
	 * `flags.text.feature.draggable` setting.
	 */
	draggable?: boolean;
	/**
	 * When `true`, clicking/tapping near an existing label opens the
	 * textarea pre-filled with the current text so the user can edit it in place.
	 * Defaults to `false`.
	 */
	editable?: boolean;
	/**
	 * Override the default CSS styles applied to the textarea popup DOM elements.
	 * Each property is merged over the corresponding defaults from
	 * `defaultTextAreaStyleOptions` / `defaultSubmitButtonStyleOptions`.
	 */
	domStyles?: DOMStyles;
};

/**
 * A custom Terra Draw mode that lets users place, edit, and drag freeform text
 * labels anywhere on the map.
 *
 * ## Interaction model
 *
 * | Gesture | Behaviour |
 * |---------|-----------|
 * | **Click** on the map | Opens a textarea popup at the clicked location. |
 * | **Enter** (or Submit button) | Commits the label as a `Point` GeoJSON feature with a `text` property. Calls `onTextCommit` and fires the TerraDraw `finish` event. |
 * | **Shift+Enter** | Inserts a newline without committing. |
 * | **Escape** (in popup) | Dismisses the popup and deletes the uncommitted feature. |
 * | **Click outside** open popup | Commits any typed text, or dismisses if empty. |
 * | **Click** near existing label | Opens the textarea pre-filled with existing text (requires `editable: true`). |
 * | **Drag** a committed label | Handled by `TerraDrawSelectMode` when `flags.text.feature.draggable` is `true`. |
 *
 * ## MapLibre GL rendering
 *
 * `TerraDrawTextMode` itself only stores Point features in the TerraDraw store.
 * `MaplibreTerradrawControl` detects the `text` mode and maintains a
 * separate `{prefix}-text-labels` MapLibre symbol layer that reads the `text`
 * property from the GeoJSON source.  This means the labels are rendered by
 * MapLibre GL and support all standard `text-*` paint/layout properties.
 *
 * ## Usage
 *
 * ```ts
 * import { MaplibreTerradrawControl, TerraDrawTextMode } from '@watergis/maplibre-gl-terradraw';
 *
 * const control = new MaplibreTerradrawControl({
 *   modes: ['text', 'select', 'delete'],
 *   modeOptions: {
 *     text: new TerraDrawTextMode({
 *       editable: true,
 *       placeholder: 'Add a label…',
 *       styles: {
 *         textColor: '#1a1a1a',
 *         textSize: 14,
 *         textSelectedSize: 16,
 *         textHaloColor: '#ffffff',
 *         textHaloWidth: 2,
 *         textSelectedHaloColor: '#E0B03F'
 *       },
 *       onTextCommit: (id, text) => console.log(`${id}: ${text}`),
 *     }),
 *   },
 * });
 *
 * map.addControl(control, 'top-right');
 * ```
 */
// `textFont` is a MapLibre symbol-layer concern consumed by `MaplibreTerradrawControl`,
// not by Terra Draw's `styleFeature`. It is a `string[]`, which does not satisfy Terra Draw's
// `CustomStyling` value constraint, so it is omitted from the base-class generic while still
// remaining part of the public `TextModeStyling` / `options.styles` merge path.
export class TerraDrawTextMode extends TerraDrawBaseDrawMode<Omit<TextModeStyling, 'textFont'>> {
	mode = 'text';

	options?: TextModeOptions;

	private editable: boolean = false;

	private activeWrapper: HTMLDivElement | null = null;
	private activeTextarea: HTMLTextAreaElement | null = null;
	private activeFeatureId: TerraDrawExtend.FeatureId | null = null;
	private activeLngLat: [number, number] | null = null;

	private _mapContainer: HTMLElement | null = null;
	private rafId?: number | null = null;
	private repositionRafId?: number | null = null;
	private lastReposition: { x: number; y: number } | null = null;

	constructor(options?: TextModeOptions) {
		super({ styles: options?.styles ?? {} });
		this.options = options;
		this.styles = options?.styles ?? {};
		this.editable = options?.editable ?? false;
		this._mapContainer = this.getMap();
	}

	/** @internal */
	start() {
		this.setStarted();
		this.setCursor('crosshair');
	}

	/** @internal */
	stop() {
		this.cleanUp();
		this.setStopped();
		this.setCursor('unset');
	}

	/** @internal */
	cleanUp(): void {
		this.dismissTextarea(true);

		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}

		this.stopRepositionLoop();
	}

	/**
	 * Get map container
	 * @returns
	 */
	getMap(): HTMLElement | null {
		return (
			window.document.getElementById('map') ??
			window.document.querySelector('.maplibregl-map') ??
			window.document.querySelector('.map')
		);
	}

	/**
	 * Create a Textarea Wrapper for the textarea and button elements on the DOM
	 * @param x
	 * @param y
	 * @returns
	 */
	private createTextAreaWrapper(x: number, y: number): HTMLDivElement {
		const wrapper = document.createElement('div');
		wrapper.id = 'text-area-wrapper';

		const textAreaWrapperStyles = this.createDomStyles('textAreaWrapper');
		Object.assign(wrapper.style, {
			...textAreaWrapperStyles,
			left: `${x}px`,
			top: `${y}px`,
			transform: 'translateY(-100%)'
		});
		return wrapper;
	}

	/**
	 * @param currentText
	 * @returns
	 */
	private createTextAreaElement(currentText?: string): HTMLTextAreaElement {
		const textarea = document.createElement('textarea');
		textarea.placeholder = this.options?.placeholder ?? 'Enter label...';
		textarea.rows = 1;

		if (currentText) {
			textarea.value = currentText;
			textarea.setSelectionRange(currentText.length, currentText.length);
		}

		const textAreaStyles = this.createDomStyles('textArea');
		Object.assign(textarea.style, textAreaStyles);

		return textarea;
	}

	/**
	 * Auto-size the textarea to content height up to 3 lines, then enable vertical scroll.
	 */
	private resizeTextarea(textarea: HTMLTextAreaElement): void {
		const computedStyles = window.getComputedStyle(textarea);
		const fontSize = Number.parseFloat(computedStyles.fontSize) || 12;
		const lineHeight = Number.parseFloat(computedStyles.lineHeight) || fontSize * 1.2;
		const paddingTop = Number.parseFloat(computedStyles.paddingTop) || 0;
		const paddingBottom = Number.parseFloat(computedStyles.paddingBottom) || 0;
		const borderTop = Number.parseFloat(computedStyles.borderTopWidth) || 0;
		const borderBottom = Number.parseFloat(computedStyles.borderBottomWidth) || 0;
		const verticalExtras = paddingTop + paddingBottom + borderTop + borderBottom;
		const minHeight = lineHeight + verticalExtras;
		const maxHeight = lineHeight * 3 + verticalExtras;

		textarea.style.height = 'auto';
		const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
		textarea.style.height = `${nextHeight}px`;
		textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
	}

	/**
	 * @returns
	 */
	private createTextAreaTooltip(): HTMLSpanElement {
		const span = document.createElement('span');
		const tooltipText = ['Shift + Enter to make new line.'];
		span.innerHTML = tooltipText.join('<br>');
		Object.assign(span.style, this.createDomStyles('span'));
		return span;
	}

	/**
	 * @param isEdit boolean
	 * @returns
	 */
	private createSubmitButton(): HTMLButtonElement {
		const button = document.createElement('button');
		button.type = 'button';

		button.className = 'maplibregl-terradraw-text-mode-submit-button';

		const btnStyles = this.createDomStyles('submitButton');
		Object.assign(button.style, btnStyles);

		button.addEventListener('mouseenter', () => {
			button.style.backgroundColor = '#2d7fc1';
		});
		button.addEventListener('mouseleave', () => {
			button.style.backgroundColor = btnStyles?.backgroundColor as string;
		});

		return button;
	}

	/**
	 * Create styles for textarea and submit button elements
	 * @returns
	 */
	private createDomStyles(
		style: 'textArea' | 'submitButton' | 'textAreaWrapper' | 'span'
	): Partial<CSSStyleDeclaration> | undefined {
		switch (style) {
			case 'textArea':
				return this.options?.domStyles?.textArea
					? { ...defaultTextAreaStyleOptions, ...this.options?.domStyles?.textArea }
					: { ...defaultTextAreaStyleOptions };

			case 'submitButton':
				return this.options?.domStyles?.submitButton
					? { ...defaultSubmitButtonStyleOptions, ...this.options?.domStyles?.submitButton }
					: { ...defaultSubmitButtonStyleOptions };

			case 'textAreaWrapper':
				return { ...defaultTextAreaWrapperStyleOptions };

			case 'span':
				return { ...defaultTextAreaTooltipSpanStyleOptions };

			default:
				break;
		}
	}

	/**
	 * @param x
	 * @param y
	 * @param onCommit
	 * @param onDismiss
	 * @param currentText
	 * @returns
	 */
	private mountTextAreaPopup(
		x: number,
		y: number,
		onCommit: (text: string) => void,
		onDismiss: () => void,
		currentText?: string
	): TextAreaPopup | undefined {
		const wrapper = this.createTextAreaWrapper(x, y);
		const inputRow = document.createElement('div');
		Object.assign(inputRow.style, {
			display: 'flex',
			alignItems: 'flex-start'
		});

		const textarea = this.createTextAreaElement(currentText);
		const tooltip = this.createTextAreaTooltip();
		const submitButton = this.createSubmitButton();

		submitButton.disabled = !currentText;
		submitButton.style.opacity = '1';
		submitButton.style.cursor = currentText ? 'pointer' : 'not-allowed';

		textarea.addEventListener('input', () => {
			this.resizeTextarea(textarea);
			const hasText = textarea.value.trim().length > 0;
			submitButton.disabled = !hasText;
			submitButton.style.opacity = '1';
			submitButton.style.cursor = hasText ? 'pointer' : 'not-allowed';
		});

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') onDismiss();
		});

		submitButton.addEventListener('click', () => {
			const text = textarea.value.trim();
			if (text) onCommit(text);
			else onDismiss();
		});

		inputRow.appendChild(textarea);
		inputRow.appendChild(submitButton);
		wrapper.appendChild(inputRow);
		wrapper.appendChild(tooltip);
		this._mapContainer?.appendChild(wrapper);
		this.resizeTextarea(textarea);
		textarea.focus();

		return { wrapper, textarea };
	}

	/**
	 * @param featureId
	 * @param x
	 * @param y
	 */
	private showTextarea(featureId: TerraDrawExtend.FeatureId, x: number, y: number): void {
		this.dismissTextarea(false);

		const { wrapper, textarea } = this.mountTextAreaPopup(
			x,
			y,
			(text) => this.commitText(featureId, text),
			() => this.dismissTextarea(true)
		) as TextAreaPopup;

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.commitText(featureId, textarea.value.trim());
			}
		});

		this.activeWrapper = wrapper;
		this.activeTextarea = textarea;
		this.activeFeatureId = featureId;
		this.activeLngLat = this.getFeatureLngLat(featureId);
		this.startRepositionLoop();
	}

	/**
	 * @param featureId
	 * @param x
	 * @param y
	 */
	private editText(featureId: TerraDrawExtend.FeatureId, x: number, y: number): void {
		this.dismissTextarea(false);

		const feature = this.store.copyAll().find((f) => f.id === featureId);
		const currentText = (feature?.properties?.text as string) ?? '';

		const { wrapper, textarea } = this.mountTextAreaPopup(
			x,
			y,
			(text) => this.commitText(featureId, text),
			() => this.dismissTextarea(false),
			currentText
		) as TextAreaPopup;

		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.commitText(featureId, textarea.value.trim());
			}
		});

		this.activeWrapper = wrapper;
		this.activeTextarea = textarea;
		this.activeFeatureId = featureId;
		this.activeLngLat =
			(feature?.geometry.type === 'Point'
				? (feature.geometry.coordinates as [number, number])
				: null) ?? this.getFeatureLngLat(featureId);
		this.startRepositionLoop();
	}

	/**
	 * Read the [lng, lat] anchor coordinates of a Point feature from the store.
	 * @param featureId
	 * @returns the coordinates, or null when the feature is missing / not a Point.
	 */
	private getFeatureLngLat(featureId: TerraDrawExtend.FeatureId): [number, number] | null {
		const feature = this.store.copyAll().find((f) => f.id === featureId);
		if (feature?.geometry.type !== 'Point') return null;
		return feature.geometry.coordinates as [number, number];
	}

	/**
	 * Start a requestAnimationFrame loop that keeps the open textarea popup anchored to
	 * its geographic point while the map pans / zooms / rotates. The popup position is
	 * only written when the projected pixel actually changes to avoid needless layout.
	 */
	private startRepositionLoop(): void {
		this.stopRepositionLoop();
		this.lastReposition = null;

		const tick = () => {
			if (!this.activeWrapper || !this.activeLngLat) {
				this.repositionRafId = null;
				return;
			}

			try {
				const { x, y } = this.project(this.activeLngLat[0], this.activeLngLat[1]);
				if (!this.lastReposition || this.lastReposition.x !== x || this.lastReposition.y !== y) {
					this.activeWrapper.style.left = `${x}px`;
					this.activeWrapper.style.top = `${y}px`;
					this.lastReposition = { x, y };
				}
			} catch {
				// project can throw before the map/adapter is ready; skip this frame.
			}

			this.repositionRafId = requestAnimationFrame(tick);
		};

		this.repositionRafId = requestAnimationFrame(tick);
	}

	/**
	 * Cancel the reposition loop if it is running.
	 */
	private stopRepositionLoop(): void {
		if (this.repositionRafId) {
			cancelAnimationFrame(this.repositionRafId);
			this.repositionRafId = null;
		}
		this.lastReposition = null;
	}

	/**
	 * @param featureId
	 * @param text
	 * @returns
	 */
	private commitText(featureId: TerraDrawExtend.FeatureId, text: string): void {
		if (!text) {
			this.dismissTextarea(true);
			return;
		}

		this.store.updateProperty([
			{
				id: featureId,
				property: 'text',
				value: text
			}
		]);

		this.options?.onTextCommit?.(featureId, text);
		this.dismissTextarea(false);
		this.onFinish(featureId, { mode: this.mode, action: 'draw' });
	}

	/**
	 * @param deleteFeature
	 */
	private dismissTextarea(deleteFeature: boolean): void {
		this.stopRepositionLoop();

		if (this.activeWrapper) {
			this.activeWrapper.remove();
			this.activeWrapper = null;
		}

		this.activeTextarea = null;
		this.activeLngLat = null;
		if (deleteFeature && this.activeFeatureId) {
			this.store.delete([this.activeFeatureId]);
		}
		this.activeFeatureId = null;
	}

	/** @internal */
	onClick(event: TerraDrawMouseEvent): void {
		if (this.activeTextarea && this.activeFeatureId) {
			const activeFeature = this.store
				.copyAll()
				.find((feature) => feature.id === this.activeFeatureId);
			const hasCommittedText =
				typeof activeFeature?.properties?.text === 'string' &&
				activeFeature.properties.text.trim().length > 0;

			// Closing without submit should discard in-progress text.
			this.dismissTextarea(!hasCommittedText);
			return;
		}

		const { x, y } = this.project(event.lng, event.lat);

		// When editable, clicking/tapping near an existing label edits it in place
		// instead of creating a new overlapping label.
		if (this.editable) {
			const nearest = this.getNearestPointFeature(event.containerX, event.containerY);
			if (nearest) {
				this.editText(nearest.id as TerraDrawExtend.FeatureId, x, y);
				return;
			}
		}

		this.setCursor('crosshair');

		const [featureId] = this.store.create([
			{
				geometry: {
					type: 'Point',
					coordinates: [event.lng, event.lat]
				},
				properties: {
					mode: this.mode,
					text: ''
				}
			}
		]);

		this.showTextarea(featureId as TerraDrawExtend.FeatureId, x, y);
	}

	/** @internal */
	onKeyUp(event: TerraDrawKeyboardEvent): void {
		if (event.key !== 'Escape') return;

		// Discard the feature only when it has no committed text yet (new label).
		// Editing an existing label and pressing Escape keeps the label intact.
		const activeFeature = this.store
			.copyAll()
			.find((feature) => feature.id === this.activeFeatureId);
		const hasCommittedText =
			typeof activeFeature?.properties?.text === 'string' &&
			activeFeature.properties.text.trim().length > 0;

		this.dismissTextarea(!hasCommittedText);
	}

	/** @internal */
	onMouseMove(event: TerraDrawMouseEvent): void {
		if (this.rafId) return;

		this.rafId = requestAnimationFrame(() => {
			this.rafId = null;

			const nearest = this.getNearestPointFeature(event.containerX, event.containerY);

			this.setCursor(nearest ? 'pointer' : 'crosshair');
		});
	}

	/** @internal */
	styleFeature(feature: GeoJSONStoreFeatures): TerraDrawAdapterStyling {
		const hasText = !!feature.properties?.text;

		return {
			pointColor: hasText ? ((this.styles.pointColor ?? '#5CFF2E') as HexColor) : '#72FF35',
			pointWidth: 0,
			pointOutlineColor: '#FFFFFF',
			pointOutlineWidth: 0,
			polygonFillColor: '#000',
			polygonFillOpacity: 0,
			polygonOutlineColor: '#000000',
			polygonOutlineWidth: 0,
			lineStringColor: '#000',
			lineStringWidth: 0,
			zIndex: 30
		};
	}

	/**
	 * @param feature
	 * @returns
	 */
	validateFeature(feature: GeoJSONStoreFeatures): { valid: boolean; reason?: string } {
		return {
			valid: feature.geometry.type === 'Point' && feature.properties?.mode === this.mode
		};
	}

	/**
	 * @param event
	 * @returns
	 */
	private getNearestPointFeature(pointerX: number, pointerY: number): { id: string } | null {
		const features = this.store.copyAll();

		let nearest: { id: string } | null = null;
		let nearestDistance = Infinity;

		for (const feature of features) {
			if (
				feature.geometry.type !== 'Point' ||
				feature.properties?.mode !== this.mode ||
				!feature.properties?.text
			)
				continue;

			const [lng, lat] = feature.geometry.coordinates as [number, number];
			const { x, y } = this.project(lng, lat);
			const distance = Math.sqrt(Math.pow(pointerX - x, 2) + Math.pow(pointerY - y, 2));

			if (distance < nearestDistance && distance <= this.pointerDistance) {
				nearestDistance = distance;
				nearest = { id: feature.id as string };
			}
		}

		return nearest;
	}
}
