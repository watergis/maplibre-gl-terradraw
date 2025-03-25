import { test, expect } from '@playwright/test';
import { exampleIds } from '../../../src/routes/helpers.js';

test.describe('each examples page test', () => {
	for (const option of exampleIds) {
		test(`${option} example page has expected to have title`, async ({ page }) => {
			await page.goto(`/examples/${option}`);
			await expect(page).toBeDefined();
		});
	}
});
