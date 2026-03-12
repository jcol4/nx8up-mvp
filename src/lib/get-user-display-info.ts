import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export type UserDisplayInfo = {
  displayName: string | null;
  username: string | null;
  imageUrl: string | null;
};

export async function getUserDisplayInfo(): Promise<UserDisplayInfo> {
  const { userId } = await auth();
  if (!userId) return { displayName: null, username: null, imageUrl: null };
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = user.publicMetadata as Record<string, unknown> | null;
  return {
    displayName: (meta?.displayName as string) ?? null,
    username: user.username ?? user.firstName ?? null,
    imageUrl: user.imageUrl || null,
  };
}
