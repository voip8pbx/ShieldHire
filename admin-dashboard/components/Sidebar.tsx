'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
}

const navItems: NavItem[] = [
    {
        name: 'Dashboard',
        href: '/',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        )
    },
    {
        name: 'Verifications',
        href: '/verifications',
        badge: 5,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        name: 'Bouncers',
        href: '/bouncers',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        )
    },
    {
        name: 'Users',
        href: '/users',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    },
    {
        name: 'Engagements',
        href: '/engagements',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },
    {
        name: 'Live Tracking',
        href: '/tracking',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-72 min-h-screen bg-[var(--surface-elevated)] border-r border-[var(--border)] flex flex-col shadow-xl z-20 sticky top-0 h-screen">
            {/* Logo area */}
            <div className="h-16 flex items-center px-6 border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold">
                        S
                    </div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                        SECURITY<span className="text-[var(--primary)]">ADMIN</span>
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center justify-between px-4 py-3 rounded-lg
                                    transition-all duration-200 font-medium text-sm
                                    group relative
                                    ${isActive
                                        ? 'bg-[var(--surface-hover)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.name}</span>
                                </div>

                                {item.badge && (
                                    <span
                                        className={`
                                            px-2 py-0.5 rounded-full text-[10px] font-bold
                                            ${isActive
                                                ? 'bg-[var(--primary)] text-black'
                                                : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'
                                            }
                                        `}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer / Version Info */}
            <div className="p-4 border-t border-[var(--border)]">
                <div className="text-xs text-[var(--text-tertiary)] text-center">
                    v1.0.0 &copy; 2026 Security Admin
                </div>
            </div>
        </aside>
    );
}
