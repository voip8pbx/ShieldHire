import React, { createContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'dark';

export const THEME_COLORS = {
    light: {
        background: '#F5F5F7',
        card: '#FFFFFF',
        textPrimary: '#000000',
        textSecondary: '#666666',
        border: '#E5E5EA',
        gold: '#D4AF37', // Kept premium gold
        inputBg: '#F0F0F2',
        bubbleSelf: '#D4AF37',
        bubbleOther: '#E5E5EA',
        bubbleTextSelf: '#000000',
        bubbleTextOther: '#000000',
        tabBar: '#FFFFFF',
        success: '#34C759',
        danger: '#FF3B30',
        overlay: 'rgba(255, 255, 255, 0.8)',
    },
    dark: {
        background: '#090909',
        card: '#1A1A1A',
        textPrimary: '#FFFFFF',
        textSecondary: '#B0B0B0',
        border: 'rgba(255, 255, 255, 0.08)',
        gold: '#FFD700',
        inputBg: '#222222',
        bubbleSelf: '#FFD700',
        bubbleOther: '#222222',
        bubbleTextSelf: '#000000',
        bubbleTextOther: '#FFFFFF',
        tabBar: '#121212',
        success: '#4ade80',
        danger: '#FF453A',
        overlay: 'rgba(0, 0, 0, 0.8)',
    }
};

export interface ThemeContextProps {
    theme: ThemeType;
    colors: typeof THEME_COLORS.dark;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
    theme: 'dark',
    colors: THEME_COLORS.dark,
    toggleTheme: () => { },
    setTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeType>('dark');

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem('@theme', newTheme);
    };

    const toggleTheme = () => { };

    const colors = THEME_COLORS[theme];

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
