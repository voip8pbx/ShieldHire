import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    const newObj: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
};

// Get bouncer verification status by userId
router.get('/status/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const { data: bouncer, error } = await supabaseAdmin
            .from('bouncers')
            .select('id, verificationStatus, verifiedAt, rejectionReason, createdAt')
            .eq('userId', userId)
            .single();

        if (error || !bouncer) {
            return res.status(404).json({ error: 'Bouncer profile not found' });
        }

        res.json(camelCaseKeys(bouncer));
    } catch (error) {
        console.error('Error fetching bouncer status:', error);
        res.status(500).json({ error: 'Failed to fetch verification status' });
    }
});

export default router;

