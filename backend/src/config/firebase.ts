import admin from 'firebase-admin';

// Firebase Admin can verify ID tokens with just the projectId set
// (token verification uses Google's public JWKS endpoint, no private key needed)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'sheildhire',
    });
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();
