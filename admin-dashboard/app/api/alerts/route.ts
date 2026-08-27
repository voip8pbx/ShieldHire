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

        const { data, error } = await supabaseAdmin
            .from('emergency_alerts')
            .select('*, users(name, email, contactNo)')
            .eq('status', 'OPEN')
            .order('createdAt', { ascending: false })
            .limit(50);

        if (error) throw error;

        const formatted = (data || []).map((alert: any) => {
            const f = camelCaseKeys(alert);
            if (alert.users) {
                f.user = camelCaseKeys(Array.isArray(alert.users) ? alert.users[0] : alert.users);
                delete f.users;
            }
            return f;
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json([], { status: 200 }); // Return empty array so AlertListener falls back gracefully
    }
}
