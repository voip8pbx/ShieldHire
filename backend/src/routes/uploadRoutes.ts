import { Router, Request, Response } from 'express';
import { put } from '@vercel/blob';
import { authenticate } from '../middleware/authMiddleware';
import { supabaseAdmin } from '../config/supabase';
import fs from 'fs';
import path from 'path';

const router = Router();

// Endpoint to upload an image supporting Hybrid Storage: Vercel Blob, Supabase Storage, and Local Disk fallback
// Accepts { image: string (base64) or Buffer, filename: string, folder: string }
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { image, filename, folder } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        // 1. Validate file extension in filename
        const filenameString = filename || '';
        const ext = filenameString.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'm4a', 'aac', 'mp3'];
        if (!ext || !allowedExtensions.includes(ext)) {
            return res.status(400).json({ error: 'Invalid file extension.' });
        }

        // 2. Identify MIME type
        let mimeType = 'image/jpeg';
        if (typeof image === 'string' && image.includes('data:')) {
            mimeType = image.split(';')[0].split(':')[1];
            const isImage = mimeType.startsWith('image/');
            const isAudio = mimeType.startsWith('audio/');
            if (!isImage && !isAudio) {
                return res.status(400).json({ error: 'Invalid mimetype. Only image and audio uploads are allowed.' });
            }
        }

        const relativePath = `${folder || 'uploads'}/${filename || 'image-' + Date.now() + '.jpg'}`;

        // If image is a base64 string, convert to buffer
        let buffer: Buffer;
        if (typeof image === 'string' && image.includes('base64,')) {
            const base64Data = image.split('base64,')[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else if (typeof image === 'string') {
            buffer = Buffer.from(image, 'base64');
        } else {
            buffer = image;
        }

        // 3. Validate buffer size (Limit to 10MB)
        if (buffer.length > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'File size exceeds the 10MB limit.' });
        }

        // 4. Try Uploading:
        
        // --- TARGET A: Vercel Blob ---
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            console.log(`[Upload] Uploading to Vercel Blob: ${relativePath}`);
            const { url } = await put(relativePath, buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            return res.json({ url });
        }

        // --- TARGET B: Supabase Storage ---
        if (process.env.SUPABASE_URL) {
            console.log(`[Upload] BLOB_READ_WRITE_TOKEN missing. Uploading to Supabase Storage: bouncers/${relativePath}`);
            const { data, error } = await supabaseAdmin.storage
                .from('bouncers')
                .upload(relativePath, buffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (!error && data) {
                const { data: urlData } = supabaseAdmin.storage
                    .from('bouncers')
                    .getPublicUrl(relativePath);
                console.log(`[Upload] Supabase Upload successful: ${urlData.publicUrl}`);
                return res.json({ url: urlData.publicUrl });
            } else {
                console.warn(`[Upload Warning] Supabase storage upload failed: ${error?.message || 'Unknown error'}`);
            }
        }

        // --- TARGET C: Local Disk Fallback (If Cloud storage is unconfigured or failed) ---
        if (process.env.NODE_ENV === 'production') {
            console.error('[Upload] Cloud storage upload failed or is unconfigured in production.');
            return res.status(500).json({ error: 'Persistent cloud storage is unconfigured or unavailable. Upload failed.' });
        }

        console.log(`[Upload] Cloud storage unavailable. Falling back to local storage for ${relativePath}`);
        
        const targetDir = path.join(__dirname, '../../public/uploads', folder || 'uploads');
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const targetFilePath = path.join(targetDir, filename || 'image-' + Date.now() + '.jpg');
        fs.writeFileSync(targetFilePath, buffer);
        
        const host = req.get('host') || `127.0.0.1:${process.env.PORT || 5000}`;
        const url = `${req.protocol}://${host}/uploads/${folder || 'uploads'}/${filename || 'image-' + Date.now() + '.jpg'}`;
        
        console.log(`[Upload] File saved to ${targetFilePath}. Serving URL: ${url}`);
        return res.json({ url });

    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
});

export default router;
