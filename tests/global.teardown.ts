import { test as teardown } from '@playwright/test';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanupTestData } from './helpers/db-cleanup';
import { STATE_FILE } from './helpers/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

teardown('cleanup E2E test data', async () => {
  console.log('\n=== E2E Teardown: Cleaning up test data ===\n');

  // Read saved item IDs from setup
  let itemIds: string[] = [];
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      itemIds = [
        state.c2cLostItemId1,
        state.c2cLostItemId2,
        state.b2bFoundItemId1,
        state.b2bFoundItemId2,
      ].filter(Boolean);
    }
  } catch {
    console.warn('  Could not read state file, cleaning by prefix only');
  }

  await cleanupTestData(itemIds);

  // Clean up state file
  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
  } catch {
    // ignore
  }

  console.log('\n=== E2E Teardown complete ===\n');
});
