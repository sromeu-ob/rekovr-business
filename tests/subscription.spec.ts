import { test, expect } from './fixtures';

test.describe('Subscription Page', () => {
  test('displays subscription heading', async ({ adminPage }) => {
    await adminPage.goto('/subscription');
    await expect(adminPage.getByTestId('subscription-heading')).toBeVisible();
  });

  test('shows plan and status', async ({ adminPage }) => {
    await adminPage.goto('/subscription');
    await expect(adminPage.getByTestId('subscription-plan')).toBeVisible();
    await expect(adminPage.getByTestId('subscription-status')).toBeVisible();
  });

  test('plan shows correct text', async ({ adminPage }) => {
    await adminPage.goto('/subscription');
    // Should contain "Plan" text
    await expect(adminPage.getByTestId('subscription-plan')).toContainText('Plan');
  });
});
