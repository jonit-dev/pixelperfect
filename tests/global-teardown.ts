/**
 * Global teardown for Playwright tests
 * Runs after all tests complete to clean up orphaned test users
 */
import { cleanupOldTestUsers } from './helpers/test-user-reset';

async function globalTeardown() {
  console.log('\n🧹 Running global teardown - cleaning up test users...');

  try {
    const deletedCount = await cleanupOldTestUsers();
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} test users`);
    }
  } catch (error) {
    // Don't fail the test run if cleanup fails
    console.warn('⚠️ Failed to cleanup test users:', error);
  }
}

export default globalTeardown;
