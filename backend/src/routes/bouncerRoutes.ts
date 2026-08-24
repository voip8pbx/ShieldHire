import express from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

const parseBioMetadata = (bioStr: string | null) => {
    const defaultVal = { bio: bioStr || '', upiId: '' };
    if (!bioStr) return defaultVal;
    
    const parts = bioStr.split(' | UPI ID: ');
    if (parts.length > 1) {
        return { bio: parts[0], upiId: parts[1] };
    }
    return defaultVal;
};

// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    const newObj: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    if (newObj.bio !== undefined) {
        const { bio, upiId } = parseBioMetadata(newObj.bio);
        newObj.bio = bio;
        newObj.upiId = upiId;
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
            // Map the new image URLs back to the legacy fields expected by the mobile app
            if (formatted.profileImageUrl) {
                formatted.profilePhoto = formatted.profileImageUrl;
            }
            
            // Map new gallery images to the legacy gallery array
            const newGallery = Array.isArray(formatted.gallery) ? [...formatted.gallery] : [];
            if (formatted.galleryImage1 && !newGallery.includes(formatted.galleryImage1)) newGallery.push(formatted.galleryImage1);
            if (formatted.galleryImage2 && !newGallery.includes(formatted.galleryImage2)) newGallery.push(formatted.galleryImage2);
            if (formatted.galleryImage3 && !newGallery.includes(formatted.galleryImage3)) newGallery.push(formatted.galleryImage3);
            if (formatted.galleryImage4 && !newGallery.includes(formatted.galleryImage4)) newGallery.push(formatted.galleryImage4);
            
            if (newGallery.length > 0) {
                formatted.gallery = newGallery;
            }

            if (formatted.gunLicenseUrl) {
                formatted.gunLicensePhoto = formatted.gunLicenseUrl;
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

        // Map the new image URLs back to the legacy fields expected by the mobile app
        if (formatted.profileImageUrl) {
            formatted.profilePhoto = formatted.profileImageUrl;
        }
        
        // Map new gallery images to the legacy gallery array
        const newGallery = Array.isArray(formatted.gallery) ? [...formatted.gallery] : [];
        if (formatted.galleryImage1 && !newGallery.includes(formatted.galleryImage1)) newGallery.push(formatted.galleryImage1);
        if (formatted.galleryImage2 && !newGallery.includes(formatted.galleryImage2)) newGallery.push(formatted.galleryImage2);
        if (formatted.galleryImage3 && !newGallery.includes(formatted.galleryImage3)) newGallery.push(formatted.galleryImage3);
        if (formatted.galleryImage4 && !newGallery.includes(formatted.galleryImage4)) newGallery.push(formatted.galleryImage4);
        
        if (newGallery.length > 0) {
            formatted.gallery = newGallery;
        }

        if (formatted.gunLicenseUrl) {
            formatted.gunLicensePhoto = formatted.gunLicenseUrl;
        }

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching bouncer:', error);
        res.status(500).json({ error: 'Failed to fetch bouncer' });
    }
});

// Update bouncer (Authenticated - Bouncer themselves or Admin)
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const requestingUser = (req as any).user;

        // Fetch the bouncer profile to verify ownership
        const { data: bouncerCheck, error: fetchError } = await supabaseAdmin
            .from('bouncers')
            .select('userId')
            .eq('id', id)
            .single();

        if (fetchError || !bouncerCheck) {
            return res.status(404).json({ error: 'Bouncer profile not found' });
        }

        // Authorize: user must be ADMIN or the bouncer themselves
        const isSelf = requestingUser.id === bouncerCheck.userId;
        const isAdmin = requestingUser.role === 'ADMIN';

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
        }

        // Sanitize update data if not admin (remove rating, verificationStatus, isGunman, etc.)
        if (!isAdmin) {
            const allowedBouncerFields = [
                'age', 'gender', 'bio', 'skills', 'experience', 'gallery',
                'profileImageUrl', 'galleryImage1', 'galleryImage2', 'galleryImage3', 'galleryImage4',
                'gunLicenseUrl', 'professionalDescription', 'languages', 'height', 'weight',
                'bloodGroup', 'emergencyContact', 'isAvailable'
            ];
            Object.keys(updateData).forEach(key => {
                if (!allowedBouncerFields.includes(key)) {
                    delete updateData[key];
                }
            });
        }

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

// Delete bouncer (Admin only)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
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

