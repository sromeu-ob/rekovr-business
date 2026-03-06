import { test as base, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { STATE_FILE } from './helpers/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '.auth');

export type TestState = {
  orgId: string;
  c2cLostItemId1: string;
  c2cLostItemId2: string;
  b2bFoundItemId1: string;
  b2bFoundItemId2: string;
  matchId1: string | null;
  matchId2: string | null;
  matchStatus1: string | null;
  matchStatus2: string | null;
  timestamp: string;
};

type TestFixtures = {
  adminPage: Page;
  testState: TestState;
};

export const test = base.extend<TestFixtures>({
  /** Fresh browser context with B2B admin auth */
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'business-admin.json'),
    });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  /** Seeded test state from global.setup.ts */
  testState: async ({}, use) => {
    let state: TestState = {
      orgId: '',
      c2cLostItemId1: '',
      c2cLostItemId2: '',
      b2bFoundItemId1: '',
      b2bFoundItemId2: '',
      matchId1: null,
      matchId2: null,
      matchStatus1: null,
      matchStatus2: null,
      timestamp: '',
    };

    try {
      if (fs.existsSync(STATE_FILE)) {
        state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      }
    } catch {
      console.warn('Could not load test state — some tests may skip');
    }

    await use(state);
  },
});

export { expect };
