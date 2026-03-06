import { test, expect } from '@playwright/test';
import { BIZ_ADMIN_EMAIL, BIZ_ADMIN_PASSWORD } from './helpers/constants';

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // no pre-auth

  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('redirects protected routes to login', async ({ page }) => {
    await page.goto('/items');
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('wrong@email.com');
    await page.getByTestId('login-password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 });
  });

  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(BIZ_ADMIN_EMAIL);
    await page.getByTestId('login-password-input').fill(BIZ_ADMIN_PASSWORD);
    await page.getByTestId('login-submit-btn').click();

    // Should redirect to dashboard
    await expect(page.getByTestId('dashboard-heading')).toBeVisible({ timeout: 15_000 });
  });
});
