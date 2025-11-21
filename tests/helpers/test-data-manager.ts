import { createClient } from '@supabase/supabase-js';

export interface ITestUser {
  id: string;
  email: string;
  token: string;
}

export class TestDataManager {
  private supabase: ReturnType<typeof createClient>;
  private createdUsers: string[] = [];

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Creates a fresh test user with authentication using admin API
   */
  async createTestUser(
    overrides?: Partial<{ email: string; password: string }>
  ): Promise<ITestUser> {
    const testEmail =
      overrides?.email ||
      `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.local`;
    const testPassword = overrides?.password || 'test-password-123';

    // Use admin API to create user (bypasses email validation and confirmation)
    const { data: adminData, error: adminError } = await this.supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (adminError) {
      throw new Error(`Failed to create test user: ${adminError.message}`);
    }

    if (!adminData.user) {
      throw new Error('Failed to create test user: No user returned');
    }

    // Sign in to get a session token
    const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    if (!signInData.session) {
      throw new Error('Failed to sign in test user: No session returned');
    }

    this.createdUsers.push(adminData.user.id);
    return {
      id: adminData.user.id,
      email: adminData.user.email!,
      token: signInData.session.access_token,
    };
  }

  /**
   * Sets subscription status for a user directly in the database
   */
  async setSubscriptionStatus(
    userId: string,
    status: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled',
    tier?: 'starter' | 'pro' | 'business',
    subscriptionId?: string
  ): Promise<void> {
    // 'free' means no subscription, so use NULL for subscription_status
    const dbStatus = status === 'free' ? null : status;
    const dbTier = status === 'free' ? null : tier;

    const updateData: Record<string, unknown> = {
      subscription_status: dbStatus,
      subscription_tier: dbTier,
      updated_at: new Date().toISOString(),
    };

    // Update profile
    const { error: profileError } = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update subscription status: ${profileError.message}`);
    }

    // If subscription ID is provided, try to create/update subscription record
    // Note: May fail due to RLS policies, which is acceptable for test setup
    if (subscriptionId && status !== 'free') {
      const subscriptionData = {
        id: subscriptionId,
        user_id: userId,
        status: status === 'active' ? 'active' : status,
        price_id: 'price_test_pro_monthly', // Mock price ID
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };

      const { error: subError } = await this.supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'id' });

      if (subError) {
        // Log but don't fail - profile was updated, subscription record is secondary
        console.warn(
          `Could not create subscription record (RLS policy may prevent this): ${subError.message}`
        );
      }
    } else if (status === 'free') {
      // Try to remove subscription records for free users
      const { error: deleteError } = await this.supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.warn(
          `Could not delete subscription record (RLS policy may prevent this): ${deleteError.message}`
        );
      }
    }
  }

  /**
   * Adds credits to a user's balance and optionally creates a transaction record
   * Note: Transaction record creation may fail due to RLS policies, which is acceptable for test setup
   */
  async addCredits(
    userId: string,
    amount: number,
    type: 'purchase' | 'bonus' = 'purchase'
  ): Promise<void> {
    // First, get current balance
    const { data: profile, error: fetchError } = await this.supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current credits: ${fetchError.message}`);
    }

    const newBalance = (profile?.credits_balance || 0) + amount;

    // Update balance
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({
        credits_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    // Try to create transaction record - may fail due to RLS, which is acceptable for test setup
    const { error: transactionError } = await this.supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      type: type,
      reference_id: `test_${Date.now()}`,
      description: `Test ${type} credits`,
    });

    if (transactionError) {
      // Log but don't fail - the credit balance was updated, transaction logging is secondary
      console.warn(
        `Could not create credit transaction (RLS policy may prevent this): ${transactionError.message}`
      );
    }
  }

  /**
   * Gets current user profile data
   */
  async getUserProfile(userId: string): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Gets user's credit transactions
   */
  async getCreditTransactions(userId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch credit transactions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Gets user's subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cleans up a test user and all their data
   */
  async cleanupUser(userId: string): Promise<void> {
    try {
      // Delete auth user (this will cascade to profiles due to ON DELETE CASCADE)
      await this.supabase.auth.admin.deleteUser(userId);

      // Remove from created users tracking
      this.createdUsers = this.createdUsers.filter(id => id !== userId);
    } catch (error) {
      console.warn(`Failed to cleanup test user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Cleans up all created test users
   */
  async cleanupAllUsers(): Promise<void> {
    const cleanupPromises = this.createdUsers.map(userId => this.cleanupUser(userId));
    await Promise.allSettled(cleanupPromises);
    this.createdUsers = [];
  }

  /**
   * Creates a user with specific subscription state for testing
   */
  async createTestUserWithSubscription(
    status: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled',
    tier?: 'starter' | 'pro' | 'business',
    initialCredits: number = 10
  ): Promise<ITestUser> {
    const user = await this.createTestUser();

    // Set initial credits
    if (initialCredits !== 10) {
      await this.addCredits(user.id, initialCredits - 10, 'bonus');
    }

    // Set subscription status
    await this.setSubscriptionStatus(
      user.id,
      status,
      tier,
      status !== 'free' ? `sub_test_${user.id}` : undefined
    );

    return user;
  }
}
