-- Add YouTube paying channel member count (requires channel-memberships.creator OAuth scope)
ALTER TABLE "content_creators" ADD COLUMN "youtube_member_count" INTEGER;
