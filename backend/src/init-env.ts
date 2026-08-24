import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(__dirname, '../../.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // In Vercel, env vars are provided directly, so .env file might not exist
    dotenv.config();
}

// Strictly verify JWT_SECRET in production to prevent fallback keys
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('[CRITICAL ERROR] JWT_SECRET is not configured in production environment! Crashing startup to prevent default secret exploit.');
    process.exit(1);
}

