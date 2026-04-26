/**
 * UserProfileBlock — Clerk UserButton with role-aware profile links injected as menu items.
 * Admins see both creator and sponsor profile links; creators/sponsors see only their own.
 */
'use client'

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

function CreatorProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SponsorProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  );
}

type Props = {
  displayName: string | null;
  username: string | null;
  variant?: "creator" | "admin" | "sponsor";
  editProfileLink?: string;
  /** Role used to show only the relevant profile link (creator → Creator profile, sponsor → Sponsor profile, admin → both) */
  role?: string;
};

export default function UserProfileBlock({
  displayName,
  username,
  variant = "creator",
  editProfileLink,
  role,
}: Props) {
  const prefix = variant === "creator" ? "cr" : variant === "sponsor" ? "sp" : "dash";
  const name = displayName || username || (variant === "creator" ? "Creator" : variant === "sponsor" ? "Sponsor" : "Admin");
  const showCreatorProfile = role === "creator" || role === "admin";
  const showSponsorProfile = role === "sponsor" || role === "admin";

  return (
    <div className="flex items-center gap-2 pl-3 border-l border-white/10">
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-9 h-9 ring-2 ring-[#00c8ff]",
          },
        }}
      >
        <UserButton.MenuItems>
          {showCreatorProfile && (
            <UserButton.Link
              label="Creator profile"
              labelIcon={<CreatorProfileIcon />}
              href="/creator/profile"
            />
          )}
          {showSponsorProfile && (
            <UserButton.Link
              label="Sponsor profile"
              labelIcon={<SponsorProfileIcon />}
              href="/sponsor/profile"
            />
          )}
        </UserButton.MenuItems>
      </UserButton>
      {editProfileLink ? (
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
