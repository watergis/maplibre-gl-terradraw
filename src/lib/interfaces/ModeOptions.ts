import type { TerradrawModeClass } from './TerradrawModeClass';

/**
 * Map for between mode name and TerraDraw mode class instance
 */
export interface ModeOptions {
	[key: string]: TerradrawModeClass;
}
