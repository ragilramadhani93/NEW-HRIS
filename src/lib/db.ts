import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  libsql: ReturnType<typeof createClient> | undefined
}

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN

// When using Turso adapter, Prisma still validates DATABASE_URL against the
// sqlite provider (requires file: protocol). Set a dummy value so validation
// passes — the actual connection goes through the LibSQL adapter.
if (tursoUrl && tursoAuthToken && (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:'))) {
  process.env.DATABASE_URL = 'file:./dev.db'
}

let prisma: PrismaClient

if (tursoUrl && tursoAuthToken) {
  // Use HTTPS protocol for better compatibility if not specified
  const url = tursoUrl.replace('libsql://', 'https://')

  const libsql = globalForPrisma.libsql ?? createClient({
    url: url,
    authToken: tursoAuthToken,
  })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.libsql = libsql

  console.log("Initializing Prisma with adapter (singleton)...");
  const adapter = new PrismaLibSQL(libsql)
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: adapter as any })
} else {
  console.log("Initializing Prisma with default SQLite...");
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query'],
  })
}

export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db