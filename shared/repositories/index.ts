// Base repository
export { BaseRepository, RepositoryError } from './base.repository';
export type { IBaseRepository, IPaginationOptions, IPaginatedResult } from './base.repository';

// User repository
export type { IUserRepository } from './user.repository';
export { UserRepository } from './user.repository';
export type {
  IUserProfileDB,
  ICreateUserProfile,
  IUpdateUserProfile,
  ICreditBalance,
} from './user.repository';

// Subscription repository
export type { ISubscriptionRepository } from './subscription.repository';
export { SubscriptionRepository } from './subscription.repository';
export type {
  ISubscriptionDB,
  ICreateSubscription,
  IUpdateSubscription,
  ISubscriptionStats,
} from './subscription.repository';

// Factory function to create repositories with a Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
import { UserRepository } from './user.repository';
import { SubscriptionRepository } from './subscription.repository';

export function createRepositories(supabase: SupabaseClient): {
  user: UserRepository;
  subscription: SubscriptionRepository;
} {
  return {
    user: new UserRepository(supabase),
    subscription: new SubscriptionRepository(supabase),
  };
}

// Export types for the repository collection
export type IRepositoryCollection = ReturnType<typeof createRepositories>;
