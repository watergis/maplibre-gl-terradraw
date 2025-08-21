import { MaplibreTerradrawControl } from './MaplibreTerradrawControl';
import { defaultValhallaControlOptions } from '../constants';
import type {
	TerradrawMode,
	TerradrawValhallaMode,
	ValhallaControlOptions,
	ValhallaOptions
} from '../interfaces';
import { LngLat, type Map } from 'maplibre-gl';
import type { GeoJSONStoreGeometries, TerraDrawExtend } from 'terra-draw';
import { debounce } from '../helpers/debounce';
import {
	distanceUnitOptions,
	meansOfTransportOptions,
	ValhallaRouting,
	type distanceUnitType,
	type meansOfTransportType
} from '../helpers/valhallaRouting';
import { ModalDialog } from '$lib/helpers';

/**
 * Maplibre GL Terra Draw Measure Control
 */
export class MaplibreValhallaControl extends MaplibreTerradrawControl {
	private valhallaOptions: ValhallaOptions;
	private _modalDialog: ModalDialog | undefined;

	/**
	 * Get the URL of Valhalla API
	 */
	get valhallaUrl() {
		return this.valhallaOptions.url as string;
	}
	/**
	 * Set the URL of Valhalla API
	 * @param value URL of Valhalla API
	 */
	set valhallaUrl(value: string) {
		this.valhallaOptions.url = value;
	}

	/**
	 * Get the means of transport for Valhalla routing api
	 * @returns meansOfTransportType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	get routingMeansOfTransport() {
		return this.valhallaOptions.routingOptions?.meansOfTransport as meansOfTransportType;
	}
	/**
	 * Set the means of transport for Valhalla routing api
	 * @param value meansOfTransportType
	 * @example 'pedestrian', 'bicycle', 'auto'
	 */
	set routingMeansOfTransport(value: meansOfTransportType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.meansOfTransport = value;
	}

	/**
	 * Get the distance unit for Valhalla routing api
	 * @returns distanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	get routingDistanceUnit() {
		return this.valhallaOptions.routingOptions?.distanceUnit as distanceUnitType;
	}

	/**
	 * Set the distance unit for Valhalla routing api
	 * @param value distanceUnitType
	 * @example 'kilometers', 'miles'
	 */
	set routingDistanceUnit(value: distanceUnitType) {
		if (!this.valhallaOptions.routingOptions) {
			this.valhallaOptions.routingOptions = {};
		}
		this.valhallaOptions.routingOptions.distanceUnit = value;
	}

	/**
	 * Get the dialog instance for settings
	 */
	get settingDialog(): ModalDialog {
		return this._modalDialog as ModalDialog;
	}
	/**
	 * Set the dialog instance for settings
	 */
	set settingDialog(value: ModalDialog) {
		this._modalDialog = value;
	}

	/**
	 * Constructor
	 * @param options Plugin control options
	 */
	constructor(options?: ValhallaControlOptions) {
		let _options: ValhallaControlOptions = {
			...JSON.parse(JSON.stringify(defaultValhallaControlOptions)),
			modeOptions: { ...defaultValhallaControlOptions.modeOptions }
		};

		if (options) {
			_options = Object.assign(_options, options);
		}

		// replace {prefix} with prefixId for sources and layers
		if (!_options.adapterOptions) {
			_options.adapterOptions = {};
		}
		_options.adapterOptions.prefixId = _options.adapterOptions?.prefixId ?? 'td-valhalla';

		super({
			modes: _options.modes as unknown as TerradrawMode[],
			open: _options.open,
			modeOptions: _options.modeOptions,
			adapterOptions: _options.adapterOptions
		});
		this.valhallaOptions = _options.valhallaOptions as ValhallaOptions;
		if (!this.valhallaOptions.url) {
			throw new Error(
				'Valhalla URL is required for this control. Please set valhallaOptions.url in options.'
			);
		}
		this._cssPrefix = 'valhalla-';
	}

	/**
	 * add the plugin control to maplibre
	 * @param map Maplibre Map object
	 * @returns HTML Element
	 */
	public onAdd(map: Map): HTMLElement {
		this.controlContainer = super.onAdd(map);
		this.createSettingsDialog();
		return this.controlContainer;
	}

	/**
	 * Remove the plugin control from maplibre
	 * @returns void
	 */
	public onRemove(): void {
		this.unregisterValhallaControl();
		super.onRemove();
	}

	/**
	 * Activate Terra Draw to start drawing
	 */
	public activate() {
		super.activate();
		this.registerValhallaControl();
	}

	/**
	 * Create the settings dialog for Valhalla control
	 */
	private createSettingsDialog() {
		this.settingDialog = new ModalDialog(
			`maplibregl-terradraw-${this.cssPrefix}settings-dialog`,
			'Settings'
		);
		this.settingDialog.create(
			this.map?.getContainer().parentElement as HTMLElement,
			(content: HTMLDivElement) => {
				// Means of Transport section
				const transportSection = document.createElement('div');
				transportSection.classList.add('setting-section');

				const transportLabel = document.createElement('label');
				transportLabel.textContent = 'Means of Transport';
				transportLabel.classList.add('setting-label');
				transportSection.appendChild(transportLabel);

				transportSection.appendChild(
					this.settingDialog.createSegmentButtons(
						meansOfTransportOptions as unknown as { value: string; label: string }[],
						this.routingMeansOfTransport,
						(value: string) => {
							this.routingMeansOfTransport = value as meansOfTransportType;
						}
					)
				);
				content.appendChild(transportSection);

				// Distance Unit section
				const unitSection = document.createElement('div');
				unitSection.classList.add('setting-section');

				const unitLabel = document.createElement('label');
				unitLabel.textContent = 'Distance Unit';
				unitLabel.classList.add('setting-label');
				unitSection.appendChild(unitLabel);

				unitSection.appendChild(
					this.settingDialog.createSegmentButtons(
						distanceUnitOptions as unknown as { value: string; label: string }[],
						this.routingDistanceUnit,
						(value: string) => {
							this.routingDistanceUnit = value as distanceUnitType;
						}
					)
				);
				content.appendChild(unitSection);

				return content;
			}
		);
	}

	/**
	 * Add Terra Draw drawing mode button
	 * @param mode Terra Draw mode name
	 */
	protected addTerradrawButton(mode: TerradrawMode) {
		const btn = document.createElement('button');
		btn.type = 'button';
		this.modeButtons[mode] = btn;

		if ((mode as TerradrawValhallaMode) === 'settings') {
			btn.classList.add(`maplibregl-terradraw-${this.cssPrefix}${mode}-button`);
			btn.addEventListener('click', this.handleSettingDialog.bind(this));
		} else {
			super.addTerradrawButton(mode);
		}
	}

	/**
	 * Handle the click event of the settings button
	 */
	private handleSettingDialog() {
		this.settingDialog?.open();
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private registerValhallaControl() {
		if (!this.map) return;

		const lineModes = this.options.modes?.filter((m) => ['linestring'].includes(m));

		if (lineModes && lineModes.length > 0) {
			const drawInstance = this.getTerraDrawInstance();
			if (drawInstance) {
				// subscribe change event of TerraDraw to calc distance
				drawInstance.on('finish', this.handleTerradrawFeatureReady.bind(this));
			}
		}
	}

	/**
	 * Register  measure control related maplibre sources and layers
	 */
	private unregisterValhallaControl() {
		if (!this.map) return;

		const drawInstance = this.getTerraDrawInstance();
		if (drawInstance) {
			// subscribe change event of TerraDraw to calc distance
			drawInstance.off('finish', this.handleTerradrawFeatureReady.bind(this));
		}
	}

	/**
	 * Handle finish event of terradraw. It will be called after finishing adding a feature
	 * @param id Feature ID
	 */
	private handleTerradrawFeatureReady = debounce((id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		this.computeRouteByLineFeatureID(id);
	}, 300);

	/**
	 * Compute elevation by a LineString feature ID
	 * @param id FeatureID
	 */
	private computeRouteByLineFeatureID = async (id: TerraDrawExtend.FeatureId) => {
		if (!this.map) return;
		// console.log(this.options);

		if (!this.valhallaOptions.url) return;

		const feature = this.terradraw?.getSnapshotFeature(id);
		if (!feature || (feature && feature.geometry.type !== 'LineString')) return;
		// console.log(feature);

		const routingEngine = new ValhallaRouting(this.valhallaUrl);
		const tripData: LngLat[] = feature.geometry.coordinates.map((c) => {
			const coord = c as [number, number];
			return new LngLat(coord[0], coord[1]);
		});
		// console.log(tripData);
		if (!tripData || (tripData && tripData.length < 2)) return;

		const result = await routingEngine.calcRoute(
			tripData,
			this.routingMeansOfTransport,
			this.routingDistanceUnit
		);
		// console.log(result);
		if (!result || !result.feature) return;
		const newGeometry = result?.feature.geometry as GeoJSONStoreGeometries;
		// this.terradraw?.updateFeatureGeometry(id, newGeometry);

		feature.geometry = newGeometry;
		feature.properties = {
			...feature.properties,
			meansOfTransport: this.routingMeansOfTransport,
			distance: result.feature.properties.distance,
			distanceUnit: result.feature.properties.distance_unit,
			time: result.feature.properties.time
		};

		// to update the feature properties, remove and add are needed currently
		this.terradraw?.removeFeatures([id]);
		this.terradraw?.addFeatures([feature]);
	};
}
