import {
	defaultSubmitButtonStyleOptions,
	defaultTextAreaStyleOptions,
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

export type TextModeStyling = {
	pointColor?: HexColor;
	pointWidth?: number;
	pointOutlineColor?: HexColor;
	pointOutlineWidth?: number;
	textColor?: HexColor;
	textSize?: number;
	textHaloColor?: HexColor;
	textHaloWidth?: number;
};

type DOMStyles = {
	textArea?: Partial<CSSStyleDeclaration>;
	submitButton?: Partial<CSSStyleDeclaration>;
};

type TextAreaPopup = {
	wrapper: HTMLDivElement;
	textarea: HTMLTextAreaElement;
};

export type TextModeOptions = {
	styles?: Partial<TextModeStyling>;
	placeholder?: string;
	onTextCommit?: (featureId: TerraDrawExtend.FeatureId, text: string) => void;
	draggable?: boolean;
	editable?: boolean;
	domStyles?: DOMStyles;
};

export class TerradrawTextMode extends TerraDrawBaseDrawMode<TextModeStyling> {
	mode = 'text';

	options?: TextModeOptions;

	private isDragging = false;
	private draggedFeatureId: string | null = null;
	private editable: boolean = false;

	private activeWrapper: HTMLDivElement | null = null;
	private activeTextarea: HTMLTextAreaElement | null = null;
	private activeFeatureId: TerraDrawExtend.FeatureId | null = null;

	private _onDragSync: (() => void) | undefined;
	private _mapContainer: HTMLElement | null = null;
	private isContextMenuOpen?: boolean = false;
	private rafId?: number | null = null;

	constructor(options?: TextModeOptions) {
		super({ styles: options?.styles ?? {} });
		this.options = options;
		this.styles = options?.styles ?? {};
		this.editable = options?.editable ?? false;
		this._mapContainer = this.getMap();

		this.pointerEvents = {
			...this.pointerEvents,
			contextMenu: true
		};
	}

	/** @internal */
	start() {
		this.setStarted();
		this.setCursor('crosshair');

		this._mapContainer?.addEventListener('contextmenu', this.onContextMenu.bind(this));
	}

	/** @internal */
	stop() {
		this.cleanUp();
		this.setStopped();
		this.setCursor('unset');

		this.isContextMenuOpen = false;

		this._mapContainer?.removeEventListener('contextmenu', this.onContextMenu.bind(this));
	}

	/** @internal */
	cleanUp(): void {
		this.dismissTextarea(true);
		this.isDragging = false;
		this.draggedFeatureId = null;

		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}

		this.isContextMenuOpen = false;
	}

	set onDragSync(fn: (() => void) | undefined) {
		this._onDragSync = fn;
	}

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
			top: `${y + 8}px`
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
		textarea.rows = 3;

		if (currentText) {
			textarea.value = currentText;
			textarea.setSelectionRange(currentText.length, currentText.length);
		}

		const textAreaStyles = this.createDomStyles('textArea');
		Object.assign(textarea.style, textAreaStyles);

		return textarea;
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
		style: 'textArea' | 'submitButton' | 'textAreaWrapper'
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
		const textarea = this.createTextAreaElement(currentText);
		const submitButton = this.createSubmitButton();

		submitButton.disabled = !currentText;
		submitButton.style.opacity = currentText ? '1' : '0.5';
		submitButton.style.cursor = currentText ? 'pointer' : 'not-allowed';

		textarea.addEventListener('input', () => {
			const hasText = textarea.value.trim().length > 0;
			submitButton.disabled = !hasText;
			submitButton.style.opacity = hasText ? '1' : '0.5';
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

		wrapper.appendChild(textarea);
		wrapper.appendChild(submitButton);
		this._mapContainer?.appendChild(wrapper);
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

		this.activeWrapper = wrapper;
		this.activeTextarea = textarea;
		this.activeFeatureId = featureId;
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

		this.activeWrapper = wrapper;
		this.activeTextarea = textarea;
		this.activeFeatureId = featureId;
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
		this.isContextMenuOpen = false;
	}

	/**
	 * @param deleteFeature
	 */
	private dismissTextarea(deleteFeature: boolean): void {
		if (this.activeWrapper) {
			this.activeWrapper.remove();
			this.activeWrapper = null;
		}

		this.activeTextarea = null;
		if (deleteFeature && this.activeFeatureId) {
			this.store.delete([this.activeFeatureId]);
		}
		this.activeFeatureId = null;
	}

	/** @internal */
	onClick(event: TerraDrawMouseEvent): void {
		if (this.isContextMenuOpen && this.options?.editable) {
			this.isContextMenuOpen = false;
			return;
		}

		if (this.activeTextarea && this.activeFeatureId) {
			this.commitText(this.activeFeatureId, this.activeTextarea.value.trim());
			this.isContextMenuOpen = false;
			return;
		}

		const { x, y } = this.project(event.lng, event.lat);
		this.setCursor('crosshair');

		const [featureId] = this.store.create([
			{
				geometry: {
					type: 'Point',
					coordinates: [event.lng, event.lat]
				},
				properties: {
					mode: this.mode,
					text: '',
					draggable: true
				}
			}
		]);

		this.showTextarea(featureId as TerraDrawExtend.FeatureId, x, y);
	}

	/**
	 * @param event
	 * @returns
	 */
	onContextMenu(event: MouseEvent): void {
		if (!this.editable) return;

		this.isContextMenuOpen = true;

		event.preventDefault();

		const rect = (this._mapContainer as HTMLElement).getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const nearest = this.getNearestPointFeature(x, y);
		if (!nearest) {
			this.isContextMenuOpen = false;
			return;
		}
		this.editText(nearest.id, x, y);
	}

	/** @internal */
	onDragStart(event: TerraDrawMouseEvent, setMapDragging: (dragging: boolean) => void): void {
		if (!this.allowPointerEvent(this.pointerEvents.onDragStart, event)) return;
		if (this.activeWrapper) return;

		this.setCursor('grabbing');
		const { x: pointerX, y: pointerY } = this.project(event.lng, event.lat);

		const nearest = this.getNearestPointFeature(pointerX, pointerY);
		if (!nearest) return;

		this.isDragging = true;
		this.draggedFeatureId = nearest.id as string;
		setMapDragging(false);
	}

	/** @internal */
	onDrag(event: TerraDrawMouseEvent, setMapDragging: (dragging: boolean) => void): void {
		if (this.activeWrapper) {
			this.dismissTextarea(true);
		}

		if (!this.isDragging || !this.draggedFeatureId) return;

		setMapDragging(false);
		this.setCursor('move');

		if (this.options?.draggable) {
			this.store.updateGeometry([
				{
					id: this.draggedFeatureId,
					geometry: {
						type: 'Point',
						coordinates: [event.lng, event.lat]
					}
				}
			]);

			this._onDragSync?.();
		}
	}

	/** @internal */
	onDragEnd(_event: TerraDrawMouseEvent, setMapDragging: (dragging: boolean) => void): void {
		this.setCursor('crosshair');
		this.isDragging = false;
		this.draggedFeatureId = null;
		setMapDragging(true);
	}

	/** @internal */
	onKeyUp(event: TerraDrawKeyboardEvent): void {
		if (event.key === 'Escape' && !this.isContextMenuOpen) this.dismissTextarea(true);
	}

	/** @internal */
	onMouseMove(event: TerraDrawMouseEvent): void {
		if (this.rafId) return;

		this.rafId = requestAnimationFrame(() => {
			this.rafId = null;

			const nearest = this.getNearestPointFeature(event.containerX, event.containerY);

			this.setCursor(nearest ? 'move' : 'crosshair');
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
