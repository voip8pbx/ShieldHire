import { Router, Request, Response } from 'express';
import { put } from '@vercel/blob';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Endpoint to upload an image to Vercel Blob
// Accepts { image: string (base64) or Buffer, filename: string, folder: string }
router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { image, filename, folder } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image data provided' });
        }

        const path = `${folder || 'uploads'}/${filename || 'image-' + Date.now() + '.jpg'}`;

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

        const { url } = await put(path, buffer, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        res.json({ url });
    } catch (error: any) {
        console.error('Vercel Blob Upload Error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
});

export default router;
