import { Pool } from 'pg';

const getDirectUrl = (): string | undefined => {
    if (process.env.DIRECT_URL) return process.env.DIRECT_URL;

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        // Parse project ref and password from pooler URL
        // e.g. postgresql://postgres.ref:password@host:port/db
        const match = dbUrl.match(/postgresql:\/\/postgres\.([^:]+):([^@]+)@/);
        if (match) {
            const projectRef = match[1];
            const password = match[2];
            const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
            console.log(`[Database] Dynamically resolved direct connection host for ref: ${projectRef}`);
            return directUrl;
        }
    }
    return dbUrl; // Fallback
};

const directUrl = getDirectUrl();

if (!directUrl) {
    console.error('❌ Missing DIRECT_URL or DATABASE_URL environment variables!');
}

export const pgPool = new Pool({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
});

export default pgPool;
