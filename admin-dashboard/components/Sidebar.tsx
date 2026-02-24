'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

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
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        )
    },
    {
        name: 'Verifications',
        href: '/verifications',
        badge: 5,
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        name: 'Bouncers',
        href: '/bouncers',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        )
    },
    {
        name: 'Users',
        href: '/users',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    },
    {
        name: 'Engagements',
        href: '/engagements',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },
    {
        name: 'Live Tracking',
        href: '/tracking',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
    },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const handleLinkClick = () => {
        // Close sidebar on mobile when a link is clicked
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`
                sidebar 
                ${isOpen ? '' : 'sidebar-collapsed'}
                ${!isOpen ? 'lg:translate-x-0' : ''}
            `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 sm:px-6 border-b border-border-gray bg-bg-primary">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-primary-yellow to-dark-yellow flex items-center justify-center text-black font-bold text-lg">
                            S
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                                SECURITY
                            </h1>
                            <span className="text-[10px] sm:text-xs font-bold text-primary-yellow -mt-1 tracking-widest">
                                ADMIN
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={`
                                        flex items-center justify-between px-3 sm:px-4 py-3 rounded-lg
                                        transition-all duration-200 font-medium text-sm
                                        group relative
                                        ${isActive
                                            ? 'bg-surface-hover text-primary-yellow border-l-4 border-primary-yellow'
                                            : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`
                                            ${isActive ? 'text-primary-yellow' : 'text-text-dim group-hover:text-text-primary'}
                                        `}>
                                            {item.icon}
                                        </span>
                                        <span className="text-base font-semibold tracking-wide">{item.name}</span>
                                    </div>

                                    {item.badge && (
                                        <span
                                            className={`
                                                px-2 py-0.5 rounded-full text-[10px] font-bold
                                                ${isActive
                                                    ? 'bg-primary-yellow text-black'
                                                    : 'bg-surface text-text-muted border border-border-gray'
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
                <div className="p-3 sm:p-4 border-t border-border-gray">
                    <div className="text-xs text-text-dim text-center">
                        <span className="hidden sm:inline">v1.0.0 &copy; 2026 ShieldHire</span>
                        <span className="sm:hidden">v1.0.0</span>
                    </div>
                </div>
            </aside>
        </>
    );
}


