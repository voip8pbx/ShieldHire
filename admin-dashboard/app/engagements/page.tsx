'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
    id: string;
    name: string;
    email: string;
    contactNo?: string;
}

interface Bouncer {
    id: string;
    name: string;
    contactNo?: string;
    experience?: number;
    rating?: number;
}

interface Booking {
    id: string;
    userId: string;
    user: User;
    bouncerId: string;
    bouncer: Bouncer;
    eventType: string;
    eventLocation: string;
    bookingDate: string;
    eventDate: string;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    notes?: string;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

const ITEMS_PER_PAGE = 10;

export default function EngagementsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [bookingToAction, setBookingToAction] = useState<{ id: string; action: 'confirm' | 'cancel' } | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    user:userId (id, name, email, contactNo),
                    bouncer:bouncerId (id, name, contactNo, experience, rating)
                `)
                .order('createdAt', { ascending: false });

            if (error) {
                throw error;
            }

            setBookings(data || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort bookings
    const filteredBookings = bookings.filter((booking) => {
        const matchesSearch = 
            booking.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.bouncer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.eventLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const sortedBookings = [...filteredBookings].sort((a, b) => {
        if (sortBy === 'date') {
            const dateA = new Date(a.eventDate).getTime();
            const dateB = new Date(b.eventDate).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
            return sortOrder === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = sortedBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
        totalRevenue: bookings.filter(b => b.status !== 'CANCELLED').reduce((sum, b) => sum + b.totalAmount, 0),
    };

    const handleConfirmBooking = async (bookingId: string) => {
        setBookings(prev => prev.map(b => 
            b.id === bookingId 
                ? { ...b, status: 'CONFIRMED', updatedAt: new Date().toISOString() }
                : b
        ));
        setIsConfirmModalOpen(false);
        setBookingToAction(null);
    };

    const handleCancelBooking = async (bookingId: string) => {
        setBookings(prev => prev.map(b => 
            b.id === bookingId 
                ? { ...b, status: 'CANCELLED', paymentStatus: 'REFUNDED', updatedAt: new Date().toISOString() }
                : b
        ));
        setIsConfirmModalOpen(false);
        setBookingToAction(null);
    };

    const openActionModal = (id: string, action: 'confirm' | 'cancel') => {
        setBookingToAction({ id, action });
        setIsConfirmModalOpen(true);
    };

    const getStatusBadge = (status: BookingStatus) => {
        const styles = {
            PENDING: 'bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]',
            CONFIRMED: 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]',
            COMPLETED: 'bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]',
            CANCELLED: 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]',
        };
        return (
            <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const styles = {
            PENDING: 'bg-[var(--warning-bg)] text-[var(--warning)]',
            PAID: 'bg-[var(--success-bg)] text-[var(--success)]',
            REFUNDED: 'bg-[var(--text-muted)] text-[var(--text-tertiary)]',
            FAILED: 'bg-[var(--error-bg)] text-[var(--error)]',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Booking Management</h1>
                    <p className="page-subtitle">View and manage all bouncer bookings across the platform</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid mb-8">
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Bookings</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </div>
                </div>
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Pending</div>
                        <div className="text-2xl font-bold text-[var(--warning)]">{stats.pending}</div>
                    </div>
                </div>
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Confirmed</div>
                        <div className="text-2xl font-bold text-[var(--success)]">{stats.confirmed}</div>
                    </div>
                </div>
                <div className="card p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Revenue</div>
                        <div className="text-2xl font-bold text-[var(--primary-yellow)]">{formatCurrency(stats.totalRevenue)}</div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="card p-5 mb-6">
                <div className="flex flex-row items-center justify-between gap-4">
                    {/* Search */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="     search, bouncer, event, or location..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="input-field w-full pl-10"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as BookingStatus | 'ALL');
                                setCurrentPage(1);
                            }}
                            className="input-field form-select min-w-[140px]"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                            className="input-field form-select min-w-[140px]"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="amount">Sort by Amount</option>
                        </select>

                        {/* Sort Order */}
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="btn btn-secondary btn-icon px-3"
                            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            {sortOrder === 'asc' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="card overflow-hidden">
                <div className="table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>User Details</th>
                                <th>Bouncer Details</th>
                                <th>Event Info</th>
                                <th>Event Date</th>
                                <th>Duration</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12">
                                        <div className="skeleton h-8 w-32 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : paginatedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-[var(--text-tertiary)]">
                                        <div className="empty-state">
                                            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <p className="text-lg font-semibold text-[var(--text-secondary)]">No bookings found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>
                                            <div className="font-mono text-xs text-[var(--text-tertiary)]">
                                                {booking.id}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                                {formatDate(booking.createdAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-[var(--text-primary)]">
                                                {booking.user.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-tertiary)]">
                                                {booking.user.email}
                                            </div>
                                            {booking.user.contactNo && (
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {booking.user.contactNo}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="font-semibold text-[var(--text-primary)]">
                                                {booking.bouncer.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-tertiary)]">
                                                ID: {booking.bouncer.id}
                                            </div>
                                            {booking.bouncer.experience && (
                                                <div className="text-xs text-[var(--text-muted)]">
                                                    {booking.bouncer.experience} years exp
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="font-semibold text-[var(--text-primary)]">
                                                {booking.eventType}
                                            </div>
                                            <div className="text-xs text-[var(--text-tertiary)]">
                                                {booking.eventLocation}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-[var(--text-primary)]">
                                                {formatDate(booking.eventDate)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-[var(--text-primary)]">
                                                {booking.duration} hrs
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-[var(--text-primary)]">
                                                {formatCurrency(booking.totalAmount)}
                                            </div>
                                        </td>
                                        <td>
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td>
                                            {getPaymentStatusBadge(booking.paymentStatus)}
                                        </td>
                                        <td>
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="px-3 py-1.5 rounded-md bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all text-xs font-semibold border border-[var(--border-gray)]"
                                                >
                                                    View
                                                </button>
                                                {booking.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => openActionModal(booking.id, 'confirm')}
                                                        className="px-3 py-1.5 rounded-md bg-[var(--success)] text-white hover:brightness-110 transition-all text-xs font-semibold"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                    <button
                                                        onClick={() => openActionModal(booking.id, 'cancel')}
                                                        className="px-3 py-1.5 rounded-md bg-[var(--error)] text-white hover:brightness-110 transition-all text-xs font-semibold"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && filteredBookings.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-gray)]">
                        <div className="text-sm text-[var(--text-muted)]">
                            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of {filteredBookings.length} bookings
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-secondary btn-sm"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-secondary btn-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedBooking(null)}
                >
                    <div
                        className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-gray)]">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Booking Details</h2>
                                <p className="text-sm text-[var(--text-muted)]">ID: {selectedBooking.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="text-3xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Status Banner */}
                            <div className="flex flex-wrap gap-3 items-center">
                                {getStatusBadge(selectedBooking.status)}
                                {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                <span className="text-sm text-[var(--text-muted)]">
                                    Last updated: {formatDateTime(selectedBooking.updatedAt)}
                                </span>
                            </div>

                            {/* Three Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* User Details */}
                                <div className="card p-4 bg-[var(--surface-elevated)]">
                                    <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Client Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Name</div>
                                            <div className="font-semibold text-[var(--text-primary)]">{selectedBooking.user.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Email</div>
                                            <div className="text-sm text-[var(--text-primary)]">{selectedBooking.user.email}</div>
                                        </div>
                                        {selectedBooking.user.contactNo && (
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Phone</div>
                                                <div className="text-sm text-[var(--text-primary)]">{selectedBooking.user.contactNo}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bouncer Details */}
                                <div className="card p-4 bg-[var(--surface-elevated)]">
                                    <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Bouncer Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Name</div>
                                            <div className="font-semibold text-[var(--text-primary)]">{selectedBooking.bouncer.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Bouncer ID</div>
                                            <div className="text-sm font-mono text-[var(--text-primary)]">{selectedBooking.bouncer.id}</div>
                                        </div>
                                        {selectedBooking.bouncer.experience && (
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Experience</div>
                                                <div className="text-sm text-[var(--text-primary)]">{selectedBooking.bouncer.experience} years</div>
                                            </div>
                                        )}
                                        {selectedBooking.bouncer.rating && (
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Rating</div>
                                                <div className="text-sm text-[var(--primary-yellow)] font-semibold">
                                                    {selectedBooking.bouncer.rating.toFixed(1)} / 5.0
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="card p-4 bg-[var(--surface-elevated)]">
                                    <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Event Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Event Type</div>
                                            <div className="font-semibold text-[var(--text-primary)]">{selectedBooking.eventType}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Location</div>
                                            <div className="text-sm text-[var(--text-primary)]">{selectedBooking.eventLocation}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)]">Duration</div>
                                            <div className="text-sm text-[var(--text-primary)]">{selectedBooking.duration} hours</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Timeline */}
                            <div className="card p-4">
                                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Booking Timeline</h3>
                                <div className="relative">
                                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--border-gray)]"></div>
                                    <div className="space-y-4 ml-8">
                                        <div className="relative">
                                            <div className="absolute -left-6 w-3 h-3 rounded-full bg-[var(--info)] border-2 border-[var(--surface)]"></div>
                                            <div className="text-sm">
                                                <span className="font-semibold text-[var(--text-primary)]">Booking Created</span>
                                                <span className="text-[var(--text-muted)] ml-2">{formatDateTime(selectedBooking.createdAt)}</span>
                                            </div>
                                        </div>
                                        {selectedBooking.status !== 'PENDING' && (
                                            <div className="relative">
                                                <div className="absolute -left-6 w-3 h-3 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]"></div>
                                                <div className="text-sm">
                                                    <span className="font-semibold text-[var(--text-primary)]">
                                                        {selectedBooking.status === 'CONFIRMED' ? 'Booking Confirmed' : 
                                                         selectedBooking.status === 'COMPLETED' ? 'Booking Completed' : 'Booking Cancelled'}
                                                    </span>
                                                    <span className="text-[var(--text-muted)] ml-2">{formatDateTime(selectedBooking.updatedAt)}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="relative">
                                            <div className={`absolute -left-6 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${
                                                selectedBooking.status === 'COMPLETED' ? 'bg-[var(--success)]' : 
                                                selectedBooking.status === 'CANCELLED' ? 'bg-[var(--error)]' : 'bg-[var(--warning)]'
                                            }`}></div>
                                            <div className="text-sm">
                                                <span className="font-semibold text-[var(--text-primary)]">Event Date</span>
                                                <span className="text-[var(--text-muted)] ml-2">{formatDateTime(selectedBooking.eventDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="card p-4">
                                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Payment Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">Total Amount</div>
                                        <div className="text-xl font-bold text-[var(--primary-yellow)]">{formatCurrency(selectedBooking.totalAmount)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">Payment Status</div>
                                        <div className="mt-1">{getPaymentStatusBadge(selectedBooking.paymentStatus)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">Rate</div>
                                        <div className="text-sm text-[var(--text-primary)]">
                                            {formatCurrency(selectedBooking.totalAmount / selectedBooking.duration)} / hour
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedBooking.notes && (
                                <div className="card p-4 bg-[var(--warning-bg)] border-[var(--warning)]">
                                    <h3 className="text-sm font-bold text-[var(--warning)] uppercase tracking-wider mb-2">Notes</h3>
                                    <p className="text-sm text-[var(--text-primary)]">{selectedBooking.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-4 p-6 border-t border-[var(--border-gray)]">
                            {selectedBooking.status === 'PENDING' && (
                                <button
                                    onClick={() => {
                                        setSelectedBooking(null);
                                        openActionModal(selectedBooking.id, 'confirm');
                                    }}
                                    className="flex-1 btn btn-success py-3"
                                >
                                    Confirm Booking
                                </button>
                            )}
                            {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'CONFIRMED') && (
                                <button
                                    onClick={() => {
                                        setSelectedBooking(null);
                                        openActionModal(selectedBooking.id, 'cancel');
                                    }}
                                    className="flex-1 btn btn-danger py-3"
                                >
                                    Cancel Booking
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="flex-1 btn btn-secondary py-3"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isConfirmModalOpen && bookingToAction && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[60]"
                    onClick={() => setIsConfirmModalOpen(false)}
                >
                    <div
                        className="card max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                                bookingToAction.action === 'confirm' ? 'bg-[var(--success-bg)]' : 'bg-[var(--error-bg)]'
                            }`}>
                                <svg className={`w-8 h-8 ${bookingToAction.action === 'confirm' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {bookingToAction.action === 'confirm' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    )}
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                {bookingToAction.action === 'confirm' ? 'Confirm Booking?' : 'Cancel Booking?'}
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                {bookingToAction.action === 'confirm' 
                                    ? 'This will confirm the booking and notify both the client and bouncer.'
                                    : 'This will cancel the booking and initiate a refund if payment was made.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 btn btn-secondary"
                            >
                                No, Go Back
                            </button>
                            <button
                                onClick={() => {
                                    if (bookingToAction.action === 'confirm') {
                                        handleConfirmBooking(bookingToAction.id);
                                    } else {
                                        handleCancelBooking(bookingToAction.id);
                                    }
                                }}
                                className={`flex-1 btn ${bookingToAction.action === 'confirm' ? 'btn-success' : 'btn-danger'}`}
                            >
                                Yes, {bookingToAction.action === 'confirm' ? 'Confirm' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

