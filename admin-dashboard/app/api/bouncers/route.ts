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

export async function GET() {
    try {
        const cookieStore = await cookies();
        if (!cookieStore.get('admin_token')?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin view — all bouncers regardless of status
        const { data, error } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email, profilePhoto)')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map((b: any) => {
            const f = camelCaseKeys(b);
            if (b.users) {
                f.user = camelCaseKeys(Array.isArray(b.users) ? b.users[0] : b.users);
                delete f.users;
            }
            return f;
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching bouncers:', error);
        return NextResponse.json({ error: 'Failed to fetch bouncers' }, { status: 500 });
    }
}
