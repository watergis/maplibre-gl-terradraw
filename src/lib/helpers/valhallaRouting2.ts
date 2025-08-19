import { GeoJSONFeature, LngLat } from 'maplibre-gl';

export interface ValhallaTripSummary {
	has_time_restrictions: boolean;
	min_lat: number;
	min_lon: number;
	max_lat: number;
	max_lon: number;
	time: number;
	length: number;
	cost: number;
}

export interface ValhallaRoutingLocation {
	type: string;
	lat: number;
	lon: number;
	city: string;
	original_index: number;
}

export interface ValhallaRoutingLeg {
	maneuvers: {
		type: number;
		instruction: string;
		verbal_pre_transition_instruction: string;
		verbal_post_transition_instruction: string;
		time: number;
		length: number;
		cost: number;
		begin_shape_index: number;
		end_shape_index: number;
		rough: boolean;
		travel_mode: string;
		travel_type: string;
	}[];
	summary: ValhallaTripSummary;
	shape: string;
}

export interface ValhallaTripResult {
	trip: {
		locations: ValhallaRoutingLocation[];
		legs: ValhallaRoutingLeg[];
		summary: ValhallaTripSummary;
		status_message: string;
		status: number;
		units: string;
		language: string;
	};
	id: string;
}

export interface ValhallaError {
	error: string;
	error_code: number;
	status: string;
	status_code: number;
}

export type meansOfTransportType = 'pedestrian' | 'bicycle' | 'auto';

export class ValhallaRouting {
	private tripData: LngLat[] = [];

	public getTripData(): LngLat[] {
		return this.tripData;
	}

	private url: string;

	private tripSummary: ValhallaTripSummary | undefined;
	public getTripSummary(): ValhallaTripSummary | undefined {
		return this.tripSummary;
	}

	/**
	 * Constructor
	 * @param url URL for terrain RGB raster tilesets
	 */
	constructor(url: string) {
		this.url = url;
	}

	public clearFeatures() {
		this.tripData = [];
		this.tripSummary = undefined;
	}

	public async calcRoute(tripData: LngLat[], meansOfTransport: meansOfTransportType) {
		this.tripData = tripData;
		if (!this.tripData || (this.tripData && this.tripData.length < 2)) {
			this.tripSummary = undefined;
			return;
		}
		// errorMessage = '';
		const baseAPI = `${this.url}/route`;
		const params = {
			locations: this.tripData.map((pt) => {
				return { lon: pt.lng, lat: pt.lat };
			}),
			costing: meansOfTransport,
			costing_options: { auto: { country_crossing_penalty: 2000.0 } },
			units: 'kilometers',
			id: 'my_work_route'
		};
		const apiUrl = `${baseAPI}?json=${JSON.stringify(params)}`;

		const res = await fetch(apiUrl);
		const json: ValhallaTripResult | ValhallaError = await res.json();
		if ('error' in json) {
			this.tripData.pop(); //remove the last coordinates which cause error
			throw new Error(`${json.status} (${json.status_code}): ${json.error} (${json.error_code})`);
		}
		const shapes = json.trip.legs.map((s) => this.decodeShape(s.shape));
		let shape: number[][] = [];
		shapes.forEach((shp) => {
			shape = [...shape, ...shp];
		});
		this.tripSummary = json.trip.summary;
		this.tripSummary.length = Number(this.tripSummary.length.toFixed(2));
		this.tripSummary.time = Number((this.tripSummary.time / 60).toFixed());

		const combinedShape: number[][] = [];
		let sumLength = 0;
		let sumTime = 0;
		json.trip.legs.forEach((leg) => {
			const shape = this.decodeShape(leg.shape);
			combinedShape.push(...shape);
			sumLength += Number(leg.summary.length.toFixed(2));
			sumTime += Number((leg.summary.time / 60).toFixed());
		});
		const feature = this.geoLineString(combinedShape, {
			length: sumLength,
			time: sumTime
		});

		const pointFeatures = this.geoPoint(this.tripData.map((pt) => [pt.lng, pt.lat]));
		return { feature, pointFeatures };
	}

	geoLineString(
		coordinates: number[][] = [],
		props: { [key: string]: string | number } = {}
	): GeoJSONFeature {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return {
			type: 'Feature',
			properties: props,
			geometry: {
				type: 'LineString',
				coordinates
			}
		};
	}

	geoPoint(coordinates: number[][] = []): GeoJSONFeature {
		return {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			type: 'FeatureCollection',
			features: coordinates.map((c, i) => {
				let text = (i + 1).toString();
				if (i === 0) {
					text = 'From';
				} else if (i === coordinates.length - 1) {
					text = 'To';
				}
				return {
					type: 'Feature',
					properties: {
						text
					},
					geometry: {
						type: 'Point',
						coordinates: c
					}
				};
			})
		};
	}

	private decodeShape(value: string, precision = 6) {
		let index = 0,
			lat = 0,
			lng = 0,
			// eslint-disable-next-line prefer-const
			coordinates: number[][] = [],
			shift = 0,
			result = 0,
			byte = null,
			latitude_change,
			longitude_change,
			// eslint-disable-next-line prefer-const
			factor = Math.pow(10, precision || 6);

		// Coordinates have variable length when encoded, so just keep
		// track of whether we've hit the end of the string. In each
		// loop iteration, a single coordinate is decoded.
		while (index < value.length) {
			// Reset shift, result, and byte
			byte = null;
			shift = 0;
			result = 0;

			do {
				byte = value.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			latitude_change = result & 1 ? ~(result >> 1) : result >> 1;

			shift = result = 0;

			do {
				byte = value.charCodeAt(index++) - 63;
				result |= (byte & 0x1f) << shift;
				shift += 5;
			} while (byte >= 0x20);

			longitude_change = result & 1 ? ~(result >> 1) : result >> 1;

			lat += latitude_change;
			lng += longitude_change;

			coordinates.push([lng / factor, lat / factor]);
		}

		return coordinates;
	}
}
