import {
	TerraDrawValhallaIsochroneBaseMode,
	type IsochronePointStyling,
	type ValhallaIsochroneModeOptions
} from './TerraDrawValhallaIsochroneBaseMode';

export type DistanceIsochronePointStyling = IsochronePointStyling;

export type ValhallaDistanceIsochroneModeOptions = ValhallaIsochroneModeOptions;

export class TerraDrawValhallaDistanceIsochroneMode extends TerraDrawValhallaIsochroneBaseMode {
	mode = 'distance-isochrone';

	protected readonly contourType = 'distance' as const;
}
