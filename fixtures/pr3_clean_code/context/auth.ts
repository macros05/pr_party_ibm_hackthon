import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 * @param password Plain text password
 * @param hash Hashed password from database
 * @returns True if password matches
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure reset token
 * Uses crypto.randomBytes for true randomness
 * @returns 32-byte hex token (64 characters)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a reset token for secure storage
 * Uses bcrypt to prevent rainbow table attacks
 * Lower salt rounds than passwords since tokens are already random
 * @param token Plain text token
 * @returns Hashed token
 */
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Generate a JWT token for authenticated sessions
 * @param userId User ID to encode in token
 * @param expiresIn Token expiration time (e.g., '7d', '24h')
 * @returns JWT token string
 */
export function generateJWT(userId: number, expiresIn: string = '7d'): string {
  // Implementation would use jsonwebtoken library
  // Placeholder for context
  return `jwt_token_for_user_${userId}`;
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string
 * @returns Decoded user ID or null if invalid
 */
export function verifyJWT(token: string): number | null {
  // Implementation would use jsonwebtoken library
  // Placeholder for context
  return null;
}

// Made with Bob
