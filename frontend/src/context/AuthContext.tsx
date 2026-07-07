import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User } from '../types';
import { setAuthToken } from '../services/api';
import { initGoogleSignIn, getAuth, onAuthStateChanged, getIdToken, signOut } from '../services/authService';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initFCM, cleanupFCMListeners } from '../services/fcmService';

const TOKEN_KEY = 'shield_auth_token';
const USER_KEY = 'shield_cached_user';

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
    // Guest Auth Flow
    guestSheetVisible: boolean;
    pendingRoute: { name: string; params?: any } | null;
    requireAuth: (navigation: any, routeName: string, params?: any) => void;
    hideGuestSheet: () => void;
    consumePendingRoute: (navigation: any) => void;
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
    guestSheetVisible: false,
    pendingRoute: null,
    requireAuth: () => { },
    hideGuestSheet: () => { },
    consumePendingRoute: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingBouncerRegistration, setPendingBouncerRegistration] = useState<PendingBouncerReg>(null);
    const [guestSheetVisible, setGuestSheetVisible] = useState(false);
    const [pendingRoute, setPendingRoute] = useState<{ name: string; params?: any } | null>(null);

    // Ref to track whether auto-login from onAuthStateChanged should be suppressed.
    // This prevents the race condition during bouncer Google sign-in where
    // onAuthStateChanged fires and routes the user to ClientMain before
    // LoginScreen can check the bouncer profile and navigate to registration.
    const suppressAutoLoginRef = useRef(false);

    useEffect(() => {
        initGoogleSignIn();

        const checkStoredToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
                if (storedToken) {
                    console.log('[AuthContext] Found stored token, restoring session...');
                    await fetchAndSetUser(storedToken);
                } else {
                    setIsLoading(false);
                }
            } catch (e) {
                console.error('[AuthContext] Error checking stored token:', e);
                setIsLoading(false);
            }
        };

        checkStoredToken();

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
                // If the SDK says no user, but we haven't checked AsyncStorage yet, 
                // do nothing and let checkStoredToken finish.
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchAndSetUser = async (accessToken: string) => {
        try {
            setAuthToken(accessToken);
            const response = await api.get('/auth/me');
            const fetchedUser: User = response.data.user;
            setToken(accessToken);
            setUser(fetchedUser);
            // Persist both token and user so we can restore offline
            await AsyncStorage.multiSet([
                [TOKEN_KEY, accessToken],
                [USER_KEY, JSON.stringify(fetchedUser)],
            ]);

            // Initialise FCM now that we have a confirmed user
            if (fetchedUser?.id) {
                initFCM(fetchedUser.id).catch(err =>
                    console.error('[AuthContext] FCM init failed:', err),
                );
            }
        } catch (error: any) {
            const httpStatus = error?.response?.status;
            if (httpStatus === 401 || httpStatus === 403) {
                // Token is genuinely invalid — clear the session entirely
                console.warn('[AuthContext] Token rejected by server, clearing session.');
                setAuthToken(null);
                setToken(null);
                setUser(null);
                await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            } else {
                // Network error or server unreachable — restore the cached user
                // so the app stays navigable until connectivity is restored.
                console.warn('[AuthContext] Could not reach server, restoring cached session:', error?.message);
                setAuthToken(accessToken);
                setToken(accessToken);
                try {
                    const cachedUserJson = await AsyncStorage.getItem(USER_KEY);
                    if (cachedUserJson) {
                        setUser(JSON.parse(cachedUserJson));
                    }
                } catch (_) { }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, newUser: User) => {
        // Clear all bouncer registration state and suppress flags
        suppressAutoLoginRef.current = false;
        setPendingBouncerRegistration(null);
        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
        await AsyncStorage.multiSet([
            [TOKEN_KEY, newToken],
            [USER_KEY, JSON.stringify(newUser)],
        ]);
    };

    const logout = async () => {
        suppressAutoLoginRef.current = false;
        setPendingBouncerRegistration(null);
        // Stop FCM listeners before clearing credentials
        cleanupFCMListeners();
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            const firebaseAuth = getAuth();
            await signOut(firebaseAuth);
        } catch (_) { }
        setToken(null);
        setUser(null);
        setAuthToken(null);
    };

    const updateUser = (updatedUser: Partial<User>) => {
        // When bouncer registration completes and updateUser is called,
        // clear the pending registration flag so App.tsx re-evaluates navigation
        setPendingBouncerRegistration(null);
        setUser(prev => {
            const newUser = { ...prev, ...updatedUser } as User;
            AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)).catch(() => {});
            return newUser;
        });
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
        AsyncStorage.setItem(TOKEN_KEY, newToken).catch(() => { });
        // Keep suppress flag on — it will be cleared when login() is called after registration
    };

    const suppressAutoLogin = () => {
        suppressAutoLoginRef.current = true;
    };

    const resumeAutoLogin = () => {
        suppressAutoLoginRef.current = false;
    };

    const requireAuth = (navigation: any, routeName: string, params?: any) => {
        if (token === 'guest_token') {
            setPendingRoute({ name: routeName, params });
            setGuestSheetVisible(true);
        } else {
            navigation.navigate(routeName, params);
        }
    };

    const hideGuestSheet = () => {
        setGuestSheetVisible(false);
    };

    const consumePendingRoute = (navigation: any) => {
        if (pendingRoute) {
            navigation.navigate(pendingRoute.name, pendingRoute.params);
            setPendingRoute(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token, isLoading, pendingBouncerRegistration,
            login, logout, updateUser,
            startBouncerRegistration, suppressAutoLogin, resumeAutoLogin,
            guestSheetVisible, pendingRoute, requireAuth, hideGuestSheet, consumePendingRoute,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
