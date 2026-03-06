import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('displays all stat cards', async ({ adminPage }) => {
    await adminPage.goto('/');
    await expect(adminPage.getByTestId('dashboard-heading')).toBeVisible();

    await expect(adminPage.getByTestId('stat-found-items')).toBeVisible();
    await expect(adminPage.getByTestId('stat-matches')).toBeVisible();
    await expect(adminPage.getByTestId('stat-recovered')).toBeVisible();
    await expect(adminPage.getByTestId('stat-recovery-rate')).toBeVisible();
  });

  test('displays recent items and matches sections', async ({ adminPage }) => {
    await adminPage.goto('/');

    await expect(adminPage.getByTestId('recent-items')).toBeVisible();
    await expect(adminPage.getByTestId('recent-matches')).toBeVisible();
  });

  test('view all items button navigates to items page', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.getByTestId('view-all-items-btn').click();
    await expect(adminPage).toHaveURL('/items');
    await expect(adminPage.getByTestId('items-heading')).toBeVisible();
  });

  test('view all matches button navigates to matches page', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.getByTestId('view-all-matches-btn').click();
    await expect(adminPage).toHaveURL('/matches');
    await expect(adminPage.getByTestId('matches-heading')).toBeVisible();
  });

  test('stat cards show numeric values', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Each stat card should contain a number (even if 0)
    const foundItems = adminPage.getByTestId('stat-found-items');
    await expect(foundItems).toContainText(/\d+/);

    const matches = adminPage.getByTestId('stat-matches');
    await expect(matches).toContainText(/\d+/);
  });
});
