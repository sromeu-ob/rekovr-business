import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('sidebar shows org name and user name', async ({ adminPage }) => {
    await adminPage.goto('/');
    await expect(adminPage.getByTestId('sidebar-org-name')).toBeVisible();
    await expect(adminPage.getByTestId('sidebar-user-name')).toBeVisible();
  });

  test('can navigate to all main pages', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Dashboard
    await adminPage.getByTestId('nav-/').click();
    await expect(adminPage.getByTestId('dashboard-heading')).toBeVisible();

    // Items
    await adminPage.getByTestId('nav-/items').click();
    await expect(adminPage.getByTestId('items-heading')).toBeVisible();

    // Matches
    await adminPage.getByTestId('nav-/matches').click();
    await expect(adminPage.getByTestId('matches-heading')).toBeVisible();

    // Team
    await adminPage.getByTestId('nav-/team').click();
    await expect(adminPage.getByTestId('team-heading')).toBeVisible();

    // Settings
    await adminPage.getByTestId('nav-/settings').click();
    await expect(adminPage.getByTestId('settings-heading')).toBeVisible();

    // Subscription
    await adminPage.getByTestId('nav-/subscription').click();
    await expect(adminPage.getByTestId('subscription-heading')).toBeVisible();
  });

  test('logout redirects to login', async ({ adminPage }) => {
    await adminPage.goto('/');
    await adminPage.getByTestId('logout-btn').click();
    await expect(adminPage.getByTestId('login-email-input')).toBeVisible({ timeout: 10_000 });
  });
});
