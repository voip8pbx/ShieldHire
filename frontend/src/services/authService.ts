import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    getAuth,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
} from '@react-native-firebase/auth';

// Firebase Web API key (from google-services.json → api_key.current_key)
const FIREBASE_WEB_API_KEY = 'AIzaSyBAkIvJKRX5Egk-nK4f9myUWD07fr5uoFY';

// Initialize Google Sign-In
export const initGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '475575826072-boqj4svjnan55e3ba887qd0nsmj3ivtu.apps.googleusercontent.com',
        scopes: ['email', 'profile'],
    });
};

/**
 * Exchanges a Google ID token for a Firebase ID token using the
 * Firebase Identity Toolkit REST API.
 *
 * This avoids calling GoogleAuthProvider.credential() from the
 * React Native Firebase SDK, which is broken in v22/23 Bridgeless mode.
 */
const exchangeGoogleTokenForFirebaseToken = async (googleIdToken: string): Promise<{
    firebaseToken: string;
    email: string;
    displayName: string;
    photoUrl: string;
    uid: string;
}> => {
    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_WEB_API_KEY}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            postBody: `id_token=${googleIdToken}&providerId=google.com`,
            requestUri: 'http://localhost',
            returnIdpCredential: true,
            returnSecureToken: true,
        }),
    });

    const data = await response.json();

    if (!response.ok || !data.idToken) {
        const msg = data?.error?.message || 'Firebase token exchange failed';
        console.error('[AuthService] Firebase REST error:', data?.error);
        throw new Error(msg);
    }

    return {
        firebaseToken: data.idToken,
        email: data.email || '',
        displayName: data.displayName || data.email?.split('@')[0] || '',
        photoUrl: data.photoUrl || '',
        uid: data.localId || '',
    };
};

// Sign in with Google → Firebase REST exchange → return Firebase ID token
export const signInWithGoogle = async (forceAccountPicker = false) => {
    // 1. Ensure Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2. Optionally force account picker (so user can pick a different account)
    if (forceAccountPicker) {
        try { await GoogleSignin.signOut(); } catch (_) { }
    }

    // 3. Trigger the native Google Sign-In UI
    const signInResult = await GoogleSignin.signIn();

    // 4. Extract the Google ID token (v13+ style first, legacy fallback)
    let googleIdToken = signInResult.data?.idToken;
    if (!googleIdToken) {
        googleIdToken = (signInResult as any).idToken;
    }
    if (!googleIdToken) {
        throw new Error('No ID token returned from Google Sign-In');
    }

    // 5. Exchange the Google token for a Firebase ID token via REST (no SDK needed)
    const { firebaseToken, email, displayName, photoUrl, uid } =
        await exchangeGoogleTokenForFirebaseToken(googleIdToken);

    // Return a shape compatible with the rest of the app
    return {
        firebaseUser: { uid, email, displayName, photoURL: photoUrl },
        firebaseToken,
    };
};

// Sign out from Google (Firebase client state is not used, so no Firebase signOut needed)
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
export const getIdToken = (user: any) => user.getIdToken();
export const signOut = (_authInstance: any) => firebaseSignOut(getAuth());
