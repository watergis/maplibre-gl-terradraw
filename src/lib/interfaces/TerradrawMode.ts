import { AvailableModes, AvailableMeasureModes } from '../constants/AvailableModes.js';

/**
 * Terra Draw drawing mode
 */
export type TerradrawMode = (typeof AvailableModes)[number];

/**
 * Terra Draw Measure control mode
 */
export type MeasureControlMode = (typeof AvailableMeasureModes)[number];
