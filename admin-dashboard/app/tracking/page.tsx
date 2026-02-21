'use client';

import { useState, useEffect } from 'react';

export default function TrackingPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="content-spacing">
                <div className="skeleton h-12 w-64 mb-4"></div>
                <div className="skeleton h-96 w-full"></div>
            </div>
        );
    }

    return (
        <div className="content-spacing">
            {/* Header */}
            <div className="section-spacing">
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                    Live Location Tracking
                </h1>
                <p className="text-base text-[var(--text-secondary)]">
                    Real-time bouncer location monitoring
                </p>
            </div>

            {/* Coming Soon Card */}
            <div className="card card-spacing">
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--primary-glow)] flex items-center justify-center">
                        <span className="text-5xl">📍</span>
                    </div>

                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                        Live Tracking Feature
                    </h2>

                    <p className="text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                        This feature requires backend implementation for real-time location tracking.
                    </p>

                    <div className="max-w-3xl mx-auto">
                        <div className="card bg-[var(--surface-elevated)] p-6 text-left">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                                Required Implementation:
                            </h3>

                            <div className="space-y-4">
                                <div className="detail-row">
                                    <div className="detail-label">Database Schema</div>
                                    <div className="detail-value text-sm">
                                        Add location fields (latitude, longitude, lastLocationUpdate) to Bouncer model
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">Backend API</div>
                                    <div className="detail-value text-sm">
                                        Create tracking endpoints for active engagements and real-time location updates
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">Mobile App</div>
                                    <div className="detail-value text-sm">
                                        Implement location service to send bouncer coordinates to backend
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">Maps Integration</div>
                                    <div className="detail-value text-sm">
                                        Integrate Google Maps API for map visualization and markers
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">Real-time Updates</div>
                                    <div className="detail-value text-sm">
                                        Optional: Implement WebSocket for live location updates without polling
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button
                            onClick={() => window.location.href = '/bouncers'}
                            className="btn-primary"
                        >
                            View All Bouncers
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="btn-outline"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 section-spacing">
                <div className="card card-spacing">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                        Phase 1: Database Setup
                    </h3>
                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                        <p>• Add location fields to Bouncer schema</p>
                        <p>• Create LocationUpdate model for history</p>
                        <p>• Run Prisma migrations</p>
                        <p>• Update Bouncer type definitions</p>
                    </div>
                </div>

                <div className="card card-spacing">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                        Phase 2: Backend API
                    </h3>
                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                        <p>• GET /api/tracking/active - Active engagements</p>
                        <p>• POST /api/tracking/update - Update location</p>
                        <p>• GET /api/tracking/bouncer/:id - Bouncer location</p>
                        <p>• WebSocket endpoint for real-time</p>
                    </div>
                </div>

                <div className="card card-spacing">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                        Phase 3: Mobile Integration
                    </h3>
                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                        <p>• Add location permission requests</p>
                        <p>• Implement background location service</p>
                        <p>• Send location updates every 30 seconds</p>
                        <p>• Battery optimization</p>
                    </div>
                </div>

                <div className="card card-spacing">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                        Phase 4: Dashboard UI
                    </h3>
                    <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                        <p>• Integrate Google Maps component</p>
                        <p>• Add bouncer markers with avatars</p>
                        <p>• Show engagement details on click</p>
                        <p>• Auto-refresh every minute</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
