import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Debug: Log DATABASE_URL (without exposing the full URL)
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set:', process.env.DATABASE_URL.substring(0, 20) + '...')
} else {
    console.error('DATABASE_URL is not set!')
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('JWT')))
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
