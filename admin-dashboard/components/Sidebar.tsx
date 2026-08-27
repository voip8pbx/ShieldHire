'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarProps {
    isOpen: boolean;
    windowWidth: number;
    onClose: () => void;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const IconDashboard = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="0" />
        <rect x="14" y="3" width="7" height="7" rx="0" />
        <rect x="3" y="14" width="7" height="7" rx="0" />
        <rect x="14" y="14" width="7" height="7" rx="0" />
    </svg>
);

const IconShield = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 3l7 3.5V12c0 4-3 7-7 8-4-1-7-4-7-8V6.5L12 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
);

const IconBouncers = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
        <path strokeLinecap="square" d="M3 20a9 9 0 0118 0" />
    </svg>
);

const IconUsers = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="square" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const IconCalendar = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="0" />
        <path strokeLinecap="square" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
);

const IconMap = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
    </svg>
);

// ── Nav config ───────────────────────────────────────────────────────────────

const navItems = [
    { name: 'Dashboard',     href: '/',             icon: IconDashboard,  badgeKey: null },
    { name: 'Verifications', href: '/verifications', icon: IconShield,     badgeKey: 'pendingVerifications' },
    { name: 'Bouncers',      href: '/bouncers',      icon: IconBouncers,   badgeKey: null },
    { name: 'Users',         href: '/users',          icon: IconUsers,      badgeKey: null },
    { name: 'Engagements',   href: '/engagements',    icon: IconCalendar,   badgeKey: null },
    { name: 'Live Tracking', href: '/tracking',       icon: IconMap,        badgeKey: null },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({ isOpen, windowWidth, onClose }: SidebarProps) {
    const pathname = usePathname();
    const isMobile = windowWidth < 769;

    // Live badge counts
    const [pendingVerifications, setPendingVerifications] = useState<number | null>(null);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setPendingVerifications(data.pendingVerifications ?? null);
                }
            } catch {
                // silently fail — badge just won't show
            }
        };

        fetchCounts();
        // Refresh every 60s
        const id = setInterval(fetchCounts, 60_000);
        return () => clearInterval(id);
    }, []);

    const badgeCounts: Record<string, number | null> = {
        pendingVerifications,
    };

    const handleLinkClick = () => {
        if (isMobile) onClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar border-r-3 border-text-primary ${isMobile && !isOpen ? 'sidebar-collapsed' : ''}`}
                style={{ width: 280 }}
            >
                {/* ── Logo ── */}
                <div className="h-16 flex items-center gap-3 px-5 border-b-3 border-text-primary bg-bg-primary shrink-0">
                    <div className="w-9 h-9 bg-primary-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" className="w-5 h-5">
                            <path strokeLinecap="square" d="M12 3l7 3.5V12c0 4-3 7-7 8-4-1-7-4-7-8V6.5L12 3z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-sm font-black text-text-primary tracking-widest uppercase font-mono leading-none">
                            SHIELDHIRE
                        </div>
                        <div className="text-[9px] font-black text-primary-yellow tracking-widest uppercase font-mono mt-0.5">
                            OPS_CONSOLE
                        </div>
                    </div>
                </div>

                {/* ── Section label ── */}
                <div className="px-5 pt-5 pb-2">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-text-tertiary font-mono">
                        // NAVIGATION
                    </span>
                </div>

                {/* ── Nav ── */}
                <nav className="flex-1 px-3 overflow-y-auto pb-4">
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            const count = item.badgeKey ? badgeCounts[item.badgeKey] : null;
                            const showBadge = count !== null && count > 0;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={`
                                        group flex items-center justify-between
                                        px-3 py-2.5 border-2 font-mono font-black text-xs
                                        uppercase tracking-wider transition-all duration-100
                                        ${isActive
                                            ? 'bg-primary-yellow text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-0 translate-y-0'
                                            : 'text-text-muted border-transparent hover:border-text-primary hover:text-text-primary hover:bg-surface-hover hover:shadow-[2px_2px_0px_0px_var(--text-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Active indicator bar */}
                                        <span className={`
                                            shrink-0 transition-colors
                                            ${isActive ? 'text-black' : 'text-text-dim group-hover:text-text-primary'}
                                        `}>
                                            <Icon />
                                        </span>
                                        <span>{item.name}</span>
                                    </div>

                                    {/* Live badge */}
                                    {showBadge && (
                                        <span className={`
                                            inline-flex items-center justify-center min-w-[20px] h-5
                                            px-1.5 text-[9px] font-black font-mono border
                                            ${isActive
                                                ? 'bg-black text-primary-yellow border-black'
                                                : 'bg-error text-white border-transparent shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                            }
                                        `}>
                                            {count! > 99 ? '99+' : count}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* ── Divider + status ── */}
                <div className="px-5 pb-2">
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-text-tertiary font-mono">
                        // SYSTEM
                    </span>
                </div>

                {/* ── System status strip ── */}
                <div className="mx-3 mb-3 border-2 border-text-primary bg-bg-primary p-3 shadow-[2px_2px_0px_0px_var(--text-primary)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black font-mono text-text-tertiary uppercase tracking-widest">SYS_STATUS</span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-success rounded-none animate-pulse" />
                            <span className="text-[9px] font-black font-mono text-success uppercase">ONLINE</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-text-dim uppercase">PENDING_VER</span>
                        <span className="text-[9px] font-black font-mono text-primary-yellow">
                            {pendingVerifications === null ? '---' : pendingVerifications}
                        </span>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="px-5 py-3 border-t-2 border-text-primary bg-bg-primary">
                    <div className="text-[9px] font-black font-mono text-text-dim uppercase tracking-widest text-center">
                        V1.0.0 // SHIELDHIRE SEC
                    </div>
                </div>
            </aside>
        </>
    );
}
