'use client';



import Link from 'next/link';

import { usePathname } from 'next/navigation';



interface SidebarProps {
    isOpen: boolean;
    windowWidth: number;
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



export default function Sidebar({ isOpen, windowWidth, onClose }: SidebarProps) {

    const pathname = usePathname();



    // Determine breakpoints

    const isMobile = windowWidth < 769;

    const isTablet = false; // Removed - icon strip was overlapping content on phones

    const isLaptopAndUp = windowWidth >= 769;



    // Determine if we should show text (logo and nav items)

    const showText = isMobile ? isOpen : !isTablet; // Show text in mobile when open, and in laptop/up always; never in tablet



    const handleLinkClick = () => {

        // Close sidebar on mobile when a link is clicked

        if (isMobile) {

            onClose();

        }

    };



    // Calculate sidebar width

    const sidebarWidth = 280; // Always full width — no icon-strip mode



    return (

        <>

            {/* Mobile Overlay - only show on mobile when sidebar is open */}

            {isMobile && isOpen && (

                <div

                    className="mobile-menu-overlay active"

                    onClick={onClose}

                />

            )}



            {/* Sidebar */}
            <aside className={`sidebar border-r-3 border-text-primary ${isMobile && !isOpen ? 'sidebar-collapsed' : ''}`} style={{ width: `${sidebarWidth}px` }}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 sm:px-6 border-b-3 border-text-primary bg-bg-primary mb-6">
                    <div className="flex items-center gap-3" style={{ paddingLeft: '0.25rem' }}>
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-primary-yellow border-2 border-black flex items-center justify-center text-black font-black text-lg font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            S
                        </div>
                        <div className="flex flex-col">
                            {showText && (
                                <>
                                    <h1 className="text-sm font-black text-text-primary tracking-wider uppercase font-mono">
                                        SHIELDHIRE
                                    </h1>
                                    <span className="text-[10px] font-black text-primary-yellow tracking-widest uppercase font-mono">
                                        OPS_CONSOLE
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 sm:p-4 overflow-y-auto pt-4">
                    <div className="flex flex-col gap-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={`
                                        flex items-center justify-between px-3 py-2.5 rounded-none
                                        font-bold text-xs uppercase tracking-wider font-mono
                                        transition-all group relative border-2
                                        ${isActive
                                            ? 'bg-primary-yellow text-black border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                            : 'text-text-muted border-transparent hover:bg-surface-hover hover:text-text-primary hover:border-text-primary'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`
                                            ${isActive ? 'text-black' : 'text-text-dim group-hover:text-text-primary'}
                                        `}>
                                            {item.icon}
                                        </span>
                                        {showText && (
                                            <span className="text-xs font-black tracking-wider">{item.name}</span>
                                        )}
                                    </div>

                                    {item.badge && (
                                        <span
                                            className={`
                                                px-1.5 py-0.5 rounded-none text-[9px] font-black font-mono border min-w-[18px] text-center
                                                ${isActive
                                                    ? 'bg-black text-primary-yellow border-primary-yellow'
                                                    : 'bg-primary-yellow text-black border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
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
                <div className="p-3 sm:p-4 border-t-2 border-text-primary bg-bg-primary">
                    <div className="text-[10px] font-black font-mono text-text-dim text-center uppercase tracking-widest">
                        <span className="hidden sm:inline">V1.0.0 // SHIELDHIRE SEC</span>
                        <span className="sm:hidden">V1.0.0</span>
                    </div>
                </div>
            </aside>

        </>

    );

}

