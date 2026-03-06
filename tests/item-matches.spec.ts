import { test, expect } from './fixtures';

test.describe('Item Matches Page', () => {
  test('shows found item detail and match candidates', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId1, 'No matches were created during setup');

    await adminPage.goto(`/matches/${testState.b2bFoundItemId1}`);

    await expect(adminPage.getByTestId('item-matches-heading')).toBeVisible();
    await expect(adminPage.getByTestId('found-item-detail')).toBeVisible();
  });

  test('shows filter buttons', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId1, 'No matches were created during setup');

    await adminPage.goto(`/matches/${testState.b2bFoundItemId1}`);

    await expect(adminPage.getByTestId('filter-active')).toBeVisible();
    await expect(adminPage.getByTestId('filter-all')).toBeVisible();
  });

  test('match card is visible with action buttons', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId1, 'No matches were created during setup');

    await adminPage.goto(`/matches/${testState.b2bFoundItemId1}`);

    // Wait for the match card to load
    const matchCard = adminPage.getByTestId(`match-card-${testState.matchId1}`);
    await expect(matchCard).toBeVisible({ timeout: 10_000 });

    // If match is in an actionable state, check buttons
    const status = testState.matchStatus1;
    if (status === 'pending' || status === 'pending_review') {
      await expect(adminPage.getByTestId(`accept-btn-${testState.matchId1}`)).toBeVisible();
      await expect(adminPage.getByTestId(`reject-btn-${testState.matchId1}`)).toBeVisible();
    }
  });

  test('can switch between active and all filters', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId1, 'No matches were created during setup');

    await adminPage.goto(`/matches/${testState.b2bFoundItemId1}`);
    await expect(adminPage.getByTestId('item-matches-heading')).toBeVisible();

    // Switch to all
    await adminPage.getByTestId('filter-all').click();
    await adminPage.waitForTimeout(1000);

    // Match card should be visible
    const matchCard = adminPage.getByTestId(`match-card-${testState.matchId1}`);
    await expect(matchCard).toBeVisible({ timeout: 10_000 });
  });

  test('can reject a match from the second item', async ({ adminPage, testState }) => {
    test.skip(!testState.matchId2, 'No second match available');
    const status = testState.matchStatus2;
    test.skip(
      status !== 'pending' && status !== 'pending_review',
      `Match2 is in '${status}' state, not actionable`,
    );

    await adminPage.goto(`/matches/${testState.b2bFoundItemId2}`);

    const rejectBtn = adminPage.getByTestId(`reject-btn-${testState.matchId2}`);
    await expect(rejectBtn).toBeVisible({ timeout: 10_000 });
    await rejectBtn.click();

    // Match card should now show rejected status
    await expect(
      adminPage.getByTestId(`match-card-${testState.matchId2}`).getByText('Rejected'),
    ).toBeVisible({ timeout: 10_000 });
  });
});
