import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    GoogleAuthProvider,
    getAuth,
    signInWithCredential,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
} from '@react-native-firebase/auth';

// Initialize Google Sign-In
export const initGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: '475575826072-boqj4svjnan55e3ba887qd0nsmj3ivtu.apps.googleusercontent.com',
        scopes: ['email', 'profile'],
    });
};

// Sign in with Google → Firebase Auth → return Firebase user + ID token
export const signInWithGoogle = async (forceAccountPicker = false) => {
    // Check Google Play Services availability
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    if (forceAccountPicker) {
        try { await GoogleSignin.signOut(); } catch (_) { }
    }

    // Trigger the Google sign-in UI
    const signInResult = await GoogleSignin.signIn();

    // Try the new style of google-sign in result, from v13+ of that module
    let idToken = signInResult.data?.idToken;
    if (!idToken) {
        // if you are using older versions of google-signin, try old style result
        idToken = (signInResult as any).idToken;
    }

    if (!idToken) {
        throw new Error('No ID token returned from Google Sign-In');
    }

    // Create a Google credential with the token (modular API)
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential (modular API)
    const userCredential = await signInWithCredential(getAuth(), googleCredential);

    // Get Firebase ID token to send to backend
    const firebaseToken = await userCredential.user.getIdToken();

    return {
        firebaseUser: userCredential.user,
        firebaseToken,
    };
};

// Sign out from both Google and Firebase
export const signOutUser = async () => {
    try {
        await GoogleSignin.signOut();
        await firebaseSignOut(getAuth());
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
};

// Compatibility exports for AuthContext
export { getAuth };
export const onAuthStateChanged = (authInstance: any, callback: any) =>
    firebaseOnAuthStateChanged(authInstance, callback);
export const getIdToken = (user: any) => user.getIdToken();
export const signOut = (_authInstance: any) => firebaseSignOut(getAuth());
