/**
 * Build DATABASE_URL from individual environment variables
 */
export function buildDatabaseUrl(): string {
    const host = process.env.DATABASE_HOST;
    const name = process.env.DATABASE_NAME;
    const username = process.env.DATABASE_USERNAME;
    const password = process.env.DATABASE_PASSWORD;
    const port = process.env.DATABASE_PORT || '5432';

    if (!host || !name || !username || !password) {
        throw new Error('Missing required database environment variables');
    }

    return `postgresql://${username}:${password}@${host}:${port}/${name}`;
}

/**
 * Set DATABASE_URL environment variable if not already set
 */
export function setupDatabaseUrl(): void {
    if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = buildDatabaseUrl();
    }
}
