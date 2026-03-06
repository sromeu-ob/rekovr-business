import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// B2B test user (org admin)
export const BIZ_ADMIN_EMAIL = process.env.TEST_BIZ_ADMIN_EMAIL!;
export const BIZ_ADMIN_PASSWORD = process.env.TEST_BIZ_ADMIN_PASSWORD!;
export const BIZ_ORG_NAME = process.env.TEST_BIZ_ORG_NAME || '[E2E] Test Airport';

// C2C test user (creates lost items)
export const C2C_USER_EMAIL = process.env.TEST_C2C_USER_EMAIL!;
export const C2C_USER_PASSWORD = process.env.TEST_C2C_USER_PASSWORD!;

// Platform admin
export const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL!;
export const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD!;

// URLs
export const API_URL = process.env.API_URL || 'https://api.rekovr.ai';
export const BIZ_FRONTEND_URL = process.env.BIZ_FRONTEND_URL || 'https://business.rekovr.ai';

// MongoDB
export const MONGODB_URI = process.env.MONGODB_URI!;
export const MONGODB_DB = process.env.MONGODB_DB || 'rekovr_database';

// Test location (Barcelona center)
export const TEST_LOCATION = {
  latitude: 41.3851,
  longitude: 2.1734,
  address: 'Passeig de Gràcia, Barcelona',
};

// E2E prefix for test data identification
export const E2E_PREFIX = '[E2E]';

// State file path
export const STATE_FILE = path.resolve(__dirname, '../.test-state.json');
export const AUTH_DIR = path.resolve(__dirname, '../.auth');
