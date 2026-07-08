import { test, expect } from '@playwright/test';

test('has title and collections loaded', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTitle('Collections')).toBeVisible();
  await expect(page.locator('text=My Workspace')).toBeVisible();
});

test('can send request and receive response', async ({ page }) => {
  await page.goto('/');
  const urlInput = page.getByPlaceholder('Enter request URL or paste cURL');
  await urlInput.fill('https://httpbin.org/get');
  const sendButton = page.locator('button:has-text("Send")');
  await sendButton.click();
  await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });
});

test('full collection workflow - add collection, save request, reload, delete collection', async ({ page }) => {
  await page.goto('/');
  const colName = `My E2E Collection ${Date.now()}`;
  const reqName1 = `Get UUID ${Date.now()}`;
  const reqName2 = `My Seamless Request ${Date.now()}`;
  
  // 1. Add Collection
  await page.getByTestId('add-collection-btn').first().click();
  const colInput = page.getByTestId('add-collection-input');
  await colInput.fill(colName);
  await page.getByTestId('save-collection-btn').click();
  
  // Verify it appears
  const collectionFolder = page.getByTestId(`collection-${colName}`);
  await expect(collectionFolder).toBeVisible();

  // 2. Configure a new request and send it
  const urlInput = page.getByPlaceholder('Enter request URL or paste cURL');
  await urlInput.fill('https://httpbin.org/get');
  const sendButton = page.locator('button:has-text("Send")');
  await sendButton.click();
  await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });
  
  // 3. Save Request to collection
  const saveBtn = page.getByTestId('request-save-btn');
  await saveBtn.click();
  await page.getByPlaceholder('e.g. Get User Profile').fill(reqName1);
  // Wait for dropdown to populate, select the collection
  const selectCol = page.locator('select').filter({ hasText: colName });
  await selectCol.selectOption({ label: colName });
  await page.locator('button:has-text("Save")').nth(1).click();

  // 4. Reload page to verify persistence
  await page.reload();
  
  // 5. Expand collection and verify request is there
  const reloadedColFolder = page.getByTestId(`collection-${colName}`);
  await expect(reloadedColFolder).toBeVisible();
  await reloadedColFolder.click(); // expand
  
  const savedReq = page.getByTestId(`req-${reqName1}`);
  await expect(savedReq).toBeVisible();
  
  // 6. Inline rename collection
  await reloadedColFolder.hover();
  await page.getByTestId(`col-menu-btn-${colName}`).click(); // Click 3-dot menu
  await page.getByText('Rename', { exact: true }).click();
  const renameInput = page.getByTestId('rename-collection-input');
  await renameInput.fill(`${colName} Renamed`);
  await renameInput.press('Enter');
  await expect(page.getByTestId(`collection-${colName} Renamed`)).toBeVisible();

  // 7. Add Request from menu & Seamless Save
  const renamedColFolder = page.getByTestId(`collection-${colName} Renamed`);
  await renamedColFolder.hover();
  await page.getByTestId(`col-menu-btn-${colName} Renamed`).click();
  await page.locator('text=Add Request').click();
  
  // Wait for the new tab to appear (which is async now due to POST request)
  const newTab = page.locator('span.truncate.flex-1', { hasText: 'New Request' }).last();
  await expect(newTab).toBeVisible({ timeout: 5000 });
  await newTab.dblclick();
  const tabInput = page.locator('input.flex-1.bg-transparent').first();
  await tabInput.fill(reqName2);
  await tabInput.press('Enter');

  // Fill URL and Seamless Save
  await page.getByPlaceholder('Enter request URL or paste cURL').fill('https://httpbin.org/uuid');
  await page.getByTestId('request-save-btn').click();
  await page.waitForTimeout(1000); // Wait for PUT request to complete
  // It shouldn't open a popup, so we verify by reloading and checking if it exists
  await page.reload();
  const finalFolder = page.getByTestId(`collection-${colName} Renamed`);
  await finalFolder.click();
  await expect(page.getByTestId(`req-${reqName2}`)).toBeVisible();
  
  // 8. Delete collection via 3-dot menu
  page.on('dialog', dialog => dialog.accept());
  await finalFolder.hover();
  await page.getByTestId(`col-menu-btn-${colName} Renamed`).click();
  const deleteColBtn = page.getByTestId(`delete-collection-${colName} Renamed`);
  await deleteColBtn.click();
  
  // Verify deletion
  await expect(finalFolder).not.toBeVisible();
});

test('can change HTTP method from dropdown', async ({ page }) => {
  await page.goto('/');
  
  // Wait for the app to load
  await expect(page.getByTitle('Collections')).toBeVisible();

  // Find the method selector (it displays GET by default)
  const methodSelector = page.getByTestId('method-dropdown-trigger');
  await methodSelector.click();

  // Click on POST
  const postOption = page.getByTestId('method-option-POST');
  await postOption.click();

  // Verify the method is now POST
  const updatedMethod = page.getByTestId('method-dropdown-trigger-text');
  await expect(updatedMethod).toHaveText('POST');
});
