import { test, expect } from '@playwright/test';

test.describe('Environment variables in request bodies', () => {
  test('variables work in raw JSON body and FormData', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('/');

    // 2. Go to Environments sidebar (Activity Bar)
    await page.getByTitle('Environments').click();

    // 3. Create a new environment
    await page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first().click();

    // 4. Find the newly created environment in the list and click it
    const envRow = page.locator('text="New Environment"').first();
    await envRow.click();
    
    // Wait for the environment tab to open
    await expect(page.locator('h1 input')).toHaveValue('New Environment');

    // Give it a unique name
    const envName = `Test Env ${Date.now()}`;
    await page.locator('h1 input').fill(envName);

    // 5. Add a variable 'url' = 'https://httpbin.org'
    await page.getByPlaceholder('Add a new variable').fill('url');
    // After typing, a new row is added. The 'url' row is now the first row (index 0).
    const firstRowValInput = page.locator('tbody tr').nth(0).locator('td').nth(2).locator('input');
    await firstRowValInput.fill('https://httpbin.org');

    // 6. Add a variable 'test_val' = 'hello_world'
    await page.getByPlaceholder('Add a new variable').fill('test_val');
    const secondRowValInput = page.locator('tbody tr').nth(1).locator('td').nth(2).locator('input');
    await secondRowValInput.fill('hello_world');

    // 7. Save the environment
    await page.locator('button', { hasText: 'Save' }).click();
    await expect(page.locator('button', { hasText: 'Saved' })).toBeVisible();

    // 8. Create a new request tab
    await page.getByTestId('add-tab-btn').click();

    // 9. Select the environment in the dropdown
    await page.locator('select').filter({ hasText: 'No Environment' }).selectOption({ label: envName });

    // 10. Set URL and Method
    await page.getByPlaceholder('Enter request URL').fill('{{url}}/post');
    const methodSelector = page.getByTestId('method-dropdown-trigger');
    await methodSelector.click();
    await page.getByTestId('method-option-POST').click();

    // 11. Test Raw JSON Body
    await page.locator('text=Body').click();
    await page.locator('label', { hasText: 'raw' }).click();
    await page.locator('textarea').fill('{"my_var": "{{test_val}}"}');

    // Send Request
    await page.locator('button', { hasText: 'Send' }).click();

    // Verify response body
    // Wait for response to load
    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });

    // In httpbin.org/post, the response JSON contains 'json' field matching our request body
    // "json": { "my_var": "hello_world" }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug_screenshot.png' });
    const preText = await page.locator('pre').innerText();
    console.log('PRE TEXT:', preText);
    await expect(page.locator('pre')).toContainText('"my_var": "hello_world"');

    // 12. Test FormData Body
    await page.locator('label', { hasText: 'formdata' }).click();
    // Click Add Item
    await page.locator('button', { hasText: 'Add Item' }).click();
    // Fill first row key
    const formKeyInput = page.getByPlaceholder('Key').first();
    await formKeyInput.fill('form_var');
    // Fill first row value
    const formValInput = page.getByPlaceholder('Value').first();
    await formValInput.fill('{{test_val}}');

    // Send Request
    await page.locator('button', { hasText: 'Send' }).click();

    // Wait for response to load
    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 15000 });

    // In httpbin.org/post, the response JSON contains 'form' field
    // "form": { "form_var": "hello_world" }
    await expect(page.locator('pre')).toContainText('"form_var": "hello_world"');

    // 13. Cleanup
    await page.getByTitle('Environments').click();
    page.on('dialog', dialog => dialog.accept());
    await page.locator('div.group').filter({ hasText: envName }).locator('button', { hasText: 'Delete' }).click({ force: true });
  });
});
