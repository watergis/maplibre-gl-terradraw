/**
 * debounce
 * @param callback callback function
 * @param delay millisecond to delay
 */
export const debounce = <T extends (...args: Parameters<T>) => unknown>(
	callback: T,
	delay = 250
): ((...args: Parameters<T>) => void) => {
	let timeoutId: number;
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => callback(...args), delay) as unknown as number;
	};
};
