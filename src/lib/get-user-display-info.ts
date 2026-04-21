/**
 * Server-side helper that fetches display information for the currently
 * authenticated user from Clerk. Used in nav/header components.
 * Returns null fields (not throws) when unauthenticated or on Clerk errors.
 */
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

/** Display fields for the signed-in user, used in nav and profile UI. */
export type UserDisplayInfo = {
  /** Custom display name from Clerk public metadata (set during onboarding). */
  displayName: string | null;
  /** Clerk username, falling back to firstName if username is not set. */
  username: string | null;
  /** Clerk profile image URL. */
  imageUrl: string | null;
};

/**
 * Returns display info for the current user.
 * Falls back to all-null on auth failure or Clerk API errors
 * so callers don't need to handle exceptions.
 */
export async function getUserDisplayInfo(): Promise<UserDisplayInfo> {
  const { userId } = await auth();
  if (!userId) return { displayName: null, username: null, imageUrl: null };
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.publicMetadata as Record<string, unknown> | null;
    return {
      displayName: (meta?.displayName as string) ?? null,
      username: user.username ?? user.firstName ?? null,
      imageUrl: user.imageUrl || null,
    };
  } catch {
    return { displayName: null, username: null, imageUrl: null };
  }
}
