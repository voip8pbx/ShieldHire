import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    const newObj: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z0-9])/g, (_: string, g: string) => g.toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
};

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        if (!cookieStore.get('admin_token')?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('clients')
            .select('*, users(name, email)')
            .order('createdAt', { ascending: false });

        if (status) query = query.eq('verificationStatus', status.toUpperCase()) as any;

        const { data, error } = await query;
        if (error) throw error;

        const formatted = (data || []).map((c: any) => {
            const f = camelCaseKeys(c);
            if (c.users) {
                f.user = camelCaseKeys(Array.isArray(c.users) ? c.users[0] : c.users);
                delete f.users;
            }
            return f;
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching client verifications:', error);
        return NextResponse.json({ error: 'Failed to fetch client verifications' }, { status: 500 });
    }
}
