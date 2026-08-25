'use client';

import { useState, useEffect } from 'react';
import BouncerDrawer from '@/components/BouncerDrawer';

interface Bouncer {
    id: string;
    name: string;
    contactNo: string;
    age: number;
    gender: string;
    rating: number;
    isAvailable: boolean;
    hasGunLicense: boolean;
    isGunman: boolean;
    registrationType: string;
    createdAt: string;
    user: {
        email: string;
    };
}

export default function BouncersPage() {
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
    const [selectedBouncerId, setSelectedBouncerId] = useState<string | null>(null);

    useEffect(() => {
        fetchBouncers();
    }, []);

    const fetchBouncers = async () => {
        try {
            const response = await fetch('/api/bouncers', {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bouncers');
            }

            const data = await response.json();
            setBouncers(data);
        } catch (error) {
            console.error('Failed to fetch bouncers:', error);
            // Error will be handled in UI with empty state
        } finally {
            setLoading(false);
        }
    };

    const filteredBouncers = bouncers.filter((bouncer) => {
        if (filter === 'all') return true;
        if (filter === 'available') return bouncer.isAvailable;
        if (filter === 'unavailable') return !bouncer.isAvailable;
        return true;
    });

    const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/bouncers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable: !currentStatus }),
            });

            if (response.ok) {
                setBouncers(bouncers.map(b =>
                    b.id === id ? { ...b, isAvailable: !currentStatus } : b
                ));
            }
        } catch (error) {
            console.error('Failed to update bouncer:', error);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="page-header border-b-3 border-text-primary pb-6 mb-8">
                <div>
                    <h1 className="page-title text-4xl font-black uppercase tracking-tight text-text-primary">
                        Bouncers Directory
                    </h1>
                    <p className="page-subtitle text-xs font-mono text-text-muted uppercase tracking-wider mt-1">
                        // Security personnel registry and live dispatch statuses
                    </p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// REGISTERED_FORCE</div>
                        <div className="text-3xl font-black font-mono text-text-primary">{bouncers.length}</div>
                    </div>
                </div>
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// AVAILABLE_AGENTS</div>
                        <div className="text-3xl font-black font-mono text-success">
                            {bouncers.filter(b => b.isAvailable).length}
                        </div>
                    </div>
                </div>
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// LICENSED_GUNMEN</div>
                        <div className="text-3xl font-black font-mono text-primary-yellow">
                            {bouncers.filter(b => b.hasGunLicense).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
                {['all', 'available', 'unavailable'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as typeof filter)}
                        className={`px-4 py-2 border-2 border-black font-black font-mono text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer ${filter === tab
                            ? 'bg-primary-yellow text-black'
                            : 'bg-bg-secondary text-text-muted hover:bg-surface-hover hover:text-white'
                            }`}
                    >
                        {tab}
                        <span>
                            {tab === 'all' && ` [${bouncers.length}]`}
                            {tab === 'available' && ` [${bouncers.filter(b => b.isAvailable).length}]`}
                            {tab === 'unavailable' && ` [${bouncers.filter(b => !b.isAvailable).length}]`}
                        </span>
                    </button>
                ))}
            </div>

            {/* Professional Table */}
            <div className="card border-3 border-text-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>BOUNCER IDENTITY</th>
                                <th className="hidden sm:table-cell">CONTACT INFORMATION</th>
                                <th className="hidden lg:table-cell">AGE</th>
                                <th className="hidden lg:table-cell">GENDER</th>
                                <th>RATING</th>
                                <th className="hidden md:table-cell">REGISTRATION TYPE</th>
                                <th className="hidden md:table-cell">GUN LICENSE</th>
                                <th>DISPATCH STATUS</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12">
                                        <div className="skeleton h-8 w-32 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredBouncers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-text-tertiary font-mono">
                                        NO SECURITY AGENTS REGISTERED IN THIS SHIFT
                                    </td>
                                </tr>
                            ) : (
                                filteredBouncers.map((bouncer) => (
                                    <tr key={bouncer.id}>
                                        <td>
                                            <div>
                                                <div className="font-black text-text-primary mb-1 uppercase tracking-wide">
                                                    {bouncer.name}
                                                </div>
                                                <div className="text-[10px] font-mono text-text-dim uppercase">
                                                    ID: {bouncer.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell">
                                            <div>
                                                <div className="text-text-primary font-bold font-mono">
                                                    {bouncer.contactNo}
                                                </div>
                                                <div className="text-[10px] font-mono text-text-dim">
                                                    {bouncer.user.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell font-bold font-mono text-xs">{bouncer.age} YRS</td>
                                        <td className="hidden lg:table-cell font-bold font-mono text-xs uppercase">{bouncer.gender}</td>
                                        <td>
                                            <span className="font-black text-primary-yellow font-mono">
                                                {bouncer.rating.toFixed(1)} / 5.0
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <span className="px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase bg-info text-white inline-block">
                                                {bouncer.registrationType}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            {bouncer.hasGunLicense ? (
                                                <span className="px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase bg-success text-black">
                                                    LICENSED
                                                </span>
                                            ) : (
                                                <span className="text-text-tertiary font-mono text-xs">UNARMED</span>
                                            )}
                                        </td>
                                        <td>
                                            {bouncer.isAvailable ? (
                                                <span className="status-badge status-active font-mono font-black">AVAILABLE</span>
                                            ) : (
                                                <span className="status-badge status-inactive font-mono font-black">UNAVAILABLE</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setSelectedBouncerId(bouncer.id)}
                                                    className="btn btn-sm btn-primary py-1 px-3 border-2 border-black font-mono font-black text-[10px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase"
                                                >
                                                    INSPECT
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAvailability(bouncer.id, bouncer.isAvailable)}
                                                    className={`btn btn-sm border-2 border-black font-mono font-black py-1 px-3 text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase ${
                                                        bouncer.isAvailable
                                                            ? 'bg-error text-white'
                                                            : 'bg-success text-black'
                                                    }`}
                                                >
                                                    {bouncer.isAvailable ? 'DISABLE' : 'ENABLE'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Drawer */}
            <BouncerDrawer 
                bouncerId={selectedBouncerId || ''} 
                isOpen={!!selectedBouncerId} 
                onClose={() => setSelectedBouncerId(null)} 
                onRefresh={fetchBouncers}
            />
        </div>
    );
}


