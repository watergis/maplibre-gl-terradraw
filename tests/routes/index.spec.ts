import { AvailableModes } from '../../src/lib/constants/AvailableModes';
import { test, expect, type Page } from '@playwright/test';
import { configureAxe, injectAxe } from 'axe-playwright';

const beforeEach = async (page: Page, url: string) => {
	await page.goto(url);
	await injectAxe(page);

	configureAxe(page, {
		checks: [{ id: 'page-has-heading-one', enabled: false }]
	});
};

test.describe('Test without any query params', () => {
	test('landing page has expected title', async ({ page }) => {
		await beforeEach(page, '/');
		await expect(page).toHaveTitle(/Maplibre GL Terra Draw/);
	});

	test('demo page has expected to have map class', async ({ page }) => {
		await beforeEach(page, '/');
		const mapContainer = page.locator('.map');
		await expect(mapContainer).toHaveCount(2);
	});

	test('demo page has expected to have mode buttons', async ({ page }) => {
		await beforeEach(page, '/');

		for (const mode of AvailableModes) {
			const modeButton = page.getByTestId(mode);
			await expect(modeButton).toHaveCount(1);
		}
	});
});

test.describe('Test isOpen query param', () => {
	test('demo page has expected to open tool as default', async ({ page }) => {
		await beforeEach(page, '/?isOpen=open');
		const renderButton = page.getByTestId('render');
		await expect(renderButton).toHaveClass(/enabled/);
	});

	test('demo page has expected to close tool as default', async ({ page }) => {
		await beforeEach(page, '/?isOpen=close');
		const renderButton = page.getByTestId('render');
		await expect(renderButton).not.toHaveClass(/enabled/);
	});
});
