import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// DB uses a mix of camelCase (legacy) and snake_case (new fields).
// We map frontend camelCase to DB fields explicitly.
const mapToDB = (obj: any) => {
    const dbObj: any = { ...obj };
    const mappings: Record<string, string> = {
        profileImageUrl: 'profile_image_url',
        galleryImage1: 'gallery_image_1',
        galleryImage2: 'gallery_image_2',
        galleryImage3: 'gallery_image_3',
        galleryImage4: 'gallery_image_4',
        gunLicenseUrl: 'gun_license_url',
        adminNotes: 'admin_notes',
        professionalDescription: 'professional_description',
        bloodGroup: 'blood_group',
        emergencyContact: 'emergency_contact',
        updatedByAdmin: 'updated_by_admin',
        lastAdminUpdate: 'last_admin_update',
        galleryUpdatedAt: 'gallery_updated_at',
        licenseUpdatedAt: 'license_updated_at',
    };

    for (const [frontend, dbKey] of Object.entries(mappings)) {
        if (frontend in dbObj) {
            dbObj[dbKey] = dbObj[frontend];
            delete dbObj[frontend];
        }
    }
    return dbObj;
};

const mapToFrontend = (obj: any) => {
    if (!obj) return null;
    const feObj: any = { ...obj };
    const mappings: Record<string, string> = {
        profile_image_url: 'profileImageUrl',
        gallery_image_1: 'galleryImage1',
        gallery_image_2: 'galleryImage2',
        gallery_image_3: 'galleryImage3',
        gallery_image_4: 'galleryImage4',
        gun_license_url: 'gunLicenseUrl',
        admin_notes: 'adminNotes',
        professional_description: 'professionalDescription',
        blood_group: 'bloodGroup',
        emergency_contact: 'emergencyContact',
        updated_by_admin: 'updatedByAdmin',
        last_admin_update: 'lastAdminUpdate',
        gallery_updated_at: 'galleryUpdatedAt',
        license_updated_at: 'licenseUpdatedAt',
        // Also map legacy ones if they happen to be returned in snake_case (they shouldn't be, but just in case)
        identity_verified: 'identityVerified',
        aadhaar_last_4: 'aadhaarLast4',
        liveness_verified_at: 'livenessVerifiedAt'
    };

    for (const [dbKey, frontend] of Object.entries(mappings)) {
        if (dbKey in feObj) {
            feObj[frontend] = feObj[dbKey];
            delete feObj[dbKey];
        }
    }
    return feObj;
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { id } = await params;

        // Convert update data to DB keys
        const updateData = mapToDB(body);

        // Remove id or forbidden fields if present
        delete updateData.id;
        delete updateData.userId;
        delete updateData.user_id;
        delete updateData.createdAt;
        delete updateData.created_at;
        delete updateData.updatedAt;
        delete updateData.updated_at;

        // Add updatedAt
        updateData.updatedAt = new Date().toISOString();

        // If admin is updating, we should set updated_by_admin
        updateData.last_admin_update = new Date().toISOString();
        updateData.updated_by_admin = 'ADMIN';

        const { data: bouncer, error } = await supabaseAdmin
            .from('bouncers')
            .update(updateData)
            .eq('id', id)
            .select('*, users(name, email, profilePhoto)')
            .single();

        if (error) throw error;

        const formatted = mapToFrontend(bouncer);
        if (bouncer.users) {
            const user = Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users;
            formatted.user = mapToFrontend(user);
            delete formatted.users;
        }

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error updating bouncer:', error);
        return NextResponse.json(
            { error: 'Failed to update bouncer' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: bouncer, error } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email, profilePhoto)')
            .eq('id', id)
            .single();

        if (error || !bouncer) {
            return NextResponse.json({ error: 'Bouncer not found' }, { status: 404 });
        }

        const formatted = mapToFrontend(bouncer);
        if (bouncer.users) {
            const user = Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users;
            formatted.user = mapToFrontend(user);
            delete formatted.users;
        }

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching bouncer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bouncer' },
            { status: 500 }
        );
    }
}
