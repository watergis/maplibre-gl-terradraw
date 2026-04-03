import {
	TerraDrawModeUndoRedo,
	TerraDrawSessionUndoRedo,
	TerraDrawUndoRedoKeyboardShortcuts
} from 'terra-draw';
import type { TerradrawControlOptions } from '../interfaces/TerradrawControlOptions';

/**
 * Default control options
 */
export const defaultControlOptions: TerradrawControlOptions = {
	modes: [
		'render',
		'point',
		'marker',
		'linestring',
		'polygon',
		'rectangle',
		'angled-rectangle',
		'sensor',
		'sector',
		'circle',
		'freehand',
		'freehand-linestring',
		'select',
		'delete-selection',
		'delete',
		'undo',
		'redo',
		'download'
	],
	open: false,
	undoRedo: {
		modeLevel: new TerraDrawModeUndoRedo({ maxStackSize: 100 }),
		sessionLevel: new TerraDrawSessionUndoRedo({ maxStackSize: 100 }),
		keyboardShortcuts: new TerraDrawUndoRedoKeyboardShortcuts()
	}
};
