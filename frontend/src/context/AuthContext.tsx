import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '../types';
import { setAuthToken } from '../services/api';
import { initGoogleSignIn, getAuth, onAuthStateChanged, getIdToken, signOut } from '../services/authService';
import api from '../services/api';

type PendingBouncerReg = {
    name: string;
    email: string;
    photo: string;
} | null;

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    pendingBouncerRegistration: PendingBouncerReg;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    /**
     * Set bouncer registration as pending. This:
     * 1. Suppresses onAuthStateChanged auto-login
     * 2. Stores the registration params so App.tsx can show BouncerRegistration
     * 3. Sets token so API calls work during registration
     */
    startBouncerRegistration: (token: string, user: User, regData: { name: string; email: string; photo: string }) => void;
    /** Suppress onAuthStateChanged auto-login (used before Google sign-in) */
    suppressAutoLogin: () => void;
    /** Resume onAuthStateChanged auto-login (used on error) */
    resumeAutoLogin: () => void;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    pendingBouncerRegistration: null,
    login: () => { },
    logout: () => { },
    updateUser: () => { },
    startBouncerRegistration: () => { },
    suppressAutoLogin: () => { },
    resumeAutoLogin: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingBouncerRegistration, setPendingBouncerRegistration] = useState<PendingBouncerReg>(null);

    // Ref to track whether auto-login from onAuthStateChanged should be suppressed.
    // This prevents the race condition during bouncer Google sign-in where
    // onAuthStateChanged fires and routes the user to ClientMain before
    // LoginScreen can check the bouncer profile and navigate to registration.
    const suppressAutoLoginRef = useRef(false);

    useEffect(() => {
        initGoogleSignIn();

        const firebaseAuth = getAuth();
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: any) => {
            // If the bouncer sign-in flow is in progress, skip auto-login.
            // The LoginScreen will handle login explicitly via startBouncerRegistration() or login().
            if (suppressAutoLoginRef.current) {
                console.log('[AuthContext] Auto-login suppressed (bouncer flow in progress)');
                setIsLoading(false);
                return;
            }

            if (firebaseUser) {
                try {
                    const idToken = await getIdToken(firebaseUser);
                    await fetchAndSetUser(idToken);
                } catch (error) {
                    console.error('Error getting Firebase token:', error);
                    setIsLoading(false);
                }
            } else {
                setToken(null);
                setUser(null);
                setAuthToken(null);
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchAndSetUser = async (accessToken: string) => {
        try {
            setAuthToken(accessToken);
            const response = await api.get('/auth/me');
            setToken(accessToken);
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            setAuthToken(null);
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = (newToken: string, newUser: User) => {
        // Clear all bouncer registration state and suppress flags
        suppressAutoLoginRef.current = false;
        setPendingBouncerRegistration(null);
        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
    };

    const logout = async () => {
        suppressAutoLoginRef.current = false;
        setPendingBouncerRegistration(null);
        try {
            const firebaseAuth = getAuth();
            await signOut(firebaseAuth);
        } catch (_) { }
        setToken(null);
        setUser(null);
        setAuthToken(null);
    };

    const updateUser = (updatedUser: User) => {
        // When bouncer registration completes and updateUser is called,
        // clear the pending registration flag so App.tsx re-evaluates navigation
        setPendingBouncerRegistration(null);
        setUser(prev => ({ ...prev, ...updatedUser }));
    };

    const startBouncerRegistration = (
        newToken: string,
        newUser: User,
        regData: { name: string; email: string; photo: string }
    ) => {
        // Set the token and user so API calls work, but also set the pending flag
        // so App.tsx knows to show BouncerRegistration instead of ClientMain
        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
        setPendingBouncerRegistration(regData);
        // Keep suppress flag on — it will be cleared when login() is called after registration
    };

    const suppressAutoLogin = () => {
        suppressAutoLoginRef.current = true;
    };

    const resumeAutoLogin = () => {
        suppressAutoLoginRef.current = false;
    };

    return (
        <AuthContext.Provider value={{
            user, token, isLoading, pendingBouncerRegistration,
            login, logout, updateUser,
            startBouncerRegistration, suppressAutoLogin, resumeAutoLogin,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
