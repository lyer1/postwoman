import { test, expect } from '@playwright/test';

test.describe('New Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Import cURL works', async ({ page }) => {
    await page.click('text="Import cURL"');
    const modal = page.locator('textarea[placeholder="Paste cURL here..."]');
    await expect(modal).toBeVisible();
    await modal.fill('curl -X POST https://httpbin.org/post -H "Content-Type: application/json" -d \'{"test": "val"}\'');
    await page.click('text="Import"', { exact: true });

    // Verify it opened a new tab with correct data
    await expect(page.locator('text="Imported cURL"')).toBeVisible();
    
    // Verify Method
    const methodDropdownText = page.locator('[data-testid="method-dropdown-trigger-text"]');
    await expect(methodDropdownText).toHaveText('POST');
    
    // Verify URL
    const urlInput = page.locator('input[placeholder="Enter request URL"]');
    await expect(urlInput).toHaveValue('https://httpbin.org/post');
    
    // Switch to body tab
    await page.click('button:has-text("Body")');
    await expect(page.locator('textarea')).toHaveValue('{"test": "val"}');
  });

  test('Pasting cURL in URL bar works', async ({ page }) => {
    await page.getByTestId('add-tab-btn').click();
    const urlInput = page.locator('input[placeholder="Enter request URL"]');
    
    // Simulate paste event
    await urlInput.focus();
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Enter request URL"]');
      if (input) {
        const dt = new DataTransfer();
        dt.setData('text/plain', 'curl -X PUT https://httpbin.org/put -H "x-test: 123"');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true
        });
        input.dispatchEvent(pasteEvent);
      }
    });

    const methodDropdownText = page.locator('[data-testid="method-dropdown-trigger-text"]');
    await expect(methodDropdownText).toHaveText('PUT');
    await expect(urlInput).toHaveValue('https://httpbin.org/put');

    await page.click('button:has-text("Headers")');
    const firstRowKey = page.locator('tbody tr').nth(0).locator('td').nth(1).locator('input');
    await expect(firstRowKey).toHaveValue('x-test');
  });

  test('Code snippet generation works', async ({ page }) => {
    // Fill basic request
    await page.getByTestId('add-tab-btn').click();
    const urlInput = page.locator('input[placeholder="Enter request URL"]');
    await urlInput.fill('https://httpbin.org/get');

    // Open Code modal
    await page.click('button:has-text("Code")');
    
    // Verify Modal
    await expect(page.locator('h2:has-text("Generate Code Snippet")')).toBeVisible();
    
    // Verify curl is default
    const textarea = page.locator('textarea[readonly]');
    await expect(textarea).toContainText('curl -X GET \'https://httpbin.org/get\'');
    
    // Switch to Fetch
    await page.click('button:has-text("FETCH")');
    await expect(textarea).toContainText('fetch(\'https://httpbin.org/get\'');
    
    // Close
    await page.click('button:has-text("Close")');
  });

  test('JSON Beautify feature works', async ({ page }) => {
    await page.getByTestId('add-tab-btn').click();
    
    // Switch to body tab
    await page.click('button:has-text("Body")');
    
    // Select raw
    await page.locator('label', { hasText: 'raw' }).click();
    
    // Input unformatted JSON
    const editorTextarea = page.locator('textarea').last(); // react-simple-code-editor uses textarea inside
    await editorTextarea.fill('{"a":1,"b":   2}');
    
    // Click Beautify
    await page.click('button[title="Beautify JSON"]');
    
    // Verify formatted
    await expect(editorTextarea).toHaveValue('{\n  "a": 1,\n  "b": 2\n}');
  });

  test('Auth Tab - Basic and Bearer Token works', async ({ page }) => {
    await page.getByTestId('add-tab-btn').click();
    const urlInput = page.locator('input[placeholder="Enter request URL"]');
    await urlInput.fill('https://httpbin.org/get');

    // Go to Auth tab
    await page.click('button:has-text("Auth")');

    // Select Basic Auth
    await page.getByTestId('auth-type-select').selectOption('basic');
    await page.getByTestId('auth-basic-username').fill('testuser');
    await page.getByTestId('auth-basic-password').fill('testpass');

    // Send Request
    await page.click('button:has-text("Send")');

    // Verify response headers in pretty JSON response
    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });
    // base64 of testuser:testpass is dGVzdHVzZXI6dGVzdHBhc3M=
    await expect(page.locator('pre')).toContainText('"Authorization": "Basic dGVzdHVzZXI6dGVzdHBhc3M="');

    // Check Code snippet generation for Basic
    await page.click('button:has-text("Code")');
    await expect(page.locator('textarea[readonly]')).toContainText('-H \'Authorization: Basic dGVzdHVzZXI6dGVzdHBhc3M=\'');
    await page.click('button:has-text("Close")');

    // Select Bearer Token
    await page.getByTestId('auth-type-select').selectOption('bearer');
    await page.getByTestId('auth-bearer-token').fill('my-super-secret-token');

    // Send Request
    await page.click('button:has-text("Send")');

    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('pre')).toContainText('"Authorization": "Bearer my-super-secret-token"');
  });

  test('Nested folders works', async ({ page }) => {
    // Create Root Collection
    const uniqueColName = `Root Col ${Date.now()}`;
    await page.getByTestId('add-collection-btn').last().click({ force: true });
    await page.getByTestId('add-collection-input').fill(uniqueColName);
    await page.getByTestId('save-collection-btn').click();
    
    // Create Folder inside it
    await page.getByTestId(`col-menu-btn-${uniqueColName}`).click();
    await page.click('text="Add Folder"');
    
    // Since folders are called "New Folder" by default
    await expect(page.locator(`[data-testid="collection-New Folder"]`).last()).toBeVisible();

    // Cleanup
    page.on('dialog', dialog => dialog.accept());
    await page.getByTestId(`col-menu-btn-${uniqueColName}`).click();
    await page.getByTestId(`delete-collection-${uniqueColName}`).click();
  });
});
