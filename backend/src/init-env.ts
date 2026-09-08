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

if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET not configured in environment, using fallback production secret key.');
    process.env.JWT_SECRET = 'a2d8e642a02f402057c88071bdd4b7e6941678ce6b1f4fe3906c161d6549c559';
}

