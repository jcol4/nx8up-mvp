/**
 * AES-256-GCM encryption for OAuth tokens stored at rest (e.g. Twitch/YouTube refresh tokens).
 *
 * Encrypted format: base64(iv) + ":" + base64(authTag) + ":" + base64(ciphertext)
 * The auth tag provides tamper detection — decryption fails if the ciphertext is modified.
 *
 * Required env var: TOKEN_ENCRYPTION_KEY — a base64-encoded 32-byte key.
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32   // bytes (256 bits)
const IV_LENGTH = 12    // bytes (96-bit IV is GCM standard)
const AUTH_TAG_LENGTH = 16  // bytes (128-bit auth tag)

/** Reads and validates TOKEN_ENCRYPTION_KEY from env, throwing if absent or wrong length. */
function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY is not set in environment variables')
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64-encoded). Got ${buf.length} bytes.`)
  }
  return buf
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a base64 string in the format: iv:authTag:ciphertext
 */
export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Decrypts a string produced by encryptToken.
 * Returns null if decryption fails (token is invalid or key has changed).
 */
export function decryptToken(encrypted: string): string | null {
  try {
    const key = getKey()
    const [ivB64, authTagB64, ciphertextB64] = encrypted.split(':')
    if (!ivB64 || !authTagB64 || !ciphertextB64) return null
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    const ciphertext = Buffer.from(ciphertextB64, 'base64')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}