// /**
//  * @file next.config.ts
//  * @description Next.js configuration for nx8up.
//  *
//  * Key settings:
//  * - allowedDevOrigins: permits cross-origin dev-server requests from the WSL2
//  *   host IP (172.30.226.88). This is needed when accessing the dev server from
//  *   Windows via the WSL2 virtual NIC. Remove or update when deploying.
//  * - serverActions.allowedOrigins: whitelists the same origins for Server Action
//  *   CSRF protection, which Next.js enforces via the Origin header check.
//  *
//  * Gotchas:
//  * - The hardcoded WSL2 IP (172.30.226.88) changes on WSL2 restart. Consider
//  *   reading it from an env var (e.g. NEXT_ALLOWED_ORIGIN) to avoid repeated edits.
//  * - No image domain allow-list is configured. If next/image is used with external
//  *   URLs (e.g. Twitch CDN, YouTube thumbnails), add remotePatterns here.
//  */
// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   // Allow dev-server requests from the WSL2 host machine's virtual NIC IP
//   allowedDevOrigins: ['172.30.226.88'],
//   experimental: {
//     serverActions: {
//       // Allow Server Actions to be invoked from localhost and the WSL2 host IP
//       allowedOrigins: ['localhost:3000', '172.30.226.88:3000'],
//     }
//   }
// };

// export default nextConfig;


/**
 * @file next.config.ts
 * @description Next.js configuration for nx8up.
 *
 * Key settings:
 * - allowedDevOrigins: permits cross-origin dev-server requests from the WSL2
 *   host IP (172.30.226.88). This is needed when accessing the dev server from
 *   Windows via the WSL2 virtual NIC. Remove or update when deploying.
 * - serverActions.allowedOrigins: whitelists the same origins for Server Action
 *   CSRF protection, which Next.js enforces via the Origin header check.
 * - images.remotePatterns: allow-list of external image hosts used with
 *   next/image. Add a new entry whenever a new external image source is used.
 *
 * Gotchas:
 * - The hardcoded WSL2 IP (172.30.226.88) changes on WSL2 restart. Consider
 *   reading it from an env var (e.g. NEXT_ALLOWED_ORIGIN) to avoid repeated edits.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev-server requests from the WSL2 host machine's virtual NIC IP
  allowedDevOrigins: ['172.30.226.88'],
  experimental: {
    serverActions: {
      // Allow Server Actions to be invoked from localhost and the WSL2 host IP
      allowedOrigins: ['localhost:3000', '172.30.226.88:3000'],
    }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Likely already-needed sources for Twitch/YouTube avatars and thumbnails:
      { protocol: 'https', hostname: 'static-cdn.jtvnw.net' },          // Twitch
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },     // YouTube avatars
      { protocol: 'https', hostname: 'i.ytimg.com' },                   // YouTube thumbnails
    ],
  },
};

export default nextConfig;