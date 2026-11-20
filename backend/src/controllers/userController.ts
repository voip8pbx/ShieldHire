import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
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
        const authUser = (req as any).user || {};
        let userId = authUser.id;
        const userEmail = authUser.email ? String(authUser.email).trim().toLowerCase() : null;
        const { name, contactNo, profilePhoto, age, gender, location, company, govtIdPhoto, clientProfile, bouncerProfile } = req.body;

        // 1. Update User Table in Supabase
        const userUpdates: any = {
            updatedAt: new Date().toISOString()
        };

        if (name !== undefined) userUpdates.name = name;
        if (contactNo !== undefined) userUpdates.contactNo = contactNo;
        if (profilePhoto !== undefined) userUpdates.profilePhoto = profilePhoto;
        if (age !== undefined) {
            const parsedAge = safeParseInt(age);
            if (parsedAge !== null) userUpdates.age = parsedAge;
        }

        let updatedUser: any = null;

        // 1a. Try update by user id if id is a real UUID (not synthetic fallback)
        if (userId && !String(userId).startsWith('google_') && !String(userId).startsWith('demo_')) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('users')
                    .update(userUpdates)
                    .eq('id', userId)
                    .select()
                    .single();
                if (!error && data) {
                    updatedUser = data;
                }
            } catch (err) {
                console.warn('[UpdateProfile] DB update by ID failed:', err);
            }
        }

        // 1b. Try update or lookup by email if not found by id
        if (!updatedUser && userEmail) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('users')
                    .update(userUpdates)
                    .eq('email', userEmail)
                    .select()
                    .single();
                if (!error && data) {
                    updatedUser = data;
                    userId = data.id; // Switch to the real database UUID!
                }
            } catch (err) {
                console.warn('[UpdateProfile] DB update by email failed:', err);
            }
        }

        // 1c. If user doesn't exist in Supabase DB yet, create user record so FK constraints succeed
        if (!updatedUser && userEmail) {
            try {
                const { data: existingUser } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('email', userEmail)
                    .single();

                if (existingUser) {
                    const { data: refreshedUser } = await supabaseAdmin
                        .from('users')
                        .update(userUpdates)
                        .eq('id', existingUser.id)
                        .select()
                        .single();
                    updatedUser = refreshedUser || existingUser;
                    userId = updatedUser.id;
                } else {
                    const randomPassword = Math.random().toString(36).slice(-8);
                    const hashedPassword = await bcrypt.hash(randomPassword, 8);
                    const { data: newUser, error: createErr } = await supabaseAdmin
                        .from('users')
                        .insert({
                            email: userEmail,
                            password: hashedPassword,
                            name: name || authUser.name || 'User',
                            role: authUser.role || 'USER',
                            contactNo: contactNo || null,
                            profilePhoto: profilePhoto || null,
                            age: age ? safeParseInt(age) : null,
                        })
                        .select()
                        .single();
                    if (!createErr && newUser) {
                        updatedUser = newUser;
                        userId = newUser.id;
                    }
                }
            } catch (err) {
                console.warn('[UpdateProfile] DB user creation/lookup failed:', err);
            }
        }

        // 1d. Fallback session profile if DB is completely unreachable
        if (!updatedUser) {
            console.warn('[UpdateProfile] DB unreachable or user record not found, using session profile:', userEmail || userId);
            updatedUser = {
                id: userId || `user_${Date.now()}`,
                email: userEmail || `${userId}@shieldhire.app`,
                name: name || authUser.name || 'User',
                role: authUser.role || 'USER',
                contactNo: contactNo || null,
                profilePhoto: profilePhoto || null,
                age: age ? safeParseInt(age) : null,
                updatedAt: new Date().toISOString()
            };
        }

        // 1.5 Upsert Client Profile (for USER role or client requests)
        let updatedClient: any = null;
        const isClientRequest = updatedUser.role === 'USER' || govtIdPhoto !== undefined || clientProfile !== undefined || location !== undefined;
        if (isClientRequest) {
            const clientAge = age ?? clientProfile?.age;
            const clientGender = gender ?? clientProfile?.gender;
            const clientLocation = location ?? clientProfile?.location;
            const clientGovtIdPhoto = govtIdPhoto ?? clientProfile?.govtIdPhoto ?? '';

            // Auto-approve demo client sessions so they can immediately test the client app
            const isDemoClient = userEmail === 'rishi076@gmail.com' || String(userId).includes('demo');
            let initialStatus = isDemoClient ? 'APPROVED' : 'PENDING';

            let existingClient: any = null;
            try {
                const { data } = await supabaseAdmin
                    .from('clients')
                    .select('*')
                    .eq('userId', userId)
                    .single();
                existingClient = data;
                if (existingClient?.verificationStatus === 'APPROVED') {
                    initialStatus = 'APPROVED';
                }
            } catch (_) {}

            const clientPayload: any = {
                userId,
                name: name || updatedUser.name,
                contactNo: contactNo !== undefined ? contactNo : updatedUser.contactNo,
                age: clientAge ? safeParseInt(clientAge) : null,
                gender: clientGender || null,
                location: clientLocation || null,
                profilePhoto: profilePhoto !== undefined ? profilePhoto : updatedUser.profilePhoto,
                govtIdPhoto: clientGovtIdPhoto || existingClient?.govtIdPhoto || '',
                verificationStatus: initialStatus,
                updatedAt: new Date().toISOString()
            };

            try {
                const { data: clientRes, error: clientError } = await supabaseAdmin
                    .from('clients')
                    .upsert(clientPayload, { onConflict: 'userId' })
                    .select()
                    .single();

                if (!clientError && clientRes) {
                    updatedClient = clientRes;
                }
            } catch (cErr) {
                console.warn('[UpdateProfile] Client profile DB upsert error:', cErr);
            }

            if (!updatedClient) {
                updatedClient = clientPayload;
            }
        }

        // 2. Update Bouncer Profile if data provided
        let updatedBouncer = null;
        if (bouncerProfile) {
            try {
                const { data: existingBouncer } = await supabaseAdmin
                    .from('bouncers')
                    .select('*')
                    .eq('userId', userId)
                    .single();

                if (existingBouncer) {
                    const bouncerUpdates: any = {
                        updatedAt: new Date().toISOString()
                    };

                    if (name) bouncerUpdates.name = name;
                    if (contactNo) bouncerUpdates.contactNo = contactNo;
                    if (profilePhoto) bouncerUpdates.profilePhoto = profilePhoto;

                    if (bouncerProfile.age) {
                        const parsedAge = safeParseInt(bouncerProfile.age);
                        if (parsedAge !== null) bouncerUpdates.age = parsedAge;
                    }
                    if (bouncerProfile.gender) bouncerUpdates.gender = bouncerProfile.gender;
                    if (bouncerProfile.registrationType) bouncerUpdates.registrationType = bouncerProfile.registrationType;
                    if (bouncerProfile.agencyReferralCode) bouncerUpdates.agencyReferralCode = bouncerProfile.agencyReferralCode;
                    if (bouncerProfile.isGunman !== undefined) bouncerUpdates.isGunman = bouncerProfile.isGunman;

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

                    const { data: bouncerRes, error: bouncerError } = await supabaseAdmin
                        .from('bouncers')
                        .update(bouncerUpdates)
                        .eq('id', existingBouncer.id)
                        .select()
                        .single();

                    if (!bouncerError && bouncerRes) {
                        updatedBouncer = bouncerRes;
                    }
                }
            } catch (bErr) {
                console.warn('[UpdateProfile] Bouncer update DB error:', bErr);
            }
        }

        // 3. Format Response
        const responseUser: any = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            contactNo: updatedUser.contactNo,
            age: updatedUser.age,
            profilePhoto: updatedUser.profilePhoto,
            bouncerProfile: updatedBouncer ? camelCaseKeys(updatedBouncer) : undefined,
            clientProfile: updatedClient ? camelCaseKeys(updatedClient) : undefined
        };

        if (!updatedBouncer && updatedUser.role !== 'USER') {
            try {
                const { data: bouncer } = await supabaseAdmin
                    .from('bouncers')
                    .select('*')
                    .eq('userId', userId)
                    .single();
                if (bouncer) {
                    responseUser.bouncerProfile = camelCaseKeys(bouncer);
                }
            } catch (_) {}
        }

        if (!updatedClient && updatedUser.role === 'USER') {
            try {
                const { data: client } = await supabaseAdmin
                    .from('clients')
                    .select('*')
                    .eq('userId', userId)
                    .single();
                if (client) {
                    responseUser.clientProfile = camelCaseKeys(client);
                }
            } catch (_) {}
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
        const authUser = (req as any).user || {};
        const userId = authUser.id;
        const userEmail = authUser.email ? String(authUser.email).trim().toLowerCase() : null;

        let user: any = null;
        if (userId && !String(userId).startsWith('google_') && !String(userId).startsWith('demo_')) {
            try {
                const { data } = await supabaseAdmin
                    .from('users')
                    .select('*, bouncers(*)')
                    .eq('id', userId)
                    .single();
                user = data;
            } catch (_) {}
        }

        if (!user && userEmail) {
            try {
                const { data } = await supabaseAdmin
                    .from('users')
                    .select('*, bouncers(*)')
                    .eq('email', userEmail)
                    .single();
                user = data;
            } catch (_) {}
        }

        if (!user) {
            if (userEmail || userId) {
                const isDemoClient = userEmail === 'rishi076@gmail.com' || String(userId).includes('demo');
                return res.json({
                    id: userId,
                    email: userEmail,
                    name: authUser.name || userEmail?.split('@')[0] || 'User',
                    role: authUser.role || 'USER',
                    contactNo: authUser.contactNo || null,
                    profilePhoto: authUser.profilePhoto || null,
                    bouncerProfile: null,
                    clientProfile: isDemoClient ? {
                        userId: userId,
                        name: authUser.name || 'Rishi',
                        verificationStatus: 'APPROVED'
                    } : null
                });
            }
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
        if (!responseUser.bouncerProfile && user.role !== 'USER') {
            try {
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
            } catch (_) {}
        }

        // Always fetch clientProfile for USER role — required for onboarding routing
        if (user.role === 'USER') {
            try {
                const { data: clientData } = await supabaseAdmin
                    .from('clients')
                    .select('*')
                    .eq('userId', user.id)
                    .single();

                responseUser.clientProfile = clientData ? camelCaseKeys(clientData) : null;
            } catch (_) {}
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
