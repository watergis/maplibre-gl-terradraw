import { AvailableModes } from '../../src/lib/constants/AvailableModes';
import { test, expect } from '@playwright/test';

test.describe('Test without any query params', () => {
	test('landing page has expected title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Maplibre GL Terra Draw/);
	});

	test('demo page has expected to have map class', async ({ page }) => {
		await page.goto('/');
		const mapContainer = page.locator('.map');
		await expect(mapContainer).toHaveCount(2);
	});

	test('demo page has expected to have mode buttons', async ({ page }) => {
		await page.goto('/');

		for (const mode of AvailableModes) {
			const modeButton = page.getByTestId(mode);
			await expect(modeButton).toHaveCount(1);
		}
	});
});

test.describe('Test isOpen query param', () => {
	test('demo page has expected to open tool as default', async ({ page }) => {
		await page.goto('/?isOpen=open');
		const renderButton = page.getByTestId('render');
		await expect(renderButton).toHaveClass(/enabled/);
	});

	test('demo page has expected to close tool as default', async ({ page }) => {
		await page.goto('/?isOpen=close');
		const renderButton = page.getByTestId('render');
		await expect(renderButton).not.toHaveClass(/enabled/);
	});
});
