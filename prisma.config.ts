import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
    // @ts-ignore - directUrl is supported by Prisma 7 but missing from type definitions
    directUrl: process.env.DIRECT_URL!,
  },
})
