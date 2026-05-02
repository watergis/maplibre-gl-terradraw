import type { MaplibreTerradrawTextMode } from '../modes/MaplibreTerradrawTextMode';
import {
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawFreehandLineStringMode,
	TerraDrawLineStringMode,
	TerraDrawMarkerMode,
	TerraDrawPointMode,
	TerraDrawPolygonMode,
	TerraDrawRectangleMode,
	TerraDrawSectorMode,
	TerraDrawSensorMode,
	TerraDrawRenderMode,
	TerraDrawSelectMode
} from 'terra-draw';

/**
 * TerraDraw mode class types
 */
export type TerradrawModeClass =
	| TerraDrawAngledRectangleMode
	| TerraDrawCircleMode
	| TerraDrawFreehandMode
	| TerraDrawFreehandLineStringMode
	| TerraDrawLineStringMode
	| TerraDrawMarkerMode
	| TerraDrawPointMode
	| TerraDrawPolygonMode
	| TerraDrawRectangleMode
	| TerraDrawSectorMode
	| TerraDrawSensorMode
	| TerraDrawRenderMode
	| TerraDrawSelectMode
	| MaplibreTerradrawTextMode;
