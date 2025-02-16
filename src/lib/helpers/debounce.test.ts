import { describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
	it('should call the function after the specified delay', async () => {
		const callback = vi.fn();
		const debouncedFn = debounce(callback, 50);

		debouncedFn();
		expect(callback).not.toHaveBeenCalled();

		await new Promise((resolve) => setTimeout(resolve, 75));
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should reset the delay if called again within the delay period', async () => {
		const callback = vi.fn();
		const debouncedFn = debounce(callback, 50);

		debouncedFn();
		await new Promise((resolve) => setTimeout(resolve, 25));
		debouncedFn();
		await new Promise((resolve) => setTimeout(resolve, 75));

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('should use the latest arguments when invoked multiple times within delay', async () => {
		const callback = vi.fn();
		const debouncedFn = debounce(callback, 50);

		debouncedFn('first');
		await new Promise((resolve) => setTimeout(resolve, 25));
		debouncedFn('second');
		await new Promise((resolve) => setTimeout(resolve, 75));

		expect(callback).toHaveBeenCalledWith('second');
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
