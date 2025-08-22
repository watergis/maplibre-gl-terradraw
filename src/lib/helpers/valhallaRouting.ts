import { GeoJSONFeature, LngLat } from 'maplibre-gl';

/**
 * ValhallaTripSummary interface for the summary of the trip.
 */
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

/**
 * ValhallaRoutingLocation interface for the locations in the trip.
 */
export interface ValhallaRoutingLocation {
	type: string;
	lat: number;
	lon: number;
	city: string;
	original_index: number;
}

/**
 * ValhallaRoutingLeg interface for the legs of the trip.
 */
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

/**
 * ValhallaTripResult interface for the response from Valhalla routing API.
 */
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

/**
 * ValhallaError interface for error response from Valhalla API.
 */
export interface ValhallaError {
	error: string;
	error_code: number;
	status: string;
	status_code: number;
}

/**
 * Options of means of transport for Valhalla routing API.
 */
export const routingMeansOfTransportOptions = [
	{ value: 'pedestrian', label: 'Pedestrian' },
	{ value: 'bicycle', label: 'Bicycle' },
	{ value: 'auto', label: 'Car' }
] as const;

/**
 * routingMeansOfTransportType is the type for means of transport in Valhalla routing API.
 */
export type routingMeansOfTransportType = (typeof routingMeansOfTransportOptions)[number]['value'];

/**
 * Options of distance unit for Valhalla routing API.
 */
export const routingDistanceUnitOptions = [
	{ value: 'kilometers', label: 'km' },
	{ value: 'miles', label: 'mile' }
] as const;

/**
 * routingDistanceUnitType is the type for distance unit in Valhalla routing API.
 */
export type routingDistanceUnitType = (typeof routingDistanceUnitOptions)[number]['value'];

/**
 * Valhalla routing API class
 */
export class ValhallaRouting {
	private tripData: LngLat[] = [];

	/**
	 * get the raw trip data from the valhalla routing API.
	 * @returns tripData
	 */
	public getTripData(): LngLat[] {
		return this.tripData;
	}

	/**
	 * Valhalla API URL
	 */
	private url: string;

	/**
	 * Trip summary from routing API.
	 */
	private tripSummary: ValhallaTripSummary | undefined;

	/**
	 * Get the trip summary from the routing API.
	 * @returns tripSummary
	 */
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

	/**
	 * Clear the trip data and summary.
	 */
	public clearFeatures() {
		this.tripData = [];
		this.tripSummary = undefined;
	}

	/**
	 * Calculate the route using Valhalla routing API.
	 * @param tripData array of LngLat coordinates for the trip
	 * @param meansOfTransport means of transport for Valhalla routing API.
	 * @param distanceUnit distance unit for Valhalla routing API.
	 * @returns returns a feature with LineString geometry and point features for the trip data
	 * @throws Error if the trip data is invalid or if the Valhalla API returns
	 */
	public async calcRoute(
		tripData: LngLat[],
		meansOfTransport: routingMeansOfTransportType,
		distanceUnit: routingDistanceUnitType
	) {
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
			units: distanceUnit,
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
		const combinedManeuvers: ValhallaRoutingLeg['maneuvers'] = [];

		const pointFeatures = this.geoPoint(this.tripData.map((pt) => [pt.lng, pt.lat]));

		json.trip.legs.forEach((leg, index) => {
			const shape = this.decodeShape(leg.shape);
			combinedShape.push(...shape);
			sumLength += Number(leg.summary.length.toFixed(2));
			sumTime += Number((leg.summary.time / 60).toFixed());
			combinedManeuvers.push(...leg.maneuvers);

			const pointFeature = pointFeatures.features[index + 1];
			pointFeature.properties = {
				...pointFeature.properties,
				distance: sumLength,
				distance_unit: distanceUnit === 'kilometers' ? 'km' : 'mi',
				time: sumTime,
				maneuvers: leg.maneuvers
			};
		});

		const transportLabel = routingMeansOfTransportOptions.find(
			(opt) => opt.value === meansOfTransport
		)?.label as string;

		const feature = this.geoLineString(combinedShape, {
			meansOfTransport: transportLabel,
			distance: sumLength,
			distance_unit: distanceUnit === 'kilometers' ? 'km' : 'mi',
			time: sumTime,
			maneuvers: combinedManeuvers as unknown as string
		});

		const firstFeature = pointFeatures.features[0];
		firstFeature.properties = {
			...firstFeature.properties,
			meansOfTransport: transportLabel
		};
		return { feature, pointFeatures };
	}

	/**
	 * create a GeoJSON Feature with LineString geometry.
	 * @param coordinates array of coordinates
	 * @param props properties to set for the feature
	 * @returns GeoJSON Feature with LineString geometry
	 */
	private geoLineString(
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

	/**
	 * Create a GeoJSON FeatureCollection with Point features.
	 * @param coordinates array of coordinates
	 * @returns GeoJSON FeatureCollection
	 */
	private geoPoint(coordinates: number[][] = []) {
		return {
			type: 'FeatureCollection',
			features: coordinates.map((c, i) => {
				let text = (i + 1).toString();
				if (i === 0) {
					text = 'Start';
				} else if (i === coordinates.length - 1) {
					text = 'Goal';
				} else {
					text = `No.${text}`;
				}
				return {
					type: 'Feature',
					id: `node-${i}`,
					properties: {
						sequence: i,
						text
					},
					geometry: {
						type: 'Point',
						coordinates: c
					}
				};
			}) as unknown as GeoJSONFeature[]
		};
	}

	/**
	 * decode a shape string from Valhalla routing API to convert it to an array of coordinates.
	 * @param value encoded shape object from Valhalla routing API
	 * @param precision coordinate precision, default is 6
	 * @returns the list of coordinates as [lng, lat] pairs
	 */
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
