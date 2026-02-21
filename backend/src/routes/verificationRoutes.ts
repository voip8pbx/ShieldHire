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

// GET all pending verifications
router.get('/pending', async (req: Request, res: Response) => {
    try {
        const { data: pendingBouncers, error } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email)')
            .eq('verificationStatus', 'PENDING')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        const formatted = pendingBouncers.map((b: any) => {
            const f = camelCaseKeys(b);
            if (b.users) {
                f.user = camelCaseKeys(Array.isArray(b.users) ? b.users[0] : b.users);
                delete f.users;
            }
            return f;
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        res.status(500).json({ error: 'Failed to fetch pending verifications' });
    }
});

// GET all verifications (including approved/rejected)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        let query = supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email)')
            .order('createdAt', { ascending: false });

        if (status && typeof status === 'string') {
            query = query.eq('verificationStatus', status.toUpperCase());
        }

        const { data: bouncers, error } = await query;

        if (error) throw error;

        const formatted = bouncers.map((b: any) => {
            const f = camelCaseKeys(b);
            if (b.users) {
                f.user = camelCaseKeys(Array.isArray(b.users) ? b.users[0] : b.users);
                delete f.users;
            }
            return f;
        });

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching verifications:', error);
        res.status(500).json({ error: 'Failed to fetch verifications' });
    }
});

// GET single bouncer verification details
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { data: bouncer, error } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email, createdAt)')
            .eq('id', id)
            .single();

        if (error || !bouncer) {
            return res.status(404).json({ error: 'Bouncer not found' });
        }

        const formatted = camelCaseKeys(bouncer);
        if (bouncer.users) {
            formatted.user = camelCaseKeys(Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users);
            delete formatted.users;
        }

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching bouncer details:', error);
        res.status(500).json({ error: 'Failed to fetch bouncer details' });
    }
});

// PATCH - Approve a bouncer
router.patch('/:id/approve', async (req: Request, res: Response) => {
    console.log(`[VERIFICATION] Approve request received for ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        const { adminId } = req.body; // Admin user ID
        let warningMessage = '';

        // Validate adminId (UUID check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const verifiedBy = (adminId && uuidRegex.test(adminId)) ? adminId : null;

        const { error: updateError } = await supabaseAdmin
            .from('bouncers')
            .update({
                verificationStatus: 'APPROVED',
                verifiedBy: verifiedBy,
                verifiedAt: new Date().toISOString(),
                rejectionReason: null,
                isAvailable: true
            })
            .eq('id', id);

        if (updateError) throw updateError;

        const { data: bouncer, error: fetchError } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email)')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;


        try {
            // 1. Update User Role
            let newRole = 'BOUNCER';
            // Determine role logic
            if (bouncer.isGunman) newRole = 'GUNMAN';
            else if (bouncer.registrationType === 'Agency') newRole = 'BOUNCER';

            await supabaseAdmin
                .from('users')
                .update({ role: newRole })
                .eq('id', bouncer.userId);

            // 2. Data is already in 'bouncers' table, no need to sync to 'trainer_profiles'
            // The verification_status was already updated in the previous step (calling this function)

        } catch (syncError) {
            console.error('Error updating user role:', syncError);
            warningMessage = 'Failed to update user role. Manual review may be required.';
        }

        const formatted = camelCaseKeys(bouncer);
        if (bouncer.users) {
            formatted.user = camelCaseKeys(Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users);
            delete formatted.users;
        }

        res.json({
            message: 'Bouncer approved successfully',
            bouncer: formatted,
            warning: warningMessage
        });
    } catch (error) {
        console.error('Error approving bouncer:', error);
        res.status(500).json({ error: 'Failed to approve bouncer' });
    }
});

// PATCH - Reject a bouncer
router.patch('/:id/reject', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { adminId, reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        // Validate adminId (UUID check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const verifiedBy = (adminId && uuidRegex.test(adminId)) ? adminId : null;

        const { error: updateError } = await supabaseAdmin
            .from('bouncers')
            .update({
                verificationStatus: 'REJECTED',
                verifiedBy: verifiedBy,
                verifiedAt: new Date().toISOString(),
                rejectionReason: reason,
                isAvailable: false
            })
            .eq('id', id);

        if (updateError) throw updateError;

        const { data: bouncer, error: fetchError } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email)')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const formatted = camelCaseKeys(bouncer);
        if (bouncer.users) {
            formatted.user = camelCaseKeys(Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users);
            delete formatted.users;
        }

        res.json({
            message: 'Bouncer rejected',
            bouncer: formatted
        });
    } catch (error) {
        console.error('Error rejecting bouncer:', error);
        res.status(500).json({ error: 'Failed to reject bouncer' });
    }
});

export default router;

