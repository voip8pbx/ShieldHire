'use client';

import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    // Helper to get readable title from pathname
    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        const segments = path.split('/').filter(Boolean);
        return segments.length > 0
            ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
            : 'Dashboard';
    };

    return (
        <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-30 flex items-center justify-between px-8 bg-opacity-90 backdrop-blur-md">
            {/* Left: Page Title */}
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                    {getPageTitle(pathname)}
                </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                {/* Global Search */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-[var(--text-tertiary)] group-focus-within:text-[var(--primary)] transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg block w-64 pl-10 p-2.5 focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none transition-all placeholder-[var(--text-tertiary)]"
                        placeholder="Search..."
                    />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--surface-elevated)]">
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[var(--error)] rounded-full border-2 border-[var(--surface)]"></span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                </button>

                {/* Profile Widget */}
                <div className="flex items-center gap-3 border-l border-[var(--border)] pl-6">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-semibold text-[var(--text-primary)]">Admin User</div>
                        <div className="text-xs text-[var(--text-tertiary)]">Super Admin</div>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-xs ring-2 ring-[var(--surface)] cursor-pointer">
                        AD
                    </div>
                </div>
            </div>
        </header>
    );
}
