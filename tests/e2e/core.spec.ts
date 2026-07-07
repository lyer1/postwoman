import { test, expect } from '@playwright/test';

test('has title and collections loaded', async ({ page }) => {
  await page.goto('/');
  // Basic validation that UI is rendering
  await expect(page.getByRole('button', { name: 'Collections' })).toBeVisible();
  
  // Validate that default seeded collection is present
  await expect(page.locator('text=Sample API')).toBeVisible();
});

test('can send request and receive response', async ({ page }) => {
  await page.goto('/');
  
  // Type url and send request
  const urlInput = page.getByPlaceholder('Enter request URL');
  await urlInput.fill('https://httpbin.org/get');
  
  const sendButton = page.locator('button:has-text("Send")');
  await sendButton.click();
  
  // Wait for response to load
  await expect(page.locator('text=Status:')).toBeVisible({ timeout: 10000 });
  
  // Status should be 200
  const statusEl = page.locator('text=200');
  await expect(statusEl).toBeVisible();
});
