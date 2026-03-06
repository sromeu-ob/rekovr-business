import { test, expect } from './fixtures';

test.describe('Settings Page', () => {
  test('displays settings heading', async ({ adminPage }) => {
    await adminPage.goto('/settings');
    await expect(adminPage.getByTestId('settings-heading')).toBeVisible();
  });

  test('shows pickup QR settings', async ({ adminPage }) => {
    await adminPage.goto('/settings');

    await expect(adminPage.getByTestId('pickup-qr-toggle')).toBeVisible();
    await expect(adminPage.getByTestId('pickup-qr-expiry')).toBeVisible();
    await expect(adminPage.getByTestId('pickup-instructions')).toBeVisible();
  });

  test('shows operator visibility options', async ({ adminPage }) => {
    await adminPage.goto('/settings');

    await expect(adminPage.getByTestId('visibility-shared')).toBeVisible();
    await expect(adminPage.getByTestId('visibility-individual')).toBeVisible();
  });

  test('shows verification toggle', async ({ adminPage }) => {
    await adminPage.goto('/settings');
    await expect(adminPage.getByTestId('verification-toggle')).toBeVisible();
  });

  test('shows auto-accept toggle', async ({ adminPage }) => {
    await adminPage.goto('/settings');
    await expect(adminPage.getByTestId('auto-accept-toggle')).toBeVisible();
  });

  test('can modify pickup instructions', async ({ adminPage }) => {
    await adminPage.goto('/settings');

    const input = adminPage.getByTestId('pickup-instructions');
    await expect(input).toBeVisible();

    // Clear and type new value
    await input.clear();
    await input.fill('[E2E] Please go to reception desk');

    // The input should have the new value
    await expect(input).toHaveValue('[E2E] Please go to reception desk');
  });

  test('can modify QR expiry', async ({ adminPage }) => {
    await adminPage.goto('/settings');

    const input = adminPage.getByTestId('pickup-qr-expiry');
    await expect(input).toBeVisible();

    await input.clear();
    await input.fill('48');
    await expect(input).toHaveValue('48');
  });
});
