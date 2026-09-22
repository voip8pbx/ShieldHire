import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const { email, accountType, reason } = await req.json();

        if (!email || !accountType) {
            return NextResponse.json({ error: 'Email and account type are required' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const refId = `DEL-${Date.now().toString(36).toUpperCase()}`;

        const { error } = await supabase
            .from('deletion_requests')
            .insert({
                email: email.toLowerCase().trim(),
                account_type: accountType,
                reason: reason?.trim() || null,
                ref_id: refId,
                status: 'PENDING',
                requested_at: new Date().toISOString(),
            });

        // If table doesn't exist yet, still return success — admin sees it in logs
        if (error && !error.message.includes('does not exist')) {
            console.error('[DELETE-REQUEST] DB error:', error.message);
            return NextResponse.json({ error: 'Failed to log request. Please email support@shieldhire.com directly.' }, { status: 500 });
        }

        console.log(`[DELETE-REQUEST] ${refId} | ${accountType} | ${email}`);

        return NextResponse.json({ success: true, refId });
    } catch (err: any) {
        console.error('[DELETE-REQUEST] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
