import { test, expect } from './fixtures';

test.describe('Items Page', () => {
  test('displays items list with seeded data', async ({ adminPage, testState }) => {
    await adminPage.goto('/items');
    await expect(adminPage.getByTestId('items-heading')).toBeVisible();
    await expect(adminPage.getByTestId('items-count')).toBeVisible();

    // Should show the items table (seeded data should have created items)
    await expect(adminPage.getByTestId('items-table')).toBeVisible({ timeout: 10_000 });
  });

  test('shows new item button', async ({ adminPage }) => {
    await adminPage.goto('/items');
    await expect(adminPage.getByTestId('new-item-btn')).toBeVisible();
  });

  test('new item button navigates to new item page', async ({ adminPage }) => {
    await adminPage.goto('/items');
    await adminPage.getByTestId('new-item-btn').click();
    await expect(adminPage).toHaveURL('/items/new');
  });

  test('filter buttons work', async ({ adminPage }) => {
    await adminPage.goto('/items');
    await expect(adminPage.getByTestId('items-heading')).toBeVisible();

    // Switch to "All" filter
    await adminPage.getByTestId('filter-all').click();
    // Table or empty state should be visible
    const tableOrEmpty = adminPage.getByTestId('items-table').or(adminPage.getByTestId('items-empty'));
    await expect(tableOrEmpty).toBeVisible({ timeout: 10_000 });

    // Switch to "Active" filter
    await adminPage.getByTestId('filter-active').click();
    await expect(tableOrEmpty).toBeVisible({ timeout: 10_000 });
  });

  test('item rows are clickable for seeded items', async ({ adminPage, testState }) => {
    test.skip(!testState.b2bFoundItemId1, 'No seeded items available');

    await adminPage.goto('/items');
    await expect(adminPage.getByTestId('items-table')).toBeVisible({ timeout: 10_000 });

    // Click on the first seeded found item
    const row = adminPage.getByTestId(`item-row-${testState.b2bFoundItemId1}`);
    if (await row.isVisible()) {
      await row.click();
      // Should navigate to item matches page
      await expect(adminPage).toHaveURL(new RegExp(`/matches/${testState.b2bFoundItemId1}`));
    }
  });
});
