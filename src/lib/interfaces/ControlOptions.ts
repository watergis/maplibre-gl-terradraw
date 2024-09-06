/**
 * Plugin control constructor options
 */
export interface ControlOptions {
	/**
	 * Enable point mode. Default is true
	 */
	point?: boolean;
	/**
	 * Enable line mode. Default is true
	 */
	line?: boolean;
	/**
	 * Enable polygon mode. Default is true
	 */
	polygon?: boolean;
	/**
	 * Enable rectangle mode. Default is true
	 */
	rectangle?: boolean;
	/**
	 * Enable circle mode. Default is true
	 */
	circle?: boolean;
	/**
	 * Enable freehand mode. Default is true
	 */
	freehand?: boolean;
	/**
	 * Enable angled rectangle mode. Default is true
	 */
	angledRectangle?: boolean;
	/**
	 * Enable select mode. Default is true
	 */
	select?: boolean;
	/**
	 * Open editor as default if true. Default is false
	 */
	open?: boolean;
}
