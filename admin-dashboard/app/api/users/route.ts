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
            .from('users')
            .select('id, name, email, role, contactNo, age, profilePhoto, createdAt, updatedAt')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        return NextResponse.json((data || []).map(camelCaseKeys));
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
