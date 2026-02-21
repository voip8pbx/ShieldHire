import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

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

    // Handle both old and new SDK response shapes
    const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;

    if (!idToken) {
        throw new Error('No ID token returned from Google Sign-In');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);

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
        await auth().signOut();
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
};

// Compatibility exports for AuthContext
export const getAuth = () => auth();
export const onAuthStateChanged = (authInstance: any, callback: any) => authInstance.onAuthStateChanged(callback);
export const getIdToken = (user: any) => user.getIdToken();
export const signOut = (authInstance: any) => authInstance.signOut();
