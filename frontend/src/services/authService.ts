import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    getAuth,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signInWithCredential,
    GoogleAuthProvider,
} from '@react-native-firebase/auth';

// Initialize Google Sign-In
export const initGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '475575826072-boqj4svjnan55e3ba887qd0nsmj3ivtu.apps.googleusercontent.com',
        scopes: ['email', 'profile'],
    });
};

/**
 * Signs in with Google using the native Firebase SDK's signInWithCredential.
 * This is more reliable than the REST API approach because:
 * - The token exchange happens at the native layer (no JS network call)
 * - Not affected by Android network security config or HTTPS restrictions
 * - Works correctly in React Native New Architecture / Bridgeless mode with v23+
 */
export const signInWithGoogle = async (forceAccountPicker = false) => {
    // 1. Ensure Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2. Optionally force account picker (so user can pick a different account)
    if (forceAccountPicker) {
        try { await GoogleSignin.signOut(); } catch (_) { }
    }

    // 3. Trigger the native Google Sign-In UI
    const signInResult = await GoogleSignin.signIn();
    console.log('[AuthService] Google Sign-In result:', JSON.stringify(signInResult));

    // 4. Handle v13+ response shape: { type: 'success' | 'cancelled' | 'noSavedCredentialFound', data }
    if (signInResult.type === 'cancelled') {
        const cancelError: any = new Error('Sign-in cancelled');
        cancelError.code = '12501';
        throw cancelError;
    }

    if (signInResult.type !== 'success') {
        // At this point, type could be 'noSavedCredentialFound' or any future type
        const type = (signInResult as any).type || 'unknown';
        throw new Error(`Google Sign-In failed with type: ${type}`);
    }

    // 5. Extract the Google ID token
    let googleIdToken: string | null | undefined = signInResult.data?.idToken;
    // Legacy fallback for SDK versions that don't wrap in data
    if (!googleIdToken) {
        googleIdToken = (signInResult as any).idToken;
    }
    if (!googleIdToken) {
        throw new Error('No ID token returned from Google Sign-In');
    }

    // 6. Use the native Firebase SDK to exchange the Google ID token for a Firebase credential.
    //    signInWithCredential() works at the native layer — no JS fetch() needed.
    const credential = GoogleAuthProvider.credential(googleIdToken);
    const userCredential = await signInWithCredential(getAuth(), credential);
    const firebaseUser = userCredential.user;
    const firebaseToken = await firebaseUser.getIdToken();

    // Return a shape compatible with the rest of the app
    return {
        firebaseUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
        },
        firebaseToken,
    };
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
export const getIdToken = (user: any) => user.getIdToken();
export const signOut = (_authInstance: any) => firebaseSignOut(getAuth());
