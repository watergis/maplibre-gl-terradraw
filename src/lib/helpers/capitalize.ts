/**
 * Capitalzie string value
 * @param value string value
 * @returns string
 */
export const capitalize = (value: string) => {
	return value.charAt(0).toUpperCase() + value.slice(1);
};
