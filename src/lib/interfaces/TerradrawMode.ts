import { AvailableModes, AvailableValhallaModes } from '../constants/AvailableModes';

/**
 * Terra Draw drawing mode
 *
 * Note.
 * 'default' is a special mode when 'render' mode is not added to the control.
 * 'default' mode itself does not have any associated button.
 */
export type TerradrawMode = (typeof AvailableModes)[number] | 'default';

/**
 * Terra Draw drawing mode for MaplibreValhallaControl
 *
 * Note.
 * 'default' is a special mode when 'render' mode is not added to the control.
 * 'default' mode itself does not have any associated button.
 */
export type TerradrawValhallaMode = (typeof AvailableValhallaModes)[number] | 'default';
