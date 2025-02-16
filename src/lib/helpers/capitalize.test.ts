import { describe, expect, it } from 'vitest';
import { capitalize } from './capitalize';

describe('capitalize', () => {
	it('should capitalize the first letter of a word', () => {
		expect(capitalize('hello')).toBe('Hello');
	});

	it('should not change the first letter if it is already capitalized', () => {
		expect(capitalize('Hello')).toBe('Hello');
	});

	it('should handle single letter strings', () => {
		expect(capitalize('a')).toBe('A');
	});

	it('should handle empty strings', () => {
		expect(capitalize('')).toBe('');
	});

	it('should not modify non-alphabetic characters at the beginning', () => {
		expect(capitalize('123abc')).toBe('123abc');
	});

	it('should capitalize only the first letter and keep the rest unchanged', () => {
		expect(capitalize('hELLO')).toBe('HELLO');
	});
});
