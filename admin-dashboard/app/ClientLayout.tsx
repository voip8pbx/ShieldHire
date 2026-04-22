'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Set window width on mount and resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        // Initialize if not already set (should be set by useState above, but just in case)
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
        }
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change (mobile only)
    useEffect(() => {
        const handleRouteChange = () => {
            if (windowWidth < 481) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, [windowWidth]);

    // On resize to tablet and up, we may want to adjust sidebar state?
    // We'll keep sidebarOpen state as is, but we can adjust default behavior via useEffect for initial state?
    // We'll set initial sidebarOpen based on width: true for tablet and up, false for mobile.
    useEffect(() => {
        if (!mounted) {
            // Set initial state based on width
            setSidebarOpen(windowWidth >= 481);
        }
    }, [mounted, windowWidth]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={sidebarOpen} windowWidth={windowWidth} onClose={closeSidebar} />

            <div className="main-content">
                <Header onMenuClick={toggleSidebar} />

                <main className="content-area">
                    <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
