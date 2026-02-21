import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

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

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // From auth middleware
        const { name, contactNo, profilePhoto, company, bouncerProfile } = req.body;

        // 1. Update User Table
        const { data: updatedUser, error: userError } = await supabaseAdmin
            .from('users')
            .update({
                name,
                contactNo: contactNo,
                profilePhoto: profilePhoto,
                updatedAt: new Date().toISOString()
            })
            .eq('id', userId)
            .select() // Return updated record
            .single();

        if (userError) throw userError;

        // 2. Update Bouncer Profile if data provided
        let updatedBouncer = null;
        if (bouncerProfile) {
            // Check if user HAS a bouncer profile first
            const { data: existingBouncer } = await supabaseAdmin
                .from('bouncers')
                .select('*')
                .eq('userId', userId)
                .single();

            if (existingBouncer) {
                // Prepare update object for bouncers table
                const bouncerUpdates: any = {
                    updatedAt: new Date().toISOString()
                };

                // Sync name/contact if changed on user level, usually good practice
                if (name) bouncerUpdates.name = name;
                if (contactNo) bouncerUpdates.contactNo = contactNo;
                if (profilePhoto) bouncerUpdates.profilePhoto = profilePhoto;

                // Specific fields
                if (bouncerProfile.age) bouncerUpdates.age = parseInt(bouncerProfile.age);
                if (bouncerProfile.gender) bouncerUpdates.gender = bouncerProfile.gender;
                if (bouncerProfile.registrationType) bouncerUpdates.registrationType = bouncerProfile.registrationType;
                if (bouncerProfile.agencyReferralCode) bouncerUpdates.agencyReferralCode = bouncerProfile.agencyReferralCode;
                if (bouncerProfile.isGunman !== undefined) bouncerUpdates.isGunman = bouncerProfile.isGunman;

                // Extended Profile
                if (bouncerProfile.bio !== undefined) bouncerUpdates.bio = bouncerProfile.bio;
                if (bouncerProfile.skills) bouncerUpdates.skills = bouncerProfile.skills;
                if (bouncerProfile.experience !== undefined) bouncerUpdates.experience = parseInt(bouncerProfile.experience);
                if (bouncerProfile.gallery) bouncerUpdates.gallery = bouncerProfile.gallery;

                const { data: bouncerResult, error: bouncerError } = await supabaseAdmin
                    .from('bouncers')
                    .update(bouncerUpdates)
                    .eq('id', existingBouncer.id)
                    .select()
                    .single();

                if (bouncerError) throw bouncerError;
                updatedBouncer = bouncerResult;
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

        // If bouncer wasn't updated but exists, fetch it to include in response?
        // Original code used `include: { bouncerProfile: true }` in user update.
        // So we should return the bouncer profile even if not updated.
        if (!updatedBouncer) {
            const { data: bouncer } = await supabaseAdmin
                .from('bouncers')
                .select('*')
                .eq('userId', userId)
                .single();
            if (bouncer) {
                responseUser.bouncerProfile = camelCaseKeys(bouncer);
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
            // Handle bouncers relation (1:1 but returns array in Supabase JS usually)
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

        res.json(responseUser);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

