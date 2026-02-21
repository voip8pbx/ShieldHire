import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import {
    getAuth,
    signInWithCredential,
    getIdToken,
    signOut,
    onAuthStateChanged,
} from '@react-native-firebase/auth/lib/modular';

// Initialize Google Sign-In with Web Client ID (type 3) from google-services.json
export const initGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '475575826072-boqj4svjnan55e3ba887qd0nsmj3ivtu.apps.googleusercontent.com',
        scopes: ['email', 'profile'],
    });
};

// Sign in with Google → Firebase Auth → return Firebase user + ID token
// forceAccountPicker: true = show account picker every time (used for client)
// forceAccountPicker: false = silently reuse signed-in account if available (used for bouncer)
export const signInWithGoogle = async (forceAccountPicker = false) => {
    // Check Google Play Services availability
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    if (forceAccountPicker) {
        // Sign out to force the account picker UI
        try { await GoogleSignin.signOut(); } catch (_) { }
    }

    // Trigger the Google sign-in UI (or silently reuse session)
    const signInResult = await GoogleSignin.signIn();

    // Handle both old and new SDK response shapes
    const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;

    if (!idToken) {
        throw new Error('No ID token returned from Google Sign-In');
    }

    // Use auth.GoogleAuthProvider (correctly exported from main package)
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in using modular API
    const firebaseAuth = getAuth();
    const userCredential = await signInWithCredential(firebaseAuth, googleCredential);

    // Get Firebase ID token to send to backend
    const firebaseToken = await getIdToken(userCredential.user);

    return {
        firebaseUser: userCredential.user,
        firebaseToken,
    };
};

// Sign out from both Google and Firebase
export const signOutUser = async () => {
    try {
        await GoogleSignin.signOut();
        const firebaseAuth = getAuth();
        await signOut(firebaseAuth);
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
};

// Re-export modular functions for AuthContext
export { getAuth, onAuthStateChanged, getIdToken, signOut };
