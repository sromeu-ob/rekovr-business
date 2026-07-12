// Temporary visual-verification spec for the redesigned match card.
import { test, expect } from './fixtures';
import fs from 'fs';
import { STATE_FILE } from './helpers/constants';

const SHOT_DIR = '/private/tmp/claude-502/-Users-sergiromeu-Development-personal-rekovr/94d665a0-9a71-4b3e-8e3b-0ab529465d65/scratchpad';

test('capture redesigned match card', async ({ adminPage }) => {
  const testState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  test.skip(!testState.b2bFoundItemId1, 'no seeded found item');

  await adminPage.goto(`/matches/${testState.b2bFoundItemId1}`);
  await expect(adminPage.getByTestId('item-matches-heading')).toBeVisible();

  // Let match cards (if any) render
  await adminPage.waitForTimeout(1500);
  await adminPage.screenshot({ path: `${SHOT_DIR}/item-matches-redesign.png`, fullPage: true });
});
