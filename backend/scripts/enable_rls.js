require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

async function run() {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Missing DIRECT_URL or DATABASE_URL in .env");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL successfully!");

        // 1. Enable RLS on the tables
        console.log("Enabling RLS on tables...");
        await client.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
        await client.query('ALTER TABLE clients ENABLE ROW LEVEL SECURITY;');
        await client.query('ALTER TABLE bouncers ENABLE ROW LEVEL SECURITY;');
        await client.query('ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;');

        // 2. Drop existing policies to avoid duplicates
        console.log("Dropping existing policies...");
        const dropPolicies = [
            'DROP POLICY IF EXISTS "Users can read own record" ON users;',
            'DROP POLICY IF EXISTS "Users can update own record" ON users;',
            'DROP POLICY IF EXISTS "Clients can read own profile" ON clients;',
            'DROP POLICY IF EXISTS "Clients can insert own profile" ON clients;',
            'DROP POLICY IF EXISTS "Clients can update own profile" ON clients;',
            'DROP POLICY IF EXISTS "Bouncers can read approved or own profile" ON bouncers;',
            'DROP POLICY IF EXISTS "Bouncers can insert own profile" ON bouncers;',
            'DROP POLICY IF EXISTS "Bouncers can update own profile" ON bouncers;',
            'DROP POLICY IF EXISTS "Users can read own bookings" ON bookings;',
            'DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;',
            'DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;'
        ];
        for (const sql of dropPolicies) {
            await client.query(sql).catch(e => console.warn(`Policy drop warning: ${e.message}`));
        }

        // 3. Create RLS policies
        console.log("Creating RLS policies...");
        
        // Users policies
        await client.query(`
            CREATE POLICY "Users can read own record" ON users
              FOR SELECT
              USING (auth.uid() = "authId" OR role = 'ADMIN');
        `);
        await client.query(`
            CREATE POLICY "Users can update own record" ON users
              FOR UPDATE
              USING (auth.uid() = "authId")
              WITH CHECK (auth.uid() = "authId");
        `);

        // Clients policies
        await client.query(`
            CREATE POLICY "Clients can read own profile" ON clients
              FOR SELECT
              USING ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId") OR "userId" IN (SELECT id FROM users WHERE role = 'ADMIN'));
        `);
        await client.query(`
            CREATE POLICY "Clients can insert own profile" ON clients
              FOR INSERT
              WITH CHECK ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"));
        `);
        await client.query(`
            CREATE POLICY "Clients can update own profile" ON clients
              FOR UPDATE
              USING ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"))
              WITH CHECK ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"));
        `);

        // Bouncers policies
        await client.query(`
            CREATE POLICY "Bouncers can read approved or own profile" ON bouncers
              FOR SELECT
              USING ("verificationStatus" = 'APPROVED' OR "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId") OR "userId" IN (SELECT id FROM users WHERE role = 'ADMIN'));
        `);
        await client.query(`
            CREATE POLICY "Bouncers can insert own profile" ON bouncers
              FOR INSERT
              WITH CHECK ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"));
        `);
        await client.query(`
            CREATE POLICY "Bouncers can update own profile" ON bouncers
              FOR UPDATE
              USING ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"))
              WITH CHECK ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"));
        `);

        // Bookings policies
        await client.query(`
            CREATE POLICY "Users can read own bookings" ON bookings
              FOR SELECT
              USING (
                "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId") OR
                "bouncerId" IN (SELECT id FROM bouncers WHERE "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId")) OR
                "userId" IN (SELECT id FROM users WHERE role = 'ADMIN')
              );
        `);
        await client.query(`
            CREATE POLICY "Users can insert own bookings" ON bookings
              FOR INSERT
              WITH CHECK ("userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"));
        `);
        await client.query(`
            CREATE POLICY "Users can update own bookings" ON bookings
              FOR UPDATE
              USING (
                "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId") OR
                "bouncerId" IN (SELECT id FROM bouncers WHERE "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"))
              )
              WITH CHECK (
                "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId") OR
                "bouncerId" IN (SELECT id FROM bouncers WHERE "userId" IN (SELECT id FROM users WHERE auth.uid() = "authId"))
              );
        `);

        // 4. Configure storage bucket if missing
        console.log("Configuring storage bucket and read access...");
        await client.query(`
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('bouncers', 'bouncers', true)
            ON CONFLICT (id) DO NOTHING;
        `).catch(e => console.warn(`Bucket config warning: ${e.message}`));
        
        await client.query('DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;').catch(e => {});
        await client.query(`
            CREATE POLICY "Public Read Access" ON storage.objects
              FOR SELECT
              USING (bucket_id = 'bouncers');
        `).catch(e => console.warn(`Storage policy creation warning: ${e.message}`));

        console.log("⚡ RLS and Storage Policies applied successfully!");
    } catch (err) {
        console.error("❌ Migration Error:", err.message);
    } finally {
        await client.end();
    }
}
run();
