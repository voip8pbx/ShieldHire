'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const storedTheme = localStorage.getItem('dashboard-theme');
        if (storedTheme) {
            setTheme(storedTheme as 'dark' | 'light');
            document.documentElement.setAttribute('data-theme', storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('dashboard-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Helper to get readable title from pathname
    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        const segments = path.split('/').filter(Boolean);
        return segments.length > 0
            ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
            : 'Dashboard';
    };

    return (
        <header className="header border-b-3 border-text-primary bg-bg-secondary px-3 sm:px-6">
            {/* Left: Menu Button & Page Title */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="btn btn-sm btn-icon md:hidden border-2 border-text-primary hover:bg-surface-hover"
                    aria-label="Toggle menu"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h2 className="text-sm sm:text-xl font-black text-text-primary tracking-wider uppercase font-mono truncate max-w-[140px] sm:max-w-none">
                    {getPageTitle(pathname)}
                </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Global Search - Hidden on mobile */}
                <div className="relative hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-primary-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="input-field w-48 lg:w-64 pl-10 border-2 border-text-primary"
                        placeholder="SEARCH SYSTEM..."
                    />
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="btn btn-sm btn-icon border-2 border-text-primary hover:bg-surface-hover"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        // Sun icon for light mode
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        // Moon icon for dark mode
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                {/* Notifications */}
                <button className="btn btn-sm btn-icon border-2 border-text-primary relative hover:bg-surface-hover" aria-label="Notifications">
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-error border border-black"></span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                </button>

                {/* Profile Widget */}
                <div className="flex items-center gap-1.5 sm:gap-3 border-l-2 border-text-primary pl-2 sm:pl-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-xs font-black text-text-primary uppercase tracking-wider font-mono">ADMIN_SHIELD</div>
                        <div className="text-[10px] font-bold text-primary-yellow uppercase tracking-widest font-mono">SUPER_OPERATOR</div>
                    </div>
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-none bg-primary-yellow border-2 border-text-primary flex items-center justify-center text-black font-black text-sm font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        AD
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={async () => {
                        try {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            window.location.href = '/login';
                        } catch (err) {
                            console.error('Logout error:', err);
                        }
                    }}
                    className="btn btn-sm btn-icon border-2 border-text-primary text-error hover:bg-error hover:text-white"
                    aria-label="Logout"
                    title="Sign Out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
}


