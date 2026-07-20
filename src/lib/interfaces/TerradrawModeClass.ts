import type { TerraDrawTextMode } from '../modes/TerraDrawTextMode';
import type { TerraDrawValhallaRoutingMode } from '../modes/TerraDrawValhallaRoutingMode';
import type { TerraDrawValhallaTimeIsochroneMode } from '../modes/TerraDrawValhallaTimeIsochroneMode';
import type { TerraDrawValhallaDistanceIsochroneMode } from '../modes/TerraDrawValhallaDistanceIsochroneMode';
import {
	TerraDrawAngledRectangleMode,
	TerraDrawCircleMode,
	TerraDrawFreehandMode,
	TerraDrawFreehandLineStringMode,
	TerraDrawLineStringMode,
	TerraDrawPolyLineMode,
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
	| TerraDrawPolyLineMode
	| TerraDrawMarkerMode
	| TerraDrawPointMode
	| TerraDrawPolygonMode
	| TerraDrawRectangleMode
	| TerraDrawSectorMode
	| TerraDrawSensorMode
	| TerraDrawRenderMode
	| TerraDrawSelectMode
	| TerraDrawTextMode
	| TerraDrawValhallaRoutingMode
	| TerraDrawValhallaTimeIsochroneMode
	| TerraDrawValhallaDistanceIsochroneMode;
