import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { pgPool } from '../config/pgDb';


const safeParseInt = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? null : parsed;
};


const parseBioMetadata = (bioStr: string | null) => {
    const defaultVal = { bio: bioStr || '', upiId: '', singleShiftPrice: 2000, vipBodyguardPrice: 4000 };
    if (!bioStr) return defaultVal;
    
    const parts = bioStr.split(' | ');
    const result = { bio: parts[0] || '', upiId: '', singleShiftPrice: 2000, vipBodyguardPrice: 4000 };
    
    parts.forEach((part, index) => {
        if (index === 0 && !part.includes(': ')) {
            result.bio = part;
        } else if (part.startsWith('UPI ID: ')) {
            result.upiId = part.replace('UPI ID: ', '').trim();
        } else if (part.startsWith('SINGLE_SHIFT_PRICE: ')) {
            const val = parseInt(part.replace('SINGLE_SHIFT_PRICE: ', ''), 10);
            if (!isNaN(val) && val > 0) result.singleShiftPrice = val;
        } else if (part.startsWith('VIP_BODYGUARD_PRICE: ')) {
            const val = parseInt(part.replace('VIP_BODYGUARD_PRICE: ', ''), 10);
            if (!isNaN(val) && val > 0) result.vipBodyguardPrice = val;
        }
    });
    return result;
};

const formatBioMetadata = (bio: string, upiId: string, singleShiftPrice?: number, vipBodyguardPrice?: number) => {
    const cleanBio = (bio || '').trim();
    const cleanUpi = (upiId || '').trim();
    let result = cleanBio;
    if (cleanUpi) result += ` | UPI ID: ${cleanUpi}`;
    if (singleShiftPrice) result += ` | SINGLE_SHIFT_PRICE: ${singleShiftPrice}`;
    if (vipBodyguardPrice) result += ` | VIP_BODYGUARD_PRICE: ${vipBodyguardPrice}`;
    return result;
};

// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj: any): any => {
    if (!obj) return null;
    const newObj: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    if (newObj.bio !== undefined) {
        const { bio, upiId, singleShiftPrice, vipBodyguardPrice } = parseBioMetadata(newObj.bio);
        newObj.bio = bio;
        newObj.upiId = upiId;
        newObj.singleShiftPrice = singleShiftPrice;
        newObj.vipBodyguardPrice = vipBodyguardPrice;
    }
    return newObj;
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, contactNo, profilePhoto, age, gender, location, company, govtIdPhoto, clientProfile, bouncerProfile } = req.body;

        // 1. Update User Table
        const userUpdates: string[] = [];
        const userValues: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
            userUpdates.push(`name = $${paramIndex++}`);
            userValues.push(name);
        }
        if (contactNo !== undefined) {
            userUpdates.push(`"contactNo" = $${paramIndex++}`);
            userValues.push(contactNo);
        }
        if (profilePhoto !== undefined) {
            userUpdates.push(`"profilePhoto" = $${paramIndex++}`);
            userValues.push(profilePhoto);
        }

        userUpdates.push(`"updatedAt" = $${paramIndex++}`);
        userValues.push(new Date().toISOString());

        const userQueryText = `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const userRes = await pgPool.query(userQueryText, [...userValues, userId]);
        const updatedUser = userRes.rows[0];

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 1.5 Upsert Client Profile (for USER role)
        if (updatedUser.role === 'USER') {
            const clientAge = age ?? clientProfile?.age;
            const clientGender = gender ?? clientProfile?.gender;
            const clientLocation = location ?? clientProfile?.location;
            const clientGovtIdPhoto = govtIdPhoto ?? clientProfile?.govtIdPhoto ?? '';

            await pgPool.query(
                `INSERT INTO clients ("id", "userId", name, "contactNo", age, gender, location, "profilePhoto", "govtIdPhoto", "verificationStatus", "rejectionReason", "updatedAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT ("userId")
                 DO UPDATE SET
                     name = EXCLUDED.name,
                     "contactNo" = EXCLUDED."contactNo",
                     age = EXCLUDED.age,
                     gender = EXCLUDED.gender,
                     location = EXCLUDED.location,
                     "profilePhoto" = EXCLUDED."profilePhoto",
                     "govtIdPhoto" = CASE
                         WHEN EXCLUDED."govtIdPhoto" IS NOT NULL AND EXCLUDED."govtIdPhoto" != ''
                         THEN EXCLUDED."govtIdPhoto"
                         ELSE clients."govtIdPhoto"
                     END,
                     "verificationStatus" = CASE
                         WHEN clients."verificationStatus" = 'APPROVED' THEN 'APPROVED'
                         ELSE clients."verificationStatus"
                     END,
                     "updatedAt" = EXCLUDED."updatedAt"`,
                [
                    userId,
                    name || updatedUser.name,
                    contactNo !== undefined ? contactNo : updatedUser.contactNo,
                    clientAge ? safeParseInt(clientAge) : null,
                    clientGender || null,
                    clientLocation || null,
                    profilePhoto !== undefined ? profilePhoto : updatedUser.profilePhoto,
                    clientGovtIdPhoto,
                    'PENDING',
                    null,
                    new Date().toISOString()
                ]
            );
        }


        // 2. Update Bouncer Profile directly in PostgreSQL if data provided
        let updatedBouncer = null;
        if (bouncerProfile) {
            // Check if user HAS a bouncer profile first
            const existingBouncerRes = await pgPool.query(
                'SELECT * FROM bouncers WHERE "userId" = $1',
                [userId]
            );
            const existingBouncer = existingBouncerRes.rows[0];

            if (existingBouncer) {
                // Prepare update object for bouncers table
                const bouncerUpdates: any = {
                    updatedAt: new Date().toISOString()
                };

                // Sync name/contact if changed on user level
                if (name) bouncerUpdates.name = name;
                if (contactNo) bouncerUpdates.contactNo = contactNo;
                if (profilePhoto) bouncerUpdates.profilePhoto = profilePhoto;

                // Specific fields
                if (bouncerProfile.age) {
                    const parsedAge = safeParseInt(bouncerProfile.age);
                    if (parsedAge !== null) bouncerUpdates.age = parsedAge;
                }
                if (bouncerProfile.gender) bouncerUpdates.gender = bouncerProfile.gender;
                if (bouncerProfile.registrationType) bouncerUpdates.registrationType = bouncerProfile.registrationType;
                if (bouncerProfile.agencyReferralCode) bouncerUpdates.agencyReferralCode = bouncerProfile.agencyReferralCode;
                if (bouncerProfile.isGunman !== undefined) bouncerUpdates.isGunman = bouncerProfile.isGunman;

                // Extended Profile
                const submittedBio = bouncerProfile.bio !== undefined ? bouncerProfile.bio : (existingBouncer.bio || '');
                const parsedExisting = parseBioMetadata(existingBouncer.bio);
                const currentUpi = bouncerProfile.upiId !== undefined ? bouncerProfile.upiId : parsedExisting.upiId;
                const currentSinglePrice = bouncerProfile.singleShiftPrice !== undefined ? safeParseInt(bouncerProfile.singleShiftPrice) || 2000 : parsedExisting.singleShiftPrice;
                const currentVipPrice = bouncerProfile.vipBodyguardPrice !== undefined ? safeParseInt(bouncerProfile.vipBodyguardPrice) || 4000 : parsedExisting.vipBodyguardPrice;
                
                bouncerUpdates.bio = formatBioMetadata(submittedBio, currentUpi, currentSinglePrice, currentVipPrice);

                if (bouncerProfile.skills) bouncerUpdates.skills = bouncerProfile.skills;
                if (bouncerProfile.experience !== undefined) {
                    const parsedExp = safeParseInt(bouncerProfile.experience);
                    if (parsedExp !== null) bouncerUpdates.experience = parsedExp;
                }

                if (bouncerProfile.gallery) bouncerUpdates.gallery = bouncerProfile.gallery;

                if (bouncerProfile.identityVerified !== undefined) bouncerUpdates.identity_verified = bouncerProfile.identityVerified;
                if (bouncerProfile.aadhaarLast4) bouncerUpdates.aadhaar_last_4 = bouncerProfile.aadhaarLast4;
                if (bouncerProfile.livenessVerifiedAt) bouncerUpdates.liveness_verified_at = bouncerProfile.livenessVerifiedAt;

                const keys = Object.keys(bouncerUpdates);
                const values = Object.values(bouncerUpdates);
                const setClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
                const queryText = `UPDATE bouncers SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
                
                const bouncerRes = await pgPool.query(queryText, [...values, existingBouncer.id]);
                updatedBouncer = bouncerRes.rows[0];
            }
        }

        // 3. Format Response
        const responseUser = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            contactNo: updatedUser.contactNo,
            age: updatedUser.age,
            profilePhoto: updatedUser.profilePhoto,
            bouncerProfile: updatedBouncer ? camelCaseKeys(updatedBouncer) : undefined
        };

        // If bouncer wasn't updated but exists, fetch it to include in response
        if (!updatedBouncer) {
            const bouncerRes = await pgPool.query(
                'SELECT * FROM bouncers WHERE "userId" = $1',
                [userId]
            );
            const bouncer = bouncerRes.rows[0];
            if (bouncer) {
                responseUser.bouncerProfile = camelCaseKeys(bouncer);
            }
        }

        // If client exists, fetch it to include in response
        if (updatedUser.role === 'USER') {
            const clientRes = await pgPool.query(
                'SELECT * FROM clients WHERE "userId" = $1',
                [userId]
            );
            const client = clientRes.rows[0];
            if (client) {
                (responseUser as any).clientProfile = camelCaseKeys(client);
            }
        }

        res.json({
            message: 'Profile updated successfully',
            user: responseUser
        });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*, bouncers(*)')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const responseUser: any = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            contactNo: user.contactNo,
            age: user.age,
            profilePhoto: user.profilePhoto,
            bouncerProfile: (user.bouncers && user.bouncers.length > 0)
                ? camelCaseKeys(user.bouncers[0])
                : null
        };

        // Fallback for bouncer profile if join fails
        if (!responseUser.bouncerProfile) {
            const { data: bouncer } = await supabaseAdmin
                .from('bouncers')
                .select('*')
                .eq('userId', user.id)
                .single();

            if (bouncer) {
                responseUser.bouncerProfile = camelCaseKeys(bouncer);
                if (responseUser.role === 'USER') {
                    responseUser.role = bouncer.isGunman ? 'GUNMAN' : 'BOUNCER';
                }
            }
        }

        // Always fetch clientProfile for USER role — required for onboarding routing
        if (user.role === 'USER') {
            const { data: clientData } = await supabaseAdmin
                .from('clients')
                .select('*')
                .eq('userId', user.id)
                .single();

            responseUser.clientProfile = clientData ? camelCaseKeys(clientData) : null;
        }

        res.json(responseUser);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('userId', userId)
            .order('createdAt', { ascending: false })
            .limit(50);
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ isRead: true })
            .eq('id', id)
            .eq('userId', userId);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Mark Notification Read Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('users')
            .select('*, bouncers(*)')
            .order('createdAt', { ascending: false });

        if (error) throw error;

        const formattedUsers = users.map(user => {
            const bouncerProfile = (user.bouncers && user.bouncers.length > 0)
                ? camelCaseKeys(user.bouncers[0])
                : null;

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: bouncerProfile ? (bouncerProfile.isGunman ? 'GUNMAN' : 'BOUNCER') : user.role,
                contactNo: user.contactNo,
                profilePhoto: user.profilePhoto,
                bouncerProfile
            };
        });

        res.json(formattedUsers);
    } catch (error: any) {
        console.error('Get Users Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
