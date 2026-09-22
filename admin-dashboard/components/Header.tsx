'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '@/lib/supabase';

interface HeaderProps {
    onMenuClick: () => void;
}

interface NotifItem {
    id: string;
    type: 'verification' | 'alert';
    title: string;
    subtitle: string;
    time: string;
    href: string;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // ── Notification state ────────────────────────────────────────────────────
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifs, setNotifs] = useState<NotifItem[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // ── Theme init ────────────────────────────────────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem('dashboard-theme');
        if (stored) {
            setTheme(stored as 'dark' | 'light');
            document.documentElement.setAttribute('data-theme', stored);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('dashboard-theme', next);
        document.documentElement.setAttribute('data-theme', next);
    };

    // ── Fetch notifications ───────────────────────────────────────────────────
    const fetchNotifs = useCallback(async () => {
        setNotifLoading(true);
        try {
            const items: NotifItem[] = [];

            // 1. Pending bouncer verifications
            const verfRes = await fetch('/api/verifications?status=PENDING', { cache: 'no-store' });
            if (verfRes.ok) {
                const verifications: any[] = await verfRes.json();
                verifications.slice(0, 5).forEach((v: any) => {
                    items.push({
                        id: `v-${v.id}`,
                        type: 'verification',
                        title: `${v.name || 'Bouncer'} awaiting verification`,
                        subtitle: v.registrationType || 'Individual',
                        time: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '',
                        href: '/verifications',
                    });
                });
            }

            // 2. Open emergency alerts from Supabase realtime
            const { data: alerts } = await supabase
                .from('emergency_alerts')
                .select('id, location, createdAt, users(name)')
                .eq('status', 'OPEN')
                .order('createdAt', { ascending: false })
                .limit(5);

            (alerts || []).forEach((a: any) => {
                const user = Array.isArray(a.users) ? a.users[0] : a.users;
                items.push({
                    id: `a-${a.id}`,
                    type: 'alert',
                    title: `SOS — ${user?.name || 'Unknown user'}`,
                    subtitle: a.location || 'Location unknown',
                    time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    href: '/',
                });
            });

            setNotifs(items);
        } catch (e) {
            console.error('[Notifs] Fetch failed:', e);
        } finally {
            setNotifLoading(false);
        }
    }, []);

    // Fetch on open
    useEffect(() => {
        if (notifOpen) fetchNotifs();
    }, [notifOpen, fetchNotifs]);

    // Supabase realtime — bump count when new alert comes in while dropdown is closed
    useEffect(() => {
        const channel = supabase
            .channel('header_alerts_count')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emergency_alerts' }, () => {
                // Re-fetch silently to update badge
                fetchNotifs();
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchNotifs]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Initial silent fetch for badge count
    useEffect(() => {
        fetchNotifs();
        const id = setInterval(fetchNotifs, 60_000);
        return () => clearInterval(id);
    }, [fetchNotifs]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        const seg = path.split('/').filter(Boolean);
        return seg.length > 0 ? seg[0].charAt(0).toUpperCase() + seg[0].slice(1) : 'Dashboard';
    };

    const alertCount = notifs.filter(n => n.type === 'alert').length;
    const verfCount  = notifs.filter(n => n.type === 'verification').length;
    const totalCount = notifs.length;

    return (
        <header className="header border-b-3 border-text-primary bg-bg-secondary px-3 sm:px-6">
            {/* Left */}
            <div className="flex items-center gap-3">
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

            {/* Right */}
            <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Search — desktop only */}
                <div className="relative hidden md:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input type="text" className="input-field w-48 lg:w-64 pl-10 border-2 border-text-primary" placeholder="SEARCH SYSTEM..." />
                </div>

                {/* Theme toggle */}
                <button onClick={toggleTheme} className="btn btn-sm btn-icon border-2 border-text-primary hover:bg-surface-hover" aria-label="Toggle theme">
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                {/* ── Notification Bell ── */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotifOpen(o => !o)}
                        className={`btn btn-sm btn-icon border-2 relative transition-colors
                            ${notifOpen
                                ? 'bg-primary-yellow border-black text-black'
                                : 'border-text-primary hover:bg-surface-hover'
                            }`}
                        aria-label="Notifications"
                    >
                        {/* Badge */}
                        {totalCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-error border border-black text-white text-[8px] font-black font-mono flex items-center justify-center z-10">
                                {totalCount > 9 ? '9+' : totalCount}
                            </span>
                        )}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>

                    {/* ── Dropdown ── */}
                    {notifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-bg-secondary border-3 border-text-primary shadow-[4px_4px_0px_0px_var(--text-primary)] z-[200]">
                            {/* Header row */}
                            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-text-primary bg-bg-primary">
                                <div>
                                    <span className="text-xs font-black font-mono uppercase tracking-widest text-text-primary">
                                        NOTIFICATIONS
                                    </span>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        {verfCount > 0 && (
                                            <span className="text-[9px] font-black font-mono text-warning uppercase">
                                                {verfCount} PENDING_VER
                                            </span>
                                        )}
                                        {alertCount > 0 && (
                                            <span className="text-[9px] font-black font-mono text-error uppercase animate-pulse">
                                                {alertCount} SOS_ALERT
                                            </span>
                                        )}
                                        {totalCount === 0 && !notifLoading && (
                                            <span className="text-[9px] font-black font-mono text-text-dim uppercase">ALL_CLEAR</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { fetchNotifs(); }}
                                    className="text-[9px] font-black font-mono text-primary-yellow uppercase tracking-wider hover:underline"
                                    title="Refresh"
                                >
                                    [ REFRESH ]
                                </button>
                            </div>

                            {/* Items */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifLoading ? (
                                    <div className="flex items-center justify-center py-8 gap-3">
                                        <div className="w-4 h-4 border-2 border-primary-yellow border-t-transparent animate-spin" />
                                        <span className="text-[10px] font-black font-mono text-text-dim uppercase tracking-widest">
                                            FETCHING...
                                        </span>
                                    </div>
                                ) : notifs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                                        <svg className="w-8 h-8 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-[10px] font-black font-mono text-text-dim uppercase tracking-widest">
                                            SYSTEM_CLEAR
                                        </span>
                                        <span className="text-[9px] font-mono text-text-tertiary">No pending items</span>
                                    </div>
                                ) : (
                                    notifs.map((n, i) => (
                                        <a
                                            key={n.id}
                                            href={n.href}
                                            onClick={() => setNotifOpen(false)}
                                            className={`
                                                flex items-start gap-3 px-4 py-3 border-b border-border-brand
                                                hover:bg-surface-hover transition-colors group
                                                ${i === notifs.length - 1 ? 'border-b-0' : ''}
                                            `}
                                        >
                                            {/* Type icon */}
                                            <div className={`
                                                shrink-0 w-8 h-8 border-2 flex items-center justify-center mt-0.5
                                                ${n.type === 'alert'
                                                    ? 'bg-error/10 border-error text-error'
                                                    : 'bg-warning/10 border-warning text-warning'
                                                }
                                            `}>
                                                {n.type === 'alert' ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-black text-text-primary font-mono truncate group-hover:text-primary-yellow transition-colors">
                                                    {n.title}
                                                </div>
                                                <div className="text-[10px] text-text-dim font-mono mt-0.5 truncate">
                                                    {n.subtitle}
                                                </div>
                                            </div>

                                            {/* Time */}
                                            <div className="text-[9px] font-mono text-text-tertiary shrink-0 mt-0.5">
                                                {n.time}
                                            </div>
                                        </a>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifs.length > 0 && (
                                <div className="border-t-2 border-text-primary px-4 py-2 flex items-center justify-between bg-bg-primary">
                                    <span className="text-[9px] font-black font-mono text-text-dim uppercase tracking-widest">
                                        {totalCount} ITEM{totalCount !== 1 ? 'S' : ''} TOTAL
                                    </span>
                                    <a
                                        href="/verifications"
                                        onClick={() => setNotifOpen(false)}
                                        className="text-[9px] font-black font-mono text-primary-yellow uppercase tracking-wider hover:underline"
                                    >
                                        VIEW_ALL →
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="flex items-center gap-1.5 sm:gap-3 border-l-2 border-text-primary pl-2 sm:pl-4">
                    <div className="hidden sm:block text-right">
                        <div className="text-xs font-black text-text-primary uppercase tracking-wider font-mono">ADMIN_SHIELD</div>
                        <div className="text-[10px] font-bold text-primary-yellow uppercase tracking-widest font-mono">SUPER_OPERATOR</div>
                    </div>
                    <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary-yellow border-2 border-text-primary flex items-center justify-center text-black font-black text-sm font-mono shadow-[2px_2px_0px_0px_var(--text-primary)]">
                        AD
                    </div>
                </div>

                {/* Logout */}
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
