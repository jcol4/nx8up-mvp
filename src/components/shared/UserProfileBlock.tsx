import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type Props = {
  displayName: string | null;
  username: string | null;
  /** Use "creator" for creator dashboard, "admin" for admin dashboard */
  variant?: "creator" | "admin";
  editProfileLink?: string;
};

export default function UserProfileBlock({
  displayName,
  username,
  variant = "creator",
  editProfileLink,
}: Props) {
  const prefix = variant === "creator" ? "cr" : "dash";
  const name = displayName || username || (variant === "creator" ? "Creator" : "Admin");

  return (
    <div className="flex items-center gap-2 pl-3 border-l border-white/10">
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-9 h-9 ring-2 ring-[#00c8ff]",
          },
        }}
      />
      {variant === "creator" && editProfileLink ? (
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white">{name}</p>
          <Link href={editProfileLink} className={`text-xs ${prefix}-accent hover:underline`}>
            Edit profile →
          </Link>
        </div>
      ) : (
        <span className={`text-sm ${prefix}-text-bright hidden sm:block`}>{name}</span>
      )}
    </div>
  );
}
