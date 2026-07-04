'use client';

import { useState, useEffect } from 'react';

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
    const [selectedBouncer, setSelectedBouncer] = useState<Bouncer | null>(null);

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
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Bouncers Directory
                    </h1>
                    <p className="page-subtitle">
                        Manage and monitor all registered security personnel
                    </p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="stats-grid mb-8">
                <div className="card p-4 sm:p-6" style={{ padding: '16px' }}>
                    <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="text-sm font-bold text-text-muted uppercase tracking-wider">Total Bouncers</div>
                        <div className="text-2xl font-bold">{bouncers.length}</div>
                    </div>
                </div>
                <div className="card p-4 sm:p-6" style={{ padding: '16px' }}>
                    <div className="flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="text-sm font-bold text-text-muted uppercase tracking-wider">Available</div>
                        <div className="text-2xl font-bold text-success">
                            {bouncers.filter(b => b.isAvailable).length}
                        </div>
                    </div>
                </div>
                <div className="card card-spacing" style={{ padding: '16px' }}>
                    <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="detail-label">Licensed Gunmen</div>
                        <div className="detail-value text-2xl font-bold text-primary-yellow">
                            {bouncers.filter(b => b.hasGunLicense).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-6" style={{ gap: '17px', marginBottom: '10px' }}>
                {['all', 'available', 'unavailable'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as typeof filter)}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${filter === tab
                            ? 'bg-primary-yellow text-black'
                            : 'bg-surface text-text-muted hover:bg-surface-hover border border-border-gray'
                            }`}
                        style={{ paddingTop: '4px', paddingBottom: '4px', paddingLeft: '10px', paddingRight: '10px', fontSize: '12px' }}
                    >
                        {tab}
                        <span className="hidden sm:inline">
                            {tab === 'all' && ` (${bouncers.length})`}
                            {tab === 'available' && ` (${bouncers.filter(b => b.isAvailable).length})`}
                            {tab === 'unavailable' && ` (${bouncers.filter(b => !b.isAvailable).length})`}
                        </span>
                    </button>
                ))}
            </div>

            {/* Professional Table */}
            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="professional-table" style={{ fontSize: '11px' }}>
                    <style jsx>{`
                        .professional-table,
                        .professional-table th,
                        .professional-table td,
                        .professional-table span,
                        .professional-table button {
                            font-size: 11px !important;
                        }
                        .professional-table th,
                        .professional-table td {
                            padding: 6px 6px 6px 6px !important;
                        }
                    `}</style>
                        <thead>
                            <tr>
                                <th>Bouncer Details</th>
                                <th>Contact Information</th>
                                <th>Age</th>
                                <th>Gender</th>
                                <th>Rating</th>
                                <th>Type</th>
                                <th>Gun License</th>
                                <th>Status</th>
                                <th>Actions</th>
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
                                    <td colSpan={9} className="text-center py-12 text-text-tertiary">
                                        No bouncers found
                                    </td>
                                </tr>
                            ) : (
                                filteredBouncers.map((bouncer) => (
                                    <tr key={bouncer.id}>
                                        <td>
                                            <div>
                                                <div className="font-bold text-text-primary mb-1">
                                                    {bouncer.name}
                                                </div>
                                                <div className="text-xs text-text-tertiary">
                                                    ID: {bouncer.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="text-text-primary mb-1">
                                                    {bouncer.contactNo}
                                                </div>
                                                <div className="text-xs text-text-tertiary">
                                                    {bouncer.user.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{bouncer.age} years</td>
                                        <td>{bouncer.gender}</td>
                                        <td>
                                            <span className="font-bold text-primary">
                                                {bouncer.rating.toFixed(1)} / 5.0
                                            </span>
                                        </td>
                                        <td>
                                            <span className="px-1 py-0 rounded-md text-xs font-semibold bg-info-glow text-info border border-info" style={{ padding: '1px 4px', display: 'inline-block' }}>
                                                {bouncer.registrationType}
                                            </span>
                                        </td>
                                        <td>
                                            {bouncer.hasGunLicense ? (
                                                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-success-glow text-success border border-success">
                                                    Licensed
                                                </span>
                                            ) : (
                                                <span className="text-text-tertiary">No License</span>
                                            )}
                                        </td>
                                        <td>
                                            {bouncer.isAvailable ? (
                                                <span className="status-badge status-active">Available</span>
                                            ) : (
                                                <span className="status-badge status-inactive">Unavailable</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedBouncer(bouncer)}
                                                    className="bg-primary-yellow text-black hover:brightness-110 transition-all font-semibold rounded-full"
                                                    style={{ padding: '2px 6px' }}
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAvailability(bouncer.id, bouncer.isAvailable)}
                                                    className={`transition-all font-semibold rounded-full ${bouncer.isAvailable
                                                        ? 'bg-error text-white hover:bg-red-600'
                                                        : 'bg-success text-white hover:bg-green-600'
                                                        }`}
                                                        style={{ padding: '2px 6px' }}
                                                >
                                                    {bouncer.isAvailable ? 'Disable' : 'Enable'}
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

            {/* Detail Modal */}
            {selectedBouncer && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center p-8 pt-20 z-[99999999] "
                    onClick={() => setSelectedBouncer(null)}
                >
                    <div
                        className="card p-10 max-w-3xl w-full max-h-[65vh] overflow-y-auto flex flex-col relative bg-[#1a1a1a]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedBouncer(null)}
                            className=" sticky top-0 z-50 float-right h-0 overflow-visible text-right text-3xl text-text-tertiary hover:text-text-primary font-bold"
                        >
                            ×
                        </button>

                        <h2 className="sticky top-0 z-40 mt-0 px-12 pb-4 text-center text-3xl font-bold text-text-primary bg-[#1a1a1a]">
                            Bouncer Details
                        </h2>

                        <div className="space-y-2  divide-y divide-gray-500 flex-1">
                            <div className="detail-row bg-zinc-800 p-3 rounded-lg" style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Full Name</div>
                                <div className="detail-value text-gray-300 text-lg">{selectedBouncer.name}</div>
                            </div>
                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Contact Number</div>
                                <div className="detail-value text-gray-300 text-lg">{selectedBouncer.contactNo}</div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Email Address</div>
                                <div className="detail-value text-gray-300 text-lg">{selectedBouncer.user.email}</div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Age</div>
                                <div className="detail-value text-gray-300 text-lg">{selectedBouncer.age} years</div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Gender</div>
                                <div className="detail-value text-gray-300 text-lg">{selectedBouncer.gender}</div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Rating</div>
                                <div className="detail-value text-primary font-bold">
                                    {selectedBouncer.rating.toFixed(1)} / 5.0
                                </div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Registration Type</div>
                                <div className="detail-value text-gray-300 text-lg">{selectedBouncer.registrationType}</div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Gun License</div>
                                <div className="detail-value text-gray-300 text-lg">
                                    {selectedBouncer.hasGunLicense ? 'Licensed' : 'Not Licensed'}
                                </div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Gunman Status</div>
                                <div className="detail-value text-gray-300 text-lg">
                                    {selectedBouncer.isGunman ? 'Yes' : 'No'}
                                </div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Availability</div>
                                <div className="detail-value text-gray-300 text-lg">
                                    {selectedBouncer.isAvailable ? (
                                        <span className="status-badge status-active">Available</span>
                                    ) : (
                                        <span className="status-badge status-inactive">Unavailable</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-row bg-zinc-800 p-3 rounded-lg " style={{ paddingLeft: '20px' }}>
                                <div className="detail-label text-gray-300 text-lg">Registered On</div>
                                <div className="detail-value text-gray-300 text-lg">
                                    {new Date(selectedBouncer.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-auto pt-8 border-t border-border-gray sticky bottom-0 z-10 bg-[#1a1a1a]">
                            <button
                                onClick={() => handleToggleAvailability(selectedBouncer.id, selectedBouncer.isAvailable)}
                                className={`flex-1 py-4 rounded-lg font-bold transition-all ${selectedBouncer.isAvailable
                                    ? 'btn btn-danger'
                                    : 'btn btn-success'
                                    }`}
                            >
                                {selectedBouncer.isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
                            </button>
                            <button
                                onClick={() => setSelectedBouncer(null)}
                                className="flex-1 btn btn-secondary py-4"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


