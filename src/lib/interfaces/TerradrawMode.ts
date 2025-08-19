import { AvailableModes, AvailableValhallaModes } from '../constants/AvailableModes';

/**
 * Terra Draw drawing mode
 */
export type TerradrawMode = (typeof AvailableModes)[number];

export type TerradrawValhallaMode = (typeof AvailableValhallaModes)[number];
