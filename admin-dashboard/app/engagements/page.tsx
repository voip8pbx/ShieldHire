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
    paymentStatus: PaymentStatus;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    transactionId?: string;
    paymentProofUrl?: string;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'PAYMENT_PROOF_SUBMITTED' | 'PAID' | 'REFUNDED' | 'FAILED';

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

    const parseNotesMetadata = (notesStr: string | null) => {
        const defaultVal = { userNotes: notesStr || '', transactionId: 'N/A', paymentStatus: 'PENDING' as PaymentStatus, paymentProofUrl: '' };
        if (!notesStr) return defaultVal;
        
        const parts = notesStr.split(' | ');
        let userNotes = '';
        let transactionId = 'N/A';
        let paymentStatus = 'PENDING' as PaymentStatus;
        let paymentProofUrl = '';
        
        parts.forEach(part => {
            if (part.startsWith('Txn ID: ')) {
                transactionId = part.replace('Txn ID: ', '');
            } else if (part.startsWith('Payment Status: ')) {
                paymentStatus = part.replace('Payment Status: ', '') as PaymentStatus;
            } else if (part.startsWith('Proof: ')) {
                paymentProofUrl = part.replace('Proof: ', '');
            } else {
                userNotes = userNotes ? userNotes + ' | ' + part : part;
            }
        });
        
        return { userNotes, transactionId, paymentStatus, paymentProofUrl };
    };

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

            const mappedBookings: Booking[] = (data || []).map((b: any) => {
                const { userNotes, transactionId, paymentStatus, paymentProofUrl } = parseNotesMetadata(b.notes);
                const cleanLocation = b.location ? b.location.split('|COORDS:')[0] : 'N/A';
                
                return {
                    id: b.id,
                    userId: b.userId,
                    user: b.user,
                    bouncerId: b.bouncerId,
                    bouncer: b.bouncer,
                    eventType: b.package === 'VIP_BODYGUARD' ? 'VIP Bodyguard' : 'Single Event Shift',
                    eventLocation: cleanLocation,
                    bookingDate: b.createdAt,
                    eventDate: b.date,
                    duration: b.duration || 4,
                    status: b.status,
                    paymentStatus: paymentStatus,
                    totalAmount: b.totalPrice || 0,
                    createdAt: b.createdAt,
                    updatedAt: b.updatedAt,
                    notes: userNotes || undefined,
                    transactionId: transactionId,
                    paymentProofUrl: paymentProofUrl || undefined
                };
            });

            setBookings(mappedBookings);
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
        try {
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CONFIRMED' })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to confirm booking');
            }

            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? { ...b, status: 'CONFIRMED', updatedAt: new Date().toISOString() }
                    : b
            ));
        } catch (error: any) {
            alert(error.message || 'Error confirming booking');
        }
        setIsConfirmModalOpen(false);
        setBookingToAction(null);
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to cancel booking');
            }

            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? { ...b, status: 'CANCELLED', paymentStatus: 'REFUNDED', updatedAt: new Date().toISOString() }
                    : b
            ));
        } catch (error: any) {
            alert(error.message || 'Error cancelling booking');
        }
        setIsConfirmModalOpen(false);
        setBookingToAction(null);
    };

    const handleUpdatePaymentStatus = async (bookingId: string, newPaymentStatus: PaymentStatus) => {
        try {
            const response = await fetch(`/api/bookings/${bookingId}/payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: newPaymentStatus })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update payment status');
            }

            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? { ...b, paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() }
                    : b
            ));
            
            setSelectedBooking(prev => prev && prev.id === bookingId ? { ...prev, paymentStatus: newPaymentStatus, updatedAt: new Date().toISOString() } : prev);
            
            alert(`Payment status successfully updated to ${newPaymentStatus}!`);
        } catch (error: any) {
            alert(error.message || 'Error updating payment status');
        }
    };

    const openActionModal = (id: string, action: 'confirm' | 'cancel') => {
        setBookingToAction({ id, action });
        setIsConfirmModalOpen(true);
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
        <div className="layout-container animate-fade-in space-y-8">
            {/* Header */}
            <div className="page-header border-b-3 border-text-primary pb-6 mb-8">
                <div>
                    <h1 className="page-title text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-text-primary">Booking Management</h1>
                    <p className="page-subtitle text-xs font-mono text-text-muted uppercase tracking-wider mt-1">// Platform dispatch logs and client payment verifications</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// TOTAL_DISPATCHES</div>
                        <div className="text-3xl font-black font-mono text-text-primary">{stats.total}</div>
                    </div>
                </div>
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// PENDING_LOGS</div>
                        <div className="text-3xl font-black font-mono text-warning">{stats.pending}</div>
                    </div>
                </div>
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// CONFIRMED_OPS</div>
                        <div className="text-3xl font-black font-mono text-success">{stats.confirmed}</div>
                    </div>
                </div>
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// TOTAL_REVENUE</div>
                        <div className="text-3xl font-black font-mono text-primary-yellow">{formatCurrency(stats.totalRevenue)}</div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="card border-3 border-text-primary bg-bg-secondary p-5 mb-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Search */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="     SEARCH BOUNCER, CLIENT, OR ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="input-field w-full pl-10 bg-bg-primary border-2 border-text-primary font-mono text-xs rounded-none py-2.5 focus:border-primary-yellow"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as BookingStatus | 'ALL');
                                setCurrentPage(1);
                            }}
                            className="input-field bg-bg-primary border-2 border-text-primary text-xs font-mono font-bold uppercase py-2.5 pl-2 pr-6 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <option value="ALL">ALL STATUS</option>
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                            className="input-field bg-bg-primary border-2 border-text-primary text-xs font-mono font-bold uppercase py-2.5 pl-2 pr-6 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <option value="date">SORT BY DATE</option>
                            <option value="amount">SORT BY AMOUNT</option>
                        </select>

                        {/* Sort Order */}
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="btn btn-secondary border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all px-3 py-2 cursor-pointer"
                            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            {sortOrder === 'asc' ? (
                                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="card border-3 border-text-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>DISPATCH ID</th>
                                <th>CLIENT IDENTITY</th>
                                <th>BOUNCER IDENTITY</th>
                                <th>EVENT DETAILS</th>
                                <th>DATE</th>
                                <th>DURATION</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>PAYMENT</th>
                                <th className="text-right">ACTIONS</th>
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
                                    <td colSpan={10} className="text-center py-12 text-text-tertiary font-mono">
                                        NO PLATFORM DISPATCHES FOUND FOR CURRENT SHIFT
                                    </td>
                                </tr>
                            ) : (
                                paginatedBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>
                                            <div className="font-mono text-[10px] text-text-primary font-bold">
                                                {booking.id.split('-')[0]}
                                            </div>
                                            <div className="text-[9px] font-mono text-text-dim mt-1">
                                                {formatDate(booking.createdAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-black text-text-primary uppercase tracking-wide">
                                                {booking.user.name}
                                            </div>
                                            <div className="text-[10px] font-mono text-text-dim leading-none mt-1">
                                                {booking.user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-black text-text-primary uppercase tracking-wide">
                                                {booking.bouncer.name}
                                            </div>
                                            <div className="text-[10px] font-mono text-text-dim leading-none mt-1">
                                                ID: {booking.bouncer.id}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-text-primary text-xs">
                                                {booking.eventType}
                                            </div>
                                            <div className="text-[10px] font-mono text-text-dim mt-0.5">
                                                {booking.eventLocation}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-text-secondary font-mono font-bold text-xs">
                                                {formatDate(booking.eventDate)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-text-primary font-mono text-xs font-bold">
                                                {booking.duration} HRS
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-black text-text-primary font-mono text-xs">
                                                {formatCurrency(booking.totalAmount)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                booking.status === 'CONFIRMED' ? 'bg-success text-black' :
                                                booking.status === 'CANCELLED' ? 'bg-error text-white' :
                                                booking.status === 'COMPLETED' ? 'bg-info text-white' :
                                                'bg-primary-yellow text-black'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                booking.paymentStatus === 'PAID' ? 'bg-success text-black' :
                                                booking.paymentStatus === 'FAILED' ? 'bg-error text-white' :
                                                booking.paymentStatus === 'PAYMENT_PROOF_SUBMITTED' ? 'bg-info text-white' :
                                                booking.paymentStatus === 'REFUNDED' ? 'bg-bg-tertiary text-text-dim border-text-dim shadow-none' :
                                                'bg-warning text-black'
                                            }`}>
                                                {booking.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex gap-2 justify-end flex-wrap">
                                                <button
                                                    onClick={() => setSelectedBooking(booking)}
                                                    className="btn btn-sm btn-primary py-1 px-3 border-2 border-black font-mono font-black text-[10px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                                >
                                                    INSPECT
                                                </button>
                                                {booking.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => openActionModal(booking.id, 'confirm')}
                                                        className="btn btn-sm border-2 border-black bg-success text-black font-mono font-black text-[10px] py-1 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                                    >
                                                        CONFIRM
                                                    </button>
                                                )}
                                                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                    <button
                                                        onClick={() => openActionModal(booking.id, 'cancel')}
                                                        className="btn btn-sm border-2 border-black bg-error text-white font-mono font-black text-[10px] py-1 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                                    >
                                                        CANCEL
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
                    <div className="flex items-center justify-between px-6 py-4 border-t-2 border-text-primary bg-bg-secondary">
                        <div className="text-xs font-mono font-black text-text-dim uppercase">
                            DISPATCHES {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} OF {filteredBookings.length}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="btn btn-secondary border-2 border-black font-mono font-black text-xs py-1 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            >
                                PREV
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 font-mono font-black text-xs border-2 border-black ${currentPage === page ? 'bg-primary-yellow text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]' : 'bg-bg-primary text-text-muted hover:text-white'} cursor-pointer`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="btn btn-secondary border-2 border-black font-mono font-black text-xs py-1 px-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <div
                    className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in"
                    onClick={() => setSelectedBooking(null)}
                >
                    <div
                        className="card bg-bg-secondary border-3 border-white rounded-none p-8 max-w-4xl w-full shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] overflow-y-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b-3 border-text-primary mb-6">
                            <div>
                                <h2 className="text-xl font-black uppercase text-white font-mono tracking-wider">// DISPATCH_OPERATION_AUDIT</h2>
                                <p className="text-[10px] font-mono text-text-dim uppercase mt-0.5">ID: {selectedBooking.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="text-2xl text-text-tertiary hover:text-white font-black font-mono"
                            >
                                [✕]
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="space-y-6">
                            {/* Status Banner */}
                            <div className="flex flex-wrap gap-3 items-center border-b border-white/10 pb-4">
                                <span className={`px-2 py-0.5 border border-black font-mono font-black text-[10px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                    selectedBooking.status === 'CONFIRMED' ? 'bg-success text-black' :
                                    selectedBooking.status === 'CANCELLED' ? 'bg-error text-white' :
                                    selectedBooking.status === 'COMPLETED' ? 'bg-info text-white' :
                                    'bg-primary-yellow text-black'
                                }`}>
                                    DISPATCH: {selectedBooking.status}
                                </span>
                                <span className={`px-2 py-0.5 border border-black font-mono font-black text-[10px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                    selectedBooking.paymentStatus === 'PAID' ? 'bg-success text-black' :
                                    selectedBooking.paymentStatus === 'FAILED' ? 'bg-error text-white' :
                                    selectedBooking.paymentStatus === 'PAYMENT_PROOF_SUBMITTED' ? 'bg-info text-white' :
                                    selectedBooking.paymentStatus === 'REFUNDED' ? 'bg-bg-tertiary text-text-dim border-text-dim shadow-none' :
                                    'bg-warning text-black'
                                }`}>
                                    FINANCE: {selectedBooking.paymentStatus}
                                </span>
                                <span className="text-[10px] font-mono text-text-dim uppercase ml-auto">
                                    LOGS UPDATED: {formatDateTime(selectedBooking.updatedAt)}
                                </span>
                            </div>

                            {/* Three Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* User Details */}
                                <div className="card bg-bg-primary border-2 border-text-primary rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono">
                                    <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 border-b border-text-primary pb-1">
                                        // CLIENT_DATA
                                    </h3>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Name</div>
                                            <div className="font-bold text-text-primary uppercase">{selectedBooking.user.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Email</div>
                                            <div className="font-bold text-text-primary">{selectedBooking.user.email}</div>
                                        </div>
                                        {selectedBooking.user.contactNo && (
                                            <div>
                                                <div className="text-[10px] text-text-dim uppercase">Phone</div>
                                                <div className="font-bold text-text-primary">{selectedBooking.user.contactNo}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bouncer Details */}
                                <div className="card bg-bg-primary border-2 border-text-primary rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono">
                                    <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 border-b border-text-primary pb-1">
                                        // BOUNCER_DATA
                                    </h3>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Name</div>
                                            <div className="font-bold text-text-primary uppercase">{selectedBooking.bouncer.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Bouncer ID</div>
                                            <div className="font-bold text-text-primary">{selectedBooking.bouncer.id}</div>
                                        </div>
                                        {selectedBooking.bouncer.contactNo && (
                                            <div>
                                                <div className="text-[10px] text-text-dim uppercase">Phone</div>
                                                <div className="font-bold text-text-primary">{selectedBooking.bouncer.contactNo}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div className="card bg-bg-primary border-2 border-text-primary rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono">
                                    <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 border-b border-text-primary pb-1">
                                        // EVENT_INFO
                                    </h3>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Event Type</div>
                                            <div className="font-bold text-text-primary uppercase">{selectedBooking.eventType}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Deployment Location</div>
                                            <div className="font-bold text-text-primary uppercase">{selectedBooking.eventLocation}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-text-dim uppercase">Operational Shift</div>
                                            <div className="font-bold text-text-primary uppercase">{selectedBooking.duration} HOURS</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Timeline */}
                            <div className="card bg-bg-primary border-2 border-text-primary rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono">
                                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 border-b border-text-primary pb-1">// MISSION_TIMELINE</h3>
                                <div className="relative">
                                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-text-primary"></div>
                                    <div className="space-y-4 ml-8">
                                        <div className="relative">
                                            <div className="absolute -left-9 w-2.5 h-2.5 border border-black bg-info shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
                                            <div className="text-xs">
                                                <span className="font-bold text-text-primary uppercase">[01] CONTRACT_CREATED</span>
                                                <span className="text-text-dim ml-2">// {formatDateTime(selectedBooking.createdAt)}</span>
                                            </div>
                                        </div>
                                        {selectedBooking.status !== 'PENDING' && (
                                            <div className="relative">
                                                <div className="absolute -left-9 w-2.5 h-2.5 border border-black bg-success shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"></div>
                                                <div className="text-xs">
                                                    <span className="font-bold text-text-primary uppercase">
                                                        [02] {selectedBooking.status === 'CONFIRMED' ? 'DISPATCH_CONFIRMED' :
                                                            selectedBooking.status === 'COMPLETED' ? 'MISSION_COMPLETED' : 'MISSION_CANCELLED'}
                                                    </span>
                                                    <span className="text-text-dim ml-2">// {formatDateTime(selectedBooking.updatedAt)}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="relative">
                                            <div className={`absolute -left-9 w-2.5 h-2.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${selectedBooking.status === 'COMPLETED' ? 'bg-success' :
                                                selectedBooking.status === 'CANCELLED' ? 'bg-error' : 'bg-warning'
                                                }`}></div>
                                            <div className="text-xs">
                                                <span className="font-bold text-text-primary uppercase">[03] TARGET_EVENT_SHIFT</span>
                                                <span className="text-text-dim ml-2">// {formatDateTime(selectedBooking.eventDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="card bg-bg-primary border-2 border-text-primary rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono">
                                <h3 className="text-xs font-black text-text-primary uppercase tracking-wider mb-4 border-b border-text-primary pb-1">// FINANCIALS</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <div className="text-[10px] text-text-dim uppercase">Total Amount Due</div>
                                        <div className="text-lg font-black text-primary-yellow">{formatCurrency(selectedBooking.totalAmount)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-text-dim uppercase">Verification Action</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                selectedBooking.paymentStatus === 'PAID' ? 'bg-success text-black' :
                                                selectedBooking.paymentStatus === 'FAILED' ? 'bg-error text-white' :
                                                selectedBooking.paymentStatus === 'PAYMENT_PROOF_SUBMITTED' ? 'bg-info text-white' :
                                                selectedBooking.paymentStatus === 'REFUNDED' ? 'bg-bg-tertiary text-text-dim border-text-dim shadow-none' :
                                                'bg-warning text-black'
                                            }`}>
                                                {selectedBooking.paymentStatus}
                                            </span>
                                            {(selectedBooking.paymentStatus === 'PENDING' || selectedBooking.paymentStatus === 'PAYMENT_PROOF_SUBMITTED') && (
                                                <div className="flex gap-1.5 ml-2">
                                                    <button
                                                        onClick={() => handleUpdatePaymentStatus(selectedBooking.id, 'PAID')}
                                                        className="px-2 py-0.5 bg-success text-black border border-black text-[9px] font-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer uppercase"
                                                    >
                                                        Verify
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdatePaymentStatus(selectedBooking.id, 'FAILED')}
                                                        className="px-2 py-0.5 bg-error text-white border border-black text-[9px] font-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer uppercase"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-text-dim uppercase">UPI Transaction ID</div>
                                        <div className="text-sm font-bold text-text-primary mt-1">{selectedBooking.transactionId || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-text-dim uppercase">Hourly Base Rate</div>
                                        <div className="text-sm text-text-primary font-bold mt-1">
                                            {formatCurrency(selectedBooking.totalAmount / selectedBooking.duration)} / HR
                                        </div>
                                    </div>
                                </div>
                                
                                {selectedBooking.paymentProofUrl && (
                                    <div className="mt-4 pt-4 border-t border-text-primary">
                                        <div className="text-[10px] text-text-dim mb-2 font-black uppercase">// UPLOADED_PAYMENT_PROOF_SCREENSHOT</div>
                                        <div className="relative inline-block border-2 border-text-primary rounded-none overflow-hidden bg-black p-1 group">
                                            <img 
                                                src={selectedBooking.paymentProofUrl} 
                                                alt="Payment Proof" 
                                                className="max-h-64 object-contain rounded-none hover:scale-[1.01] transition-transform duration-200 cursor-pointer"
                                                onClick={() => window.open(selectedBooking.paymentProofUrl, '_blank')}
                                            />
                                            <div className="absolute top-2 right-2 bg-black/80 border border-text-primary px-2 py-1 rounded-none text-[8px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                OPEN_NEW_TAB ↗
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedBooking.notes && (
                                <div className="card bg-bg-primary border-2 border-primary-yellow rounded-none p-5 shadow-[2px_2px_0px_0px_rgba(250,204,21,1)] font-mono">
                                    <h3 className="text-xs font-black text-primary-yellow uppercase tracking-wider mb-2">// OPERATOR_LOG_NOTES</h3>
                                    <p className="text-xs text-text-primary leading-relaxed">{selectedBooking.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-4 mt-8 pt-4 border-t-2 border-text-primary">
                            {selectedBooking.status === 'PENDING' && (
                                <button
                                    onClick={() => {
                                        setSelectedBooking(null);
                                        openActionModal(selectedBooking.id, 'confirm');
                                    }}
                                    className="flex-1 btn border-2 border-black bg-success text-black font-mono font-black text-xs py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                >
                                    Confirm Operation
                                </button>
                            )}
                            {(selectedBooking.status === 'PENDING' || selectedBooking.status === 'CONFIRMED') && (
                                <button
                                    onClick={() => {
                                        setSelectedBooking(null);
                                        openActionModal(selectedBooking.id, 'cancel');
                                    }}
                                    className="flex-1 btn border-2 border-black bg-error text-white font-mono font-black text-xs py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                >
                                    Cancel Operation
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="flex-1 btn btn-primary border-2 border-black text-black font-mono font-black text-xs py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                            >
                                CLOSE_AUDIT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {isConfirmModalOpen && bookingToAction && (
                <div
                    className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[60] animate-fade-in"
                    onClick={() => setIsConfirmModalOpen(false)}
                >
                    <div
                        className="card bg-bg-secondary border-3 border-white rounded-none p-8 max-w-md w-full shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] text-center animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6 font-mono">
                            <div className={`w-16 h-16 mx-auto mb-4 border-2 border-black rounded-none flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] ${
                                bookingToAction.action === 'confirm' ? 'bg-success' : 'bg-error'
                            }`}>
                                <svg className={`w-8 h-8 ${bookingToAction.action === 'confirm' ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {bookingToAction.action === 'confirm' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    )}
                                </svg>
                            </div>
                            <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wide">
                                {bookingToAction.action === 'confirm' ? 'CONFIRM_DISPATCH?' : 'CANCEL_DISPATCH?'}
                            </h3>
                            <p className="text-xs text-text-dim uppercase tracking-wider leading-relaxed">
                                {bookingToAction.action === 'confirm'
                                    ? 'Authorize dispatch for target operation and notify security agent.'
                                    : 'Abort this operation and trigger automatic platform refund.'}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 btn border border-text-primary text-text-muted hover:text-white py-2 rounded-none font-mono font-black text-xs uppercase cursor-pointer"
                            >
                                [ NO_ABORT ]
                            </button>
                            <button
                                onClick={() => {
                                    if (bookingToAction.action === 'confirm') {
                                        handleConfirmBooking(bookingToAction.id);
                                    } else {
                                        handleCancelBooking(bookingToAction.id);
                                    }
                                }}
                                className={`flex-1 btn border-2 border-black font-mono font-black text-xs py-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer ${
                                    bookingToAction.action === 'confirm' ? 'bg-success text-black' : 'bg-error text-white'
                                }`}
                            >
                                YES_CONFIRM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

