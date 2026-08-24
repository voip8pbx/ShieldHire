import admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
        console.warn('[FIREBASE] FIREBASE_PROJECT_ID not set — Firebase token verification will be unavailable.');
    } else {
        console.log('[FIREBASE] Initializing with Project ID:', projectId);
        admin.initializeApp({ projectId });
    }
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
