/**
 * Edge Runtime Compatible Crypto Utilities
 *
 * Uses Web Crypto API for compatibility with Cloudflare Workers
 * and other edge environments (10ms CPU limit friendly).
 */

/**
 * Create a SHA-256 hash of a string.
 * Uses Web Crypto API (Edge Runtime compatible).
 *
 * @param input - The string to hash
 * @returns SHA-256 hash as hex string
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash an email address for analytics/privacy purposes.
 * Normalizes email (lowercase, trimmed) before hashing.
 *
 * @param email - The email address to hash
 * @returns SHA-256 hash of the normalized email
 * @throws Error if email is invalid
 */
export async function hashEmail(email: string): Promise<string> {
  if (!email || typeof email !== 'string') {
    throw new Error('Valid email string is required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  return sha256(normalizedEmail);
}
