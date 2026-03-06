import { test, expect } from './fixtures';

test.describe('Team Page', () => {
  test('displays team heading', async ({ adminPage }) => {
    await adminPage.goto('/team');
    await expect(adminPage.getByTestId('team-heading')).toBeVisible();
  });

  test('shows invite member button for admin', async ({ adminPage }) => {
    await adminPage.goto('/team');
    await expect(adminPage.getByTestId('invite-member-btn')).toBeVisible();
  });

  test('clicking invite opens form', async ({ adminPage }) => {
    await adminPage.goto('/team');
    await adminPage.getByTestId('invite-member-btn').click();

    await expect(adminPage.getByTestId('invite-name-input')).toBeVisible();
    await expect(adminPage.getByTestId('invite-email-input')).toBeVisible();
    await expect(adminPage.getByTestId('invite-role-operator')).toBeVisible();
    await expect(adminPage.getByTestId('invite-role-admin')).toBeVisible();
    await expect(adminPage.getByTestId('send-invite-btn')).toBeVisible();
  });

  test('can toggle role selection in invite form', async ({ adminPage }) => {
    await adminPage.goto('/team');
    await adminPage.getByTestId('invite-member-btn').click();

    // Default is operator
    const operatorBtn = adminPage.getByTestId('invite-role-operator');
    const adminBtn = adminPage.getByTestId('invite-role-admin');

    // Switch to admin
    await adminBtn.click();
    await expect(adminBtn).toHaveClass(/bg-zinc-900/);

    // Switch back to operator
    await operatorBtn.click();
    await expect(operatorBtn).toHaveClass(/bg-zinc-900/);
  });

  test('closing invite form toggles visibility', async ({ adminPage }) => {
    await adminPage.goto('/team');

    // Open
    await adminPage.getByTestId('invite-member-btn').click();
    await expect(adminPage.getByTestId('invite-name-input')).toBeVisible();

    // Close (clicking same button toggles)
    await adminPage.getByTestId('invite-member-btn').click();
    await expect(adminPage.getByTestId('invite-name-input')).not.toBeVisible();
  });
});
