import { supabaseAdmin } from '@server/supabase/supabaseAdmin';
import { InsufficientCreditsError } from '../../image-generation.service';

/**
 * Result of a credit operation
 */
export interface ICreditOperationResult {
  success: boolean;
  newBalance: number;
  jobId: string;
}

/**
 * Credit Manager for Replicate Service
 *
 * Handles credit deduction and refund operations atomically
 */
export class CreditManager {
  /**
   * Deduct credits before processing
   *
   * @param userId - The user ID
   * @param amount - The amount of credits to deduct
   * @param provider - The provider name for description
   * @returns The new balance and job ID
   * @throws InsufficientCreditsError if user has insufficient credits
   * @throws Error if Supabase RPC call fails
   */
  async deductCredits(
    userId: string,
    amount: number,
    provider: string = 'Replicate'
  ): Promise<{ newBalance: number; jobId: string }> {
    const jobId = this.generateJobId(provider);

    const { data: balanceResult, error: creditError } = await supabaseAdmin.rpc(
      'consume_credits_v2',
      {
        target_user_id: userId,
        amount,
        ref_id: jobId,
        description: `Image processing via ${provider} (${amount} credits)`,
      }
    );

    if (creditError) {
      if (creditError.message?.includes('Insufficient credits')) {
        throw new InsufficientCreditsError(creditError.message);
      }
      throw new Error(`Failed to deduct credits: ${creditError.message}`);
    }

    // Extract total balance from result (returns array with single row)
    const newBalance = balanceResult?.[0]?.new_total_balance ?? 0;

    return { newBalance, jobId };
  }

  /**
   * Refund credits on processing failure
   *
   * @param userId - The user ID
   * @param jobId - The job ID from credit deduction
   * @param amount - The amount of credits to refund
   */
  async refundCredits(userId: string, jobId: string, amount: number): Promise<void> {
    const { error } = await supabaseAdmin.rpc('refund_credits', {
      target_user_id: userId,
      amount,
      job_id: jobId,
    });

    if (error) {
      console.error('Failed to refund credits:', error);
    }
  }

  /**
   * Generate a unique job ID for credit tracking
   *
   * @param provider - The provider name (prefix)
   * @returns A unique job ID
   */
  private generateJobId(provider: string): string {
    const prefix = provider.toLowerCase().slice(0, 3); // First 3 chars of provider
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/**
 * Singleton instance for convenience
 */
export const creditManager = new CreditManager();
