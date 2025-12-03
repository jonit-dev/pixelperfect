#!/usr/bin/env tsx
/**
 * Cleanup script to remove old test users from the database
 * Run with: npx tsx scripts/cleanup-test-users.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { cleanupOldTestUsers } from '../tests/helpers/test-user-reset';

// Load environment variables from .env.test, .env.api, and .env.client
config({ path: resolve(process.cwd(), '.env.test') });
config({ path: resolve(process.cwd(), '.env.api') });
config({ path: resolve(process.cwd(), '.env.client') });

async function main() {
  console.log('🧹 Cleaning up old test users...');

  try {
    const deletedCount = await cleanupOldTestUsers();
    console.log(`✅ Successfully deleted ${deletedCount} test users`);

    if (deletedCount === 0) {
      console.log('No test users found to clean up');
    }
  } catch (error) {
    console.error('❌ Failed to cleanup test users:', error);
    process.exit(1);
  }
}

main();
