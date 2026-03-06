import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ApiClient } from './helpers/api-client';
import { makeLostItem, makeFoundItem, makeLostItem2, makeFoundItem2 } from './helpers/seed-data';
import { waitForMatch } from './helpers/wait-for-match';
import { ensureTestInfrastructure, cleanupTestData } from './helpers/db-cleanup';
import {
  BIZ_ADMIN_EMAIL,
  BIZ_ADMIN_PASSWORD,
  BIZ_ORG_NAME,
  C2C_USER_EMAIL,
  C2C_USER_PASSWORD,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  STATE_FILE,
  AUTH_DIR,
} from './helpers/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const adminAuthFile = path.join(AUTH_DIR, 'business-admin.json');

// ── Step 1: Ensure test infrastructure + seed data via API ─────────

setup('seed test data', async () => {
  setup.setTimeout(120_000);

  console.log('\n=== E2E Setup: Preparing test infrastructure ===');

  // 1. Clean up any leftover E2E data from previous runs
  console.log('\n1. Cleaning up leftover E2E data...');
  await cleanupTestData([]);

  // 2. Ensure test users and org exist in DB
  console.log('\n2. Ensuring test users and org exist...');
  const infra = await ensureTestInfrastructure({
    adminEmail: ADMIN_EMAIL,
    adminPassword: ADMIN_PASSWORD,
    bizAdminEmail: BIZ_ADMIN_EMAIL,
    bizAdminPassword: BIZ_ADMIN_PASSWORD,
    c2cEmail: C2C_USER_EMAIL,
    c2cPassword: C2C_USER_PASSWORD,
    orgName: BIZ_ORG_NAME,
  });
  console.log(`  Org ID: ${infra.orgId}`);

  // 3. Login as C2C user and create a lost item
  console.log('\n3. Creating C2C lost items...');
  const c2cClient = new ApiClient();
  await c2cClient.loginC2C(C2C_USER_EMAIL, C2C_USER_PASSWORD);

  const lostItem1 = await c2cClient.createC2CItem(makeLostItem());
  console.log(`  Created lost item 1: ${lostItem1.item_id}`);

  const lostItem2 = await c2cClient.createC2CItem(makeLostItem2());
  console.log(`  Created lost item 2: ${lostItem2.item_id}`);

  // 4. Login as B2B admin and create found items
  console.log('\n4. Creating B2B found items...');
  const bizClient = new ApiClient();
  await bizClient.loginBusiness(BIZ_ADMIN_EMAIL, BIZ_ADMIN_PASSWORD, infra.orgId);

  const foundItem1 = await bizClient.createBusinessItem(makeFoundItem());
  console.log(`  Created found item 1: ${foundItem1.item_id}`);

  const foundItem2 = await bizClient.createBusinessItem(makeFoundItem2());
  console.log(`  Created found item 2: ${foundItem2.item_id}`);

  // 5. Wait for automatic matching
  console.log('\n5. Waiting for automatic matching...');
  let match1: any = null;
  let match2: any = null;

  try {
    match1 = await waitForMatch(bizClient, foundItem1.item_id, 60_000);
    console.log(`  Match 1: ${match1.match_id} (score: ${match1.score}, status: ${match1.status})`);
  } catch (err) {
    console.warn(`  ⚠ Match 1 not found (matching may be slow or AI unavailable)`);
  }

  try {
    match2 = await waitForMatch(bizClient, foundItem2.item_id, 30_000);
    console.log(`  Match 2: ${match2.match_id} (score: ${match2.score}, status: ${match2.status})`);
  } catch (err) {
    console.warn(`  ⚠ Match 2 not found`);
  }

  // 6. Save state for test suites
  const state = {
    orgId: infra.orgId,
    c2cLostItemId1: lostItem1.item_id,
    c2cLostItemId2: lostItem2.item_id,
    b2bFoundItemId1: foundItem1.item_id,
    b2bFoundItemId2: foundItem2.item_id,
    matchId1: match1?.match_id || null,
    matchId2: match2?.match_id || null,
    matchStatus1: match1?.status || null,
    matchStatus2: match2?.status || null,
    timestamp: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log(`\n  State saved to ${STATE_FILE}`);

  console.log('\n=== E2E Setup complete ===\n');
});

// ── Step 2: Authenticate B2B admin via browser ─────────────────────

setup('authenticate B2B admin', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(BIZ_ADMIN_EMAIL);
  await page.getByTestId('login-password-input').fill(BIZ_ADMIN_PASSWORD);
  await page.getByTestId('login-submit-btn').click();

  // Wait for redirect to dashboard (URL will be http://localhost:3002/)
  // Wait for redirect to dashboard
  await expect(page.getByTestId('dashboard-heading')).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: adminAuthFile });
  console.log('  B2B admin session saved');
});
