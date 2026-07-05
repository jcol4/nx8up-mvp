/**
 * Admin authorization — one place that knows how the admin role is encoded in Clerk
 * session claims (`metadata.role === 'admin'`).
 *
 * This predicate used to be re-typed at ~a dozen mutating surfaces: a copy-pasted
 * `assertAdmin()` in every admin server-action file, a copy-pasted `isAdmin()` in every
 * survey route, and inline `role !== 'admin'` checks in the verdict routes. Callers keep
 * their own failure convention (a server action throws or returns `{ error }`; a route
 * returns a 401/403) — only the "who counts as admin" knowledge is centralized here.
 *
 * Page-level guards (`if (role !== 'admin') redirect('/')` in Server Components) are left
 * alone: they're a different, already-uniform pattern and carry no drift risk.
 */
import { auth } from '@clerk/nextjs/server'

/** Anything shaped like Clerk session claims — the role lives under `metadata.role`. */
type ClaimsLike = { metadata?: unknown } | null | undefined

/** The caller's role as carried in session claims, or undefined if none. */
export function roleFromClaims(sessionClaims: ClaimsLike): string | undefined {
  return (sessionClaims?.metadata as { role?: string } | undefined)?.role
}

/** True when the given session claims carry the admin role. */
export function isAdmin(sessionClaims: ClaimsLike): boolean {
  return roleFromClaims(sessionClaims) === 'admin'
}

/** Resolves the current caller's role from Clerk (server-side). */
export async function getSessionRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth()
  return roleFromClaims(sessionClaims)
}

/**
 * Throws `Error('Unauthorized')` unless the current caller is an admin. For admin server
 * actions — callers that let it propagate get a thrown error; callers that want a
 * `{ error }` result wrap it in try/catch, exactly as before.
 */
export async function requireAdmin(): Promise<void> {
  if ((await getSessionRole()) !== 'admin') throw new Error('Unauthorized')
}
