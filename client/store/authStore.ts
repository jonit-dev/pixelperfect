/**
 * Re-export from the refactored auth module.
 * This maintains backward compatibility with existing imports.
 */
export { useAuthStore, useIsAdmin } from './auth';
export type { IAuthState, IAuthUser } from './auth';
