import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ENV } from '../config/env';
import {
    getAuth,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signInWithCredential,
    GoogleAuthProvider,
    getIdToken as firebaseGetIdToken,
} from '@react-native-firebase/auth';

// Initialize Google Sign-In
export const initGoogleSignIn = () => {
    try {
        GoogleSignin.configure({
            webClientId: ENV.GOOGLE_WEB_CLIENT_ID || '376211888391-02rulpap4r0taldp1ml91a69dpg9gscb.apps.googleusercontent.com',
            offlineAccess: true,
        });
    } catch (err) {
        console.warn('[AuthService] GoogleSignin.configure error:', err);
    }
};

/**
 * Signs in with Google using native Google Sign-In and extracts profile info.
 * Attempts optional Firebase credential exchange without crashing if Firebase
 * Auth provider is not enabled on the Firebase project.
 */
export const signInWithGoogle = async (
    forceAccountPicker = false,
    role: 'client' | 'bouncer' = 'client'
) => {
    try {
        let isExpoGo = false;
        try {
            const Constants = require('expo-constants').default || require('expo-constants');
            isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
        } catch (_) {}
        if (!isExpoGo) {
            isExpoGo = typeof globalThis !== 'undefined' && Boolean((globalThis as any).__IS_EXPO_GO__);
        }

        if (isExpoGo) {
            console.log(`[AuthService] Running in Expo Go — activating demo Google authentication session for role: ${role}`);
            if (role === 'bouncer') {
                return {
                    firebaseUser: {
                        uid: 'google_expo_demo_bouncer_mayur',
                        email: 'mapyur06@gmail.com',
                        displayName: 'Mayur P (Bouncer)',
                        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                    },
                    firebaseToken: 'expo_demo_bouncer_token',
                };
            }

            return {
                firebaseUser: {
                    uid: 'google_expo_demo_user_rishi',
                    email: 'rishi076@gmail.com',
                    displayName: 'Rishi (Demo User)',
                    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                },
                firebaseToken: 'expo_demo_firebase_token',
            };
        }

        // Guarantee GoogleSignin is configured before any calls
        initGoogleSignIn();

        // 1. Ensure Google Play Services are available
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

        // 2. Optionally force account picker (so user can pick a different account)
        if (forceAccountPicker) {
            try { await GoogleSignin.signOut(); } catch (_) { }
        }

        // 3. Trigger the native Google Sign-In UI
        const signInResult = await GoogleSignin.signIn();
        console.log('[AuthService] Google Sign-In result:', JSON.stringify(signInResult));

        // 4. Handle cancellation across various GoogleSignin library versions
        if (
            signInResult?.type === 'cancelled' ||
            (signInResult as any)?.data?.type === 'cancelled' ||
            (signInResult as any)?.type === 'noSavedCredentialFound'
        ) {
            const cancelError: any = new Error('Sign-in cancelled');
            cancelError.code = '12501';
            throw cancelError;
        }

        if (signInResult?.type && signInResult.type !== 'success') {
            const type = (signInResult as any).type || 'unknown';
            throw new Error(`Google Sign-In failed with type: ${type}`);
        }

        // 5. Extract user info directly from Google response
        const googleUser =
            (signInResult as any)?.data?.user ||
            (signInResult as any)?.user ||
            (signInResult as any)?.data ||
            {};
        let googleIdToken: string | null | undefined =
            (signInResult as any)?.data?.idToken ||
            (signInResult as any)?.idToken;

        const email = googleUser.email || '';
        const displayName = googleUser.name || (email ? email.split('@')[0] : 'User');
        const photoURL = googleUser.photo || '';
        const uid = googleUser.id || (googleIdToken ? googleIdToken.slice(-16) : `google_${Date.now()}`);

        if (!email) {
            throw new Error('No email returned from Google Sign-In. Please check Google account permissions.');
        }

        // 6. Graceful Firebase token attempt (non-blocking fallback)
        let firebaseToken = googleIdToken || 'google_auth_token';
        let resolvedUid = uid;

        if (googleIdToken) {
            try {
                const credential = GoogleAuthProvider.credential(googleIdToken);
                const userCredential = await signInWithCredential(getAuth(), credential);
                if (userCredential?.user) {
                    resolvedUid = userCredential.user.uid || uid;
                    const token = await firebaseGetIdToken(userCredential.user);
                    if (token) firebaseToken = token;
                }
            } catch (fbErr: any) {
                console.warn('[AuthService] Firebase credential exchange bypassed (using direct Google profile):', fbErr?.message || fbErr);
            }
        }

        // Return a shape compatible with the rest of the app
        return {
            firebaseUser: {
                uid: resolvedUid,
                email,
                displayName,
                photoURL,
            },
            firebaseToken,
        };
    } catch (error: any) {
        if (error?.code === '10' || error?.message?.includes('DEVELOPER_ERROR')) {
            console.error('[AuthService] Google Sign-In DEVELOPER_ERROR (10): Google Play Services rejected app signature. Add Release SHA-1 (39:52:D4:61:30:7E:81:B4:63:BD:13:EA:7D:B5:CA:02:22:C6:33:6D) to Firebase Console.');
        }
        throw error;
    }
};

// Sign out from Google and Firebase
export const signOutUser = async () => {
    try {
        await GoogleSignin.signOut();
        await firebaseSignOut(getAuth());
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
};

// Compatibility exports used by AuthContext
export { getAuth };
export const onAuthStateChanged = (authInstance: any, callback: any) =>
    firebaseOnAuthStateChanged(authInstance, callback);
export const getIdToken = (user: any) => firebaseGetIdToken(user);
export const signOut = (_authInstance: any) => firebaseSignOut(getAuth());
