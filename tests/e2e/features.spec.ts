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
    const urlInput = page.locator('input[placeholder="Enter request URL or paste cURL"]');
    await expect(urlInput).toHaveValue('https://httpbin.org/post');
    
    // Switch to body tab
    await page.click('button:has-text("Body")');
    await expect(page.locator('textarea')).toHaveValue('{"test": "val"}');
  });

  test('Pasting cURL in URL bar works', async ({ page }) => {
    await page.getByTestId('add-tab-btn').click();
    const urlInput = page.locator('input[placeholder="Enter request URL or paste cURL"]');
    
    // Simulate paste event
    await urlInput.focus();
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Enter request URL or paste cURL"]');
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
    const urlInput = page.locator('input[placeholder="Enter request URL or paste cURL"]');
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
    const urlInput = page.locator('input[placeholder="Enter request URL or paste cURL"]');
    await urlInput.fill('https://httpbin.org/get');

    // Go to Auth tab
    await page.click('button:has-text("Auth")');

    // Select Basic Auth
    await page.getByTestId('auth-type-select').click();
    await page.locator('text=Basic Auth').first().click();
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
    await page.getByTestId('auth-type-select').click();
    await page.locator('text=Bearer Token').first().click();
    await page.getByTestId('auth-bearer-token').fill('my-super-secret-token');

    // Send Request
    await page.click('button:has-text("Send")');

    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('pre')).toContainText('"Authorization": "Bearer my-super-secret-token"');
  });

  test('Scripts - Pre-req and Post-res work correctly', async ({ page }) => {
    await page.getByTestId('add-tab-btn').click();
    const urlInput = page.locator('input[placeholder="Enter request URL or paste cURL"]');
    await urlInput.fill('https://httpbin.org/get');

    // Go to Scripts tab
    await page.click('button:has-text("Scripts")');

    // Pre-req Script: Set env variable
    await page.click('button:has-text("Pre-req")');
    const editorTextarea = page.locator('textarea').last();
    await editorTextarea.fill("pw.env.set('my_dynamic_var', 'scripted_value');");

    // Add query param using this var
    await page.click('button:has-text("Params")');
    await page.click('button:has-text("Add Item")');
    const paramKey = page.locator('tbody tr').nth(0).locator('td').nth(1).locator('input');
    const paramVal = page.locator('tbody tr').nth(0).locator('td').nth(2).locator('input');
    await paramKey.fill('custom_param');
    await paramVal.fill('{{my_dynamic_var}}');

    // Go back to scripts, switch to Post-res
    await page.click('button:has-text("Scripts")');
    await page.click('button:has-text("Post-res")');
    
    // Post-res Script: Run a test
    await editorTextarea.fill(`
pw.test("Status code is 200", () => {
  pw.expect(pw.response.status).toBe(200);
});
pw.test("Test that fails", () => {
  pw.expect(pw.response.status).toBe(500);
});
`);

    // Send Request
    await page.click('button:has-text("Send")');
    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });

    // Verify the URL param was resolved to 'scripted_value'
    await page.click('button:has-text("Body")');
    await expect(page.locator('pre')).toContainText('"custom_param": "scripted_value"');

    // Verify Test Results
    await page.click('button:has-text("Test Results")');
    
    // Check passes
    await expect(page.locator('text=Test Results (1/2 passed)')).toBeVisible();
    await expect(page.locator('text=Status code is 200')).toBeVisible();
    
    // Check failure
    await expect(page.locator('text=Test that fails')).toBeVisible();
    await expect(page.locator('text=Expected 500, got 200')).toBeVisible();
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

  test('JSON Import works', async ({ page }) => {
    const uniqueSuffix = Date.now().toString();
    const colName = `Imported JSON ${uniqueSuffix}`;
    const folderName = `Imported Folder ${uniqueSuffix}`;
    const reqName = `Imported Request ${uniqueSuffix}`;
    
    // Create a mock postman collection json
    const mockCollection = {
      info: {
        name: colName,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [
        {
          name: folderName,
          item: [
            {
              name: reqName,
              request: {
                method: "POST",
                header: [
                  { key: "Content-Type", value: "application/json" }
                ],
                url: {
                  raw: "https://httpbin.org/post",
                  protocol: "https",
                  host: ["httpbin", "org"],
                  path: ["post"]
                },
                body: {
                  mode: "raw",
                  raw: "{\"key\": \"value\"}"
                }
              }
            }
          ]
        }
      ]
    };

    const fs = require('fs');
    const path = require('path');
    const tempFilePath = path.join(__dirname, 'temp_mock_collection.json');
    fs.writeFileSync(tempFilePath, JSON.stringify(mockCollection));

    // Wait for the UI
    await page.waitForSelector('text=My Workspace');
    
    // Set file to input
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import Collection")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFilePath);

    // Wait for import to complete and collection to appear
    await expect(page.locator(`text=${colName}`).first()).toBeVisible({ timeout: 10000 });

    // Expand imported collection
    await page.locator(`text=${colName}`).first().click();
    await expect(page.locator(`text=${folderName}`).first()).toBeVisible();

    // Expand folder
    await page.locator(`text=${folderName}`).first().click();
    await expect(page.locator(`text=${reqName}`).first()).toBeVisible();

    // Open imported request
    await page.locator(`text=${reqName}`).first().click();
    
    // Check request details
    await expect(page.getByTestId('method-dropdown-trigger-text')).toHaveText('POST');
    const urlInput = page.locator('input[placeholder="Enter request URL or paste cURL"]');
    await expect(urlInput).toHaveValue('https://httpbin.org/post');

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });
});
