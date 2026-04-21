/**
 * Prisma client singleton backed by the Neon serverless adapter.
 *
 * Uses the same globalThis caching pattern as stripe.ts: in development,
 * Next.js hot-reloads modules on every file save, which would create a new
 * PrismaClient (and open a new connection pool) on each reload. Pinning to
 * globalThis ensures only one client exists per process lifetime.
 * In production there is only one cold start, so the cache is skipped.
 *
 * Required env var: DATABASE_URL (Neon connection string)
 */
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma