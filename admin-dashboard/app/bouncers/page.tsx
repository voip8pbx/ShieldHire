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
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Bouncers</div>
                        <div className="text-2xl font-bold">{bouncers.length}</div>
                    </div>
                </div>
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Available</div>
                        <div className="text-2xl font-bold text-[var(--success)]">
                            {bouncers.filter(b => b.isAvailable).length}
                        </div>
                    </div>
                </div>
                <div className="card card-spacing">
                    <div className="detail-row">
                        <div className="detail-label">Licensed Gunmen</div>
                        <div className="detail-value text-2xl font-bold text-[var(--primary)]">
                            {bouncers.filter(b => b.hasGunLicense).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                {['all', 'available', 'unavailable'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as typeof filter)}
                        className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-all ${filter === tab
                            ? 'bg-[var(--primary-yellow)] text-black'
                            : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-gray)]'
                            }`}
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
                    <table className="professional-table">
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
                                    <td colSpan={9} className="text-center py-12 text-[var(--text-tertiary)]">
                                        No bouncers found
                                    </td>
                                </tr>
                            ) : (
                                filteredBouncers.map((bouncer) => (
                                    <tr key={bouncer.id}>
                                        <td>
                                            <div>
                                                <div className="font-bold text-[var(--text-primary)] mb-1">
                                                    {bouncer.name}
                                                </div>
                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                    ID: {bouncer.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="text-[var(--text-primary)] mb-1">
                                                    {bouncer.contactNo}
                                                </div>
                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                    {bouncer.user.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{bouncer.age} years</td>
                                        <td>{bouncer.gender}</td>
                                        <td>
                                            <span className="font-bold text-[var(--primary)]">
                                                {bouncer.rating.toFixed(1)} / 5.0
                                            </span>
                                        </td>
                                        <td>
                                            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[var(--secondary-glow)] text-[var(--secondary)] border border-[var(--secondary)]">
                                                {bouncer.registrationType}
                                            </span>
                                        </td>
                                        <td>
                                            {bouncer.hasGunLicense ? (
                                                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[var(--success-glow)] text-[var(--success)] border border-[var(--success)]">
                                                    Licensed
                                                </span>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)]">No License</span>
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
                                                    className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-light)] transition-all text-sm font-semibold"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleToggleAvailability(bouncer.id, bouncer.isAvailable)}
                                                    className={`px-4 py-2 rounded-lg transition-all text-sm font-semibold ${bouncer.isAvailable
                                                        ? 'bg-[var(--error)] text-white hover:bg-red-600'
                                                        : 'bg-[var(--success)] text-white hover:bg-green-600'
                                                        }`}
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
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-8 z-50"
                    onClick={() => setSelectedBouncer(null)}
                >
                    <div
                        className="card p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedBouncer(null)}
                            className="float-right text-3xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-bold"
                        >
                            ×
                        </button>

                        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
                            Bouncer Details
                        </h2>

                        <div className="space-y-6">
                            <div className="detail-row">
                                <div className="detail-label">Full Name</div>
                                <div className="detail-value">{selectedBouncer.name}</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Contact Number</div>
                                <div className="detail-value">{selectedBouncer.contactNo}</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Email Address</div>
                                <div className="detail-value">{selectedBouncer.user.email}</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Age</div>
                                <div className="detail-value">{selectedBouncer.age} years</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Gender</div>
                                <div className="detail-value">{selectedBouncer.gender}</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Rating</div>
                                <div className="detail-value text-[var(--primary)] font-bold">
                                    {selectedBouncer.rating.toFixed(1)} / 5.0
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Registration Type</div>
                                <div className="detail-value">{selectedBouncer.registrationType}</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Gun License</div>
                                <div className="detail-value">
                                    {selectedBouncer.hasGunLicense ? 'Licensed' : 'Not Licensed'}
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Gunman Status</div>
                                <div className="detail-value">
                                    {selectedBouncer.isGunman ? 'Yes' : 'No'}
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Availability</div>
                                <div className="detail-value">
                                    {selectedBouncer.isAvailable ? (
                                        <span className="status-badge status-active">Available</span>
                                    ) : (
                                        <span className="status-badge status-inactive">Unavailable</span>
                                    )}
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Registered On</div>
                                <div className="detail-value">
                                    {new Date(selectedBouncer.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-8 border-t border-[var(--border-gray)]">
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
