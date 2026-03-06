import { test, expect } from './fixtures';

test.describe('New Item Page', () => {
  test('shows form with all fields', async ({ adminPage }) => {
    await adminPage.goto('/items/new');

    await expect(adminPage.getByTestId('item-title-input')).toBeVisible();
    await expect(adminPage.getByTestId('item-description-input')).toBeVisible();
    await expect(adminPage.getByTestId('map-container')).toBeVisible();
    await expect(adminPage.getByTestId('item-datetime-input')).toBeVisible();
    await expect(adminPage.getByTestId('publish-item-btn')).toBeVisible();
  });

  test('back button navigates to items list', async ({ adminPage }) => {
    await adminPage.goto('/items/new');
    await adminPage.getByTestId('back-btn').click();
    await expect(adminPage).toHaveURL('/items');
  });

  test('publish button is disabled without required fields', async ({ adminPage }) => {
    await adminPage.goto('/items/new');

    const publishBtn = adminPage.getByTestId('publish-item-btn');
    await expect(publishBtn).toBeDisabled();
  });

  test('can fill and submit a new item', async ({ adminPage }) => {
    await adminPage.goto('/items/new');

    // Fill title
    await adminPage.getByTestId('item-title-input').fill('[E2E] Playwright test item');
    // Fill description
    await adminPage.getByTestId('item-description-input').fill('This is an E2E test item created by Playwright');

    // Map should have set location automatically (org default location)
    // Wait a moment for the map to initialize
    await adminPage.waitForTimeout(2000);

    // Submit
    const publishBtn = adminPage.getByTestId('publish-item-btn');
    await expect(publishBtn).toBeEnabled({ timeout: 5_000 });
    await publishBtn.click();

    // Should show success screen
    await expect(adminPage.getByTestId('item-success')).toBeVisible({ timeout: 15_000 });
    await expect(adminPage.getByTestId('register-another-btn')).toBeVisible();
    await expect(adminPage.getByTestId('view-items-btn')).toBeVisible();
  });

  test('register another resets form', async ({ adminPage }) => {
    await adminPage.goto('/items/new');

    // Fill and submit
    await adminPage.getByTestId('item-title-input').fill('[E2E] Another test item');
    await adminPage.waitForTimeout(2000);

    const publishBtn = adminPage.getByTestId('publish-item-btn');
    await expect(publishBtn).toBeEnabled({ timeout: 5_000 });
    await publishBtn.click();

    await expect(adminPage.getByTestId('item-success')).toBeVisible({ timeout: 15_000 });

    // Click register another
    await adminPage.getByTestId('register-another-btn').click();

    // Should show empty form again
    await expect(adminPage.getByTestId('item-title-input')).toBeVisible();
    await expect(adminPage.getByTestId('item-title-input')).toHaveValue('');
  });

  test('view items button from success navigates to items', async ({ adminPage }) => {
    await adminPage.goto('/items/new');

    await adminPage.getByTestId('item-title-input').fill('[E2E] View items test');
    await adminPage.waitForTimeout(2000);

    const publishBtn = adminPage.getByTestId('publish-item-btn');
    await expect(publishBtn).toBeEnabled({ timeout: 5_000 });
    await publishBtn.click();

    await expect(adminPage.getByTestId('item-success')).toBeVisible({ timeout: 15_000 });

    await adminPage.getByTestId('view-items-btn').click();
    await expect(adminPage).toHaveURL('/items');
  });
});
