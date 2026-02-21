import express from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = express.Router();

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

// Helper to convert camelCase to snake_case for Supabase (Disabled for camelCase schema)
const snakeCaseKeys = (obj: any): any => {
    return obj;
};

// Get all bouncers (only APPROVED for mobile app)
router.get('/', async (req, res) => {
    try {
        const { data: bouncers, error } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email, profilePhoto)')
            .eq('verificationStatus', 'APPROVED')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        const formattedBouncers = bouncers.map((b: any) => {
            const formatted = camelCaseKeys(b);
            if (b.users) {
                const user = Array.isArray(b.users) ? b.users[0] : b.users;
                formatted.user = camelCaseKeys(user);
                delete formatted.users;
            }
            return formatted;
        });

        res.json(formattedBouncers);
    } catch (error) {
        console.error('Error fetching bouncers:', error);
        res.status(500).json({ error: 'Failed to fetch bouncers' });
    }
});

// Get single bouncer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: bouncer, error } = await supabaseAdmin
            .from('bouncers')
            .select('*, users(name, email, profilePhoto)')
            .eq('id', id)
            .single();

        if (error || !bouncer) {
            return res.status(404).json({ error: 'Bouncer not found' });
        }

        const formatted = camelCaseKeys(bouncer);
        if (bouncer.users) {
            const user = Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users;
            formatted.user = camelCaseKeys(user);
            delete formatted.users;
        }

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching bouncer:', error);
        res.status(500).json({ error: 'Failed to fetch bouncer' });
    }
});

// Update bouncer
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Convert update data to snake_case
        const snakeUpdateData = snakeCaseKeys(updateData);

        // Remove id or forbidden fields if present
        delete snakeUpdateData.id;
        delete snakeUpdateData.userId;
        delete snakeUpdateData.createdAt;

        // Add updatedAt
        snakeUpdateData.updatedAt = new Date().toISOString();

        const { data: bouncer, error } = await supabaseAdmin
            .from('bouncers')
            .update(snakeUpdateData)
            .eq('id', id)
            .select('*, users(name, email)') // Fetch user to return consistent structure
            .single();

        if (error) throw error;

        const formatted = camelCaseKeys(bouncer);
        if (bouncer.users) {
            const user = Array.isArray(bouncer.users) ? bouncer.users[0] : bouncer.users;
            formatted.user = camelCaseKeys(user);
            delete formatted.users;
        }

        res.json(formatted);
    } catch (error) {
        console.error('Error updating bouncer:', error);
        res.status(500).json({ error: 'Failed to update bouncer' });
    }
});

// Delete bouncer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('bouncers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Bouncer deleted successfully' });
    } catch (error) {
        console.error('Error deleting bouncer:', error);
        res.status(500).json({ error: 'Failed to delete bouncer' });
    }
});

export default router;

