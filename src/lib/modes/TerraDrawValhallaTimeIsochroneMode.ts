import {
	TerraDrawValhallaIsochroneBaseMode,
	type IsochronePointStyling,
	type ValhallaIsochroneModeOptions
} from './TerraDrawValhallaIsochroneBaseMode';

export type { IsochronePointStyling };

export type ValhallaTimeIsochroneModeOptions = ValhallaIsochroneModeOptions;

export class TerraDrawValhallaTimeIsochroneMode extends TerraDrawValhallaIsochroneBaseMode {
	mode = 'time-isochrone';

	protected readonly contourType = 'time' as const;
}
