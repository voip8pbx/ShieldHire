"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = void 0;
const supabase_1 = require("../config/supabase");
// Helper to convert snake_case DB columns to camelCase for frontend
const camelCaseKeys = (obj) => {
    if (!obj)
        return null;
    const newObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = obj[key];
    }
    return newObj;
};
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id; // From auth middleware
        const { name, contactNo, profilePhoto, company, bouncerProfile } = req.body;
        // 1. Update User Table
        const { data: updatedUser, error: userError } = yield supabase_1.supabaseAdmin
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
        if (userError)
            throw userError;
        // 2. Update Bouncer Profile if data provided
        let updatedBouncer = null;
        if (bouncerProfile) {
            // Check if user HAS a bouncer profile first
            const { data: existingBouncer } = yield supabase_1.supabaseAdmin
                .from('bouncers')
                .select('*')
                .eq('userId', userId)
                .single();
            if (existingBouncer) {
                // Prepare update object for bouncers table
                const bouncerUpdates = {
                    updatedAt: new Date().toISOString()
                };
                // Sync name/contact if changed on user level, usually good practice
                if (name)
                    bouncerUpdates.name = name;
                if (contactNo)
                    bouncerUpdates.contactNo = contactNo;
                if (profilePhoto)
                    bouncerUpdates.profilePhoto = profilePhoto;
                // Specific fields
                if (bouncerProfile.age)
                    bouncerUpdates.age = parseInt(bouncerProfile.age);
                if (bouncerProfile.gender)
                    bouncerUpdates.gender = bouncerProfile.gender;
                if (bouncerProfile.registrationType)
                    bouncerUpdates.registrationType = bouncerProfile.registrationType;
                if (bouncerProfile.agencyReferralCode)
                    bouncerUpdates.agencyReferralCode = bouncerProfile.agencyReferralCode;
                if (bouncerProfile.isGunman !== undefined)
                    bouncerUpdates.isGunman = bouncerProfile.isGunman;
                // Extended Profile
                if (bouncerProfile.bio !== undefined)
                    bouncerUpdates.bio = bouncerProfile.bio;
                if (bouncerProfile.skills)
                    bouncerUpdates.skills = bouncerProfile.skills;
                if (bouncerProfile.experience !== undefined)
                    bouncerUpdates.experience = parseInt(bouncerProfile.experience);
                if (bouncerProfile.gallery)
                    bouncerUpdates.gallery = bouncerProfile.gallery;
                const { data: bouncerResult, error: bouncerError } = yield supabase_1.supabaseAdmin
                    .from('bouncers')
                    .update(bouncerUpdates)
                    .eq('id', existingBouncer.id)
                    .select()
                    .single();
                if (bouncerError)
                    throw bouncerError;
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
            const { data: bouncer } = yield supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.updateProfile = updateProfile;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { data: user, error } = yield supabase_1.supabaseAdmin
            .from('users')
            .select('*, bouncers(*)')
            .eq('id', userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const responseUser = {
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
            const { data: bouncer } = yield supabase_1.supabaseAdmin
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
    }
    catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getProfile = getProfile;
