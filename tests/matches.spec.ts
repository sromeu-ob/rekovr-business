import { test, expect } from './fixtures';

test.describe('Matches Page', () => {
  test('displays matches heading', async ({ adminPage }) => {
    await adminPage.goto('/matches');
    await expect(adminPage.getByTestId('matches-heading')).toBeVisible();
  });

  test('shows filter buttons', async ({ adminPage }) => {
    await adminPage.goto('/matches');
    await expect(adminPage.getByTestId('filter-pending')).toBeVisible();
    await expect(adminPage.getByTestId('filter-all')).toBeVisible();
  });

  test('filter toggle works', async ({ adminPage }) => {
    await adminPage.goto('/matches');

    // Switch to all
    await adminPage.getByTestId('filter-all').click();
    await adminPage.waitForTimeout(1000);

    // Switch back to pending
    await adminPage.getByTestId('filter-pending').click();
    await adminPage.waitForTimeout(1000);

    // Page should still be visible
    await expect(adminPage.getByTestId('matches-heading')).toBeVisible();
  });

  test('shows match items when seeded data has matches', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId1, 'No matches were created during setup');

    await adminPage.goto('/matches');
    await adminPage.getByTestId('filter-all').click();

    // Should show at least one match item
    const matchItem = adminPage.getByTestId(`match-item-${testState.b2bFoundItemId1}`);
    await expect(matchItem).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a match item navigates to item matches', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId1, 'No matches were created during setup');

    await adminPage.goto('/matches');
    await adminPage.getByTestId('filter-all').click();

    const matchItem = adminPage.getByTestId(`match-item-${testState.b2bFoundItemId1}`);
    await expect(matchItem).toBeVisible({ timeout: 10_000 });
    await matchItem.click();

    await expect(adminPage).toHaveURL(new RegExp(`/matches/${testState.b2bFoundItemId1}`));
    await expect(adminPage.getByTestId('item-matches-heading')).toBeVisible();
  });
});
