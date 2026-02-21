import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { setAuthToken } from '../services/api';
import { initGoogleSignIn, getAuth, onAuthStateChanged, getIdToken, signOut } from '../services/authService';
import api from '../services/api';

type AuthContextType = {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: true,
    login: () => { },
    logout: () => { },
    updateUser: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initGoogleSignIn();

        const firebaseAuth = getAuth();
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: any) => {
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
        setToken(newToken);
        setUser(newUser);
        setAuthToken(newToken);
    };

    const logout = async () => {
        try {
            const firebaseAuth = getAuth();
            await signOut(firebaseAuth);
        } catch (_) { }
        setToken(null);
        setUser(null);
        setAuthToken(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(prev => ({ ...prev, ...updatedUser }));
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
