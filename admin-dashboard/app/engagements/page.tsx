'use client';

import { useState, useEffect } from 'react';

export default function EngagementsPage() {
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
                    User-Bouncer Engagements
                </h1>
                <p className="text-base text-[var(--text-secondary)]">
                    Monitor and manage active and completed bookings
                </p>
            </div>

            {/* Feature Status Card */}
            <div className="card card-spacing">
                <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--secondary-glow)] flex items-center justify-center">
                        <span className="text-5xl">🤝</span>
                    </div>

                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                        Engagements Management
                    </h2>

                    <p className="text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                        This feature can use the existing Booking model - just needs admin API endpoints.
                    </p>

                    <div className="max-w-3xl mx-auto">
                        <div className="card bg-[var(--surface-elevated)] p-6 text-left">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                                Quick Implementation Guide:
                            </h3>

                            <div className="space-y-4">
                                <div className="detail-row">
                                    <div className="detail-label">1. Backend API</div>
                                    <div className="detail-value text-sm">
                                        Extend bookingRoutes.ts to include admin queries with bouncer and user details
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">2. API Proxy</div>
                                    <div className="detail-value text-sm">
                                        Create /app/api/engagements/route.ts to fetch from backend /bookings endpoint
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">3. Add Missing Fields</div>
                                    <div className="detail-value text-sm">
                                        Extend Booking model with location, duration, payment amount, and payment status
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">4. Dashboard UI</div>
                                    <div className="detail-value text-sm">
                                        Build professional table showing user, bouncer, status, payment, and actions
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <div className="detail-label">5. Filters & Search</div>
                                    <div className="detail-value text-sm">
                                        Add filtering by status (Active, Pending, Completed) and search functionality
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
                            onClick={() => window.location.href = '/users'}
                            className="btn-secondary"
                        >
                            View All Users
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

            {/* Enhanced Schema Suggestion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 section-spacing">
                <div className="card card-spacing">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                        Current Booking Model
                    </h3>
                    <div className="bg-[var(--surface-elevated)] p-4 rounded-lg">
                        <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto">
                            {`model Booking {
  id        String   @id
  userId    String   @db.ObjectId
  user      User     @relation(...)
  bouncerId String   @db.ObjectId
  bouncer   Bouncer  @relation(...)
  date      DateTime
  status    String   @default("PENDING")
  location  String
  duration  Int
  totalAmount Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  review    Review?
}`}
                        </pre>
                    </div>
                </div>

                <div className="card card-spacing">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                        Admin Controls
                    </h3>
                    <div className="bg-[var(--surface-elevated)] p-4 rounded-lg">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Admins can now manage engagements between users and bouncers.
                            The system supports both Individual and Agency-based security personnel.
                        </p>
                    </div>
                </div>
            </div>

            {/* API Endpoint Reference */}
            <div className="card card-spacing">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                    Required API Endpoints
                </h3>
                <div className="space-y-3">
                    <div className="detail-row">
                        <div className="detail-label">GET /api/engagements</div>
                        <div className="detail-value text-sm">
                            Fetch all bookings with user and bouncer details
                        </div>
                    </div>
                    <div className="detail-row">
                        <div className="detail-label">GET /api/engagements/:id</div>
                        <div className="detail-value text-sm">
                            Get single engagement details
                        </div>
                    </div>
                    <div className="detail-row">
                        <div className="detail-label">PATCH /api/engagements/:id</div>
                        <div className="detail-value text-sm">
                            Update engagement status or details
                        </div>
                    </div>
                    <div className="detail-row">
                        <div className="detail-label">DELETE /api/engagements/:id</div>
                        <div className="detail-value text-sm">
                            Cancel engagement (admin only)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


