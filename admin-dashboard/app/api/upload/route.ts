import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the service-role client so uploads bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

const BUCKET = 'bouncers'; // must exist in your Supabase project

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');
        const oldUrl = searchParams.get('oldUrl');

        if (!filename) {
            return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }

        // Validate extension
        const ext = filename.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];
        if (!ext || !allowedExtensions.includes(ext)) {
            return NextResponse.json({ error: 'Invalid file extension.' }, { status: 400 });
        }

        // Sanitize filename — strip spaces and unsafe characters to make a valid storage path
        const safeFilename = filename
            .replace(/\s+/g, '-')          // spaces → dashes
            .replace(/[^a-zA-Z0-9.\-_]/g, '') // remove all other unsafe chars
            || `upload-${Date.now()}.${ext}`;

        // Detect MIME type
        const mimeMap: Record<string, string> = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            webp: 'image/webp', gif: 'image/gif', pdf: 'application/pdf',
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';

        // Read raw body into a Buffer
        const arrayBuffer = await request.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate size (10 MB max)
        if (buffer.length > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds the 10MB limit.' }, { status: 400 });
        }

        // Delete old file from Supabase if replacing
        if (oldUrl && oldUrl.includes('supabase')) {
            try {
                // Extract the storage path from the public URL
                // URL shape: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
                const urlObj = new URL(oldUrl);
                const pathMatch = urlObj.pathname.match(/\/object\/public\/[^/]+\/(.+)/);
                if (pathMatch) {
                    await supabaseAdmin.storage.from(BUCKET).remove([pathMatch[1]]);
                }
            } catch (e) {
                console.warn('[Upload] Failed to delete old file:', e);
            }
        }

        // Upload to Supabase Storage
        const storagePath = `admin-uploads/${safeFilename}`;
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(storagePath, buffer, {
                contentType,
                upsert: true,
            });

        if (error || !data) {
            console.error('[Upload] Supabase storage upload failed:', error?.message);
            return NextResponse.json({ error: 'Upload failed: ' + (error?.message || 'Unknown error') }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET)
            .getPublicUrl(storagePath);

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (error: any) {
        console.error('[Upload] Unexpected error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
