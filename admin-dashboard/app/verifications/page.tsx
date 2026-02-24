'use client';

import { useState, useEffect } from 'react';

interface Bouncer {
    id: string;
    name: string;
    contactNo: string;
    age: number;
    gender: string;
    profilePhoto?: string;
    govtIdPhoto: string;
    hasGunLicense: boolean;
    gunLicensePhoto?: string;
    isGunman: boolean;
    registrationType: string;
    agencyReferralCode?: string;
    verificationStatus: string;
    verifiedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    user: {
        email: string;
        name: string;
    };
    isAvailable?: boolean;
    bio?: string;
    experience?: number;
    skills?: string[];
    gallery?: string[];
}

export default function VerificationsPage() {
    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedBouncer, setSelectedBouncer] = useState<Bouncer | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchBouncers();
    }, [filter]);

    const fetchBouncers = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'all'
                ? '/api/verifications'
                : `/api/verifications?status=${filter}`;

            const response = await fetch(endpoint, {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch verifications');
            }

            const data = await response.json();
            setBouncers(data);
        } catch (error) {
            console.error('Failed to fetch verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this bouncer?')) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/verifications/${id}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminId: 'admin' }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve bouncer');
            }

            if (data.warning) {
                alert(`Bouncer approved with warning: ${data.warning}`);
            } else {
                alert('Bouncer approved successfully!');
            }

            setSelectedBouncer(null);
            fetchBouncers();
        } catch (error: any) {
            console.error('Error approving bouncer:', error);
            alert(`Approval Failed: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        if (!confirm('Are you sure you want to reject this bouncer?')) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/verifications/${id}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminId: 'admin',
                    reason: rejectionReason
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to reject bouncer');
            }

            alert('Bouncer rejected');
            setSelectedBouncer(null);
            setRejectionReason('');
            fetchBouncers();
        } catch (error) {
            console.error('Error rejecting bouncer:', error);
            alert('Failed to reject bouncer');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-success bg-success-glow border-success';
            case 'REJECTED': return 'text-error bg-error-glow border-error';
            default: return 'text-pending bg-pending-glow border-pending';
        }
    };

    return (
        <div className="layout-container animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        Bouncer Verifications
                    </h1>
                    <p className="page-subtitle">
                        Review and manage bouncer registration requests
                    </p>
                </div>

                {/* Stats or Actions could go here */}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8 border-b border-border-brand pb-1">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={`px-6 py-3 rounded-t-lg font-semibold text-sm uppercase tracking-wide transition-all border-b-2 ${filter === tab
                            ? 'border-primary-yellow text-primary-yellow bg-surface-elevated'
                            : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                            }`}
                    >
                        {tab}
                        {tab === 'pending' && !loading && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold">
                                {bouncers.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Bouncers Table */}
            <div className="card overflow-hidden shadow-xl border-border-light">
                <div className="overflow-x-auto">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>Bouncer Profile</th>
                                <th>Contact Info</th>
                                <th>Age / Gender</th>
                                <th>Registration</th>
                                <th>Gun License</th>
                                <th>Status</th>
                                <th>Applied Date</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={8} className="p-0">
                                            <div className="skeleton h-16 w-full opacity-20 my-1"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : bouncers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-16">
                                        <div className="text-text-tertiary text-lg mb-2">No records found</div>
                                        <div className="text-sm text-text-tertiary opacity-70">
                                            There are no {filter !== 'all' ? filter : ''} verifications at the moment.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                bouncers.map((bouncer) => (
                                    <tr key={bouncer.id} className="group">
                                        <td>
                                            <div className="flex items-center gap-4">
                                                {bouncer.profilePhoto ? (
                                                    <img
                                                        src={bouncer.profilePhoto}
                                                        alt={bouncer.name}
                                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-border group-hover:ring-primary transition-all"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center ring-2 ring-border">
                                                        <span className="text-text-tertiary font-bold text-xs">
                                                            {bouncer.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-text-primary">
                                                        {bouncer.name}
                                                    </div>
                                                    <div className="text-xs text-text-tertiary">
                                                        {bouncer.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-text-secondary font-mono text-sm">{bouncer.contactNo}</td>
                                        <td className="text-text-secondary">
                                            {bouncer.age} <span className="opacity-40 mx-1">|</span> {bouncer.gender}
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-surface-elevated border border-border-brand text-text-secondary">
                                                {bouncer.registrationType}
                                            </span>
                                        </td>
                                        <td>
                                            {bouncer.hasGunLicense ? (
                                                <div className="flex items-center text-success text-xs font-bold uppercase tracking-wider">
                                                    <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
                                                    Licensed
                                                </div>
                                            ) : (
                                                <span className="text-text-tertiary text-xs opacity-50">Not Applicable</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(bouncer.verificationStatus)}`}>
                                                {bouncer.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="text-text-tertiary text-xs">
                                            {new Date(bouncer.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {bouncer.verificationStatus === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleApprove(bouncer.id);
                                                            }}
                                                            title="Approve"
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-success-glow text-success border border-transparent hover:border-success transition-all"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedBouncer(bouncer); // Opens modal for rejection reason
                                                            }}
                                                            title="Reject"
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-glow text-error border border-transparent hover:border-error transition-all"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setSelectedBouncer(bouncer)}
                                                    className="btn-base btn-secondary hover:text-primary hover:border-primary text-sm py-1.5 px-4 ml-2 font-bold"
                                                >
                                                    Review
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

            {/* Bouncer Detail Drawer (Right Side) */}
            {selectedBouncer && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
                        onClick={() => setSelectedBouncer(null)}
                    />

                    {/* Drawer Panel */}
                    <div
                        className="fixed inset-y-0 right-0 w-full md:w-[85vw] lg:w-[75vw] xl:w-[65vw] max-w-[1400px] bg-surface border-l border-border-brand shadow-2xl flex flex-col z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] animate-slide-in-right"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-10 py-7 border-b border-border-brand bg-gradient-to-r from-surface-elevated to-surface sticky top-0 z-10 shadow-sm">
                            <div className="flex items-center gap-8">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-primary blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                                    {selectedBouncer.profilePhoto ? (
                                        <img
                                            src={selectedBouncer.profilePhoto}
                                            alt={selectedBouncer.name}
                                            className="relative w-20 h-20 rounded-full object-cover border-2 border-primary shadow-2xl z-10"
                                        />
                                    ) : (
                                        <div className="relative w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center border-2 border-border-brand text-3xl font-extrabold text-text-secondary z-10">
                                            {selectedBouncer.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-surface-elevated z-20 shadow-md ${selectedBouncer.isAvailable ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-black text-text-primary tracking-tight leading-none uppercase">{selectedBouncer.name}</h2>
                                        {selectedBouncer.isGunman && (
                                            <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-sm flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                                                GUNMAN
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className={`px-3 py-1 rounded text-[11px] font-black tracking-widest uppercase border-2 ${selectedBouncer.verificationStatus === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                            selectedBouncer.verificationStatus === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                            {selectedBouncer.verificationStatus === 'PENDING' ? 'Under Review' : selectedBouncer.verificationStatus}
                                        </span>
                                        <span className="h-1 w-1 bg-border rounded-full"></span>
                                        <span className="text-text-tertiary text-xs font-mono tracking-widest bg-black/30 px-2 py-1 rounded border border-border-brand uppercase">
                                            ID: {selectedBouncer.id.split('-')[0]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                {selectedBouncer.verificationStatus === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={actionLoading}
                                            className="px-8 py-2.5 rounded-full text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0 bg-error"
                                        >
                                            Deny
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedBouncer.id)}
                                            disabled={actionLoading}
                                            className="px-8 py-2.5 rounded-full text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 bg-success"
                                        >
                                            {actionLoading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <span>Approve</span>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-6 custom-scrollbar bg-gradient-to-b from-surface via-surface to-surface-elevated">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-sm hover:border-primary-glow transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <svg className="w-8 h-8 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div className="text-[10px] font-black tracking-[0.2em] text-text-tertiary uppercase mb-2 group-hover:text-primary transition-colors">Registration</div>
                                    <div className="text-xl font-extrabold text-text-primary uppercase tracking-tight">{selectedBouncer.registrationType}</div>
                                </div>
                                <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-sm hover:border-primary-glow transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <svg className="w-8 h-8 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div className="text-[10px] font-black tracking-[0.2em] text-text-tertiary uppercase mb-2 group-hover:text-primary transition-colors">Contact</div>
                                    <div className="text-xl font-extrabold text-text-primary font-mono">{selectedBouncer.contactNo}</div>
                                </div>
                                <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-sm hover:border-primary-glow transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <svg className="w-8 h-8 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <div className="text-[10px] font-black tracking-[0.2em] text-text-tertiary uppercase mb-2 group-hover:text-primary transition-colors">Personal</div>
                                    <div className="text-xl font-extrabold text-text-primary">{selectedBouncer.age}Y • {selectedBouncer.gender}</div>
                                </div>
                                <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-sm hover:border-primary-glow transition-all group relative overflow-hidden text-center">
                                    <div className="text-[10px] font-black tracking-[0.2em] text-text-tertiary uppercase mb-2 group-hover:text-primary transition-colors">Status</div>
                                    <div className={`text-xl font-black uppercase tracking-widest ${selectedBouncer.hasGunLicense ? 'text-success animate-pulse' : 'text-text-secondary'}`}>
                                        {selectedBouncer.hasGunLicense ? 'Licensed' : 'Unlicensed'}
                                    </div>
                                </div>
                            </div>

                            {/* Details & Documents */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Personal Details */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>
                                        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <span className="w-6 h-px bg-primary"></span>
                                            Identity Data
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black tracking-widest text-text-tertiary uppercase mb-2">Registered Email</label>
                                                <div className="text-lg font-bold text-text-primary transition-colors break-all leading-tight">
                                                    {selectedBouncer.user.email}
                                                </div>
                                            </div>
                                            {selectedBouncer.agencyReferralCode && (
                                                <div className="group">
                                                    <label className="block text-[10px] font-black tracking-widest text-text-tertiary uppercase mb-2">Agency Referral</label>
                                                    <div className="inline-flex items-center px-4 py-2 bg-black/40 border border-primary-glow rounded-lg text-lg font-black text-primary font-mono tracking-tighter">
                                                        {selectedBouncer.agencyReferralCode}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedBouncer.verificationStatus === 'REJECTED' && selectedBouncer.rejectionReason && (
                                                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl mt-4 ring-1 ring-red-500/10">
                                                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">
                                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                                        Rejection Details
                                                    </label>
                                                    <div className="text-sm font-medium text-red-200 leading-relaxed italic border-l-2 border-red-500/30 pl-4">
                                                        "{selectedBouncer.rejectionReason}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Optional Gallery / Extra Photos */}
                                    {selectedBouncer.gallery && selectedBouncer.gallery.length > 0 && (
                                        <div className="bg-surface-elevated/50 p-6 rounded-2xl border border-border-light mt-6">
                                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border-brand pb-2 flex justify-between items-center">
                                                <span>Gallery</span>
                                                <span className="text-xs text-primary">{selectedBouncer.gallery.length} Photos</span>
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedBouncer.gallery.map((photoUrl, idx) => (
                                                    <a key={idx} href={photoUrl} target="_blank" rel="noopener noreferrer" className="block w-full aspect-square rounded-xl overflow-hidden border border-border-light hover:border-primary transition-colors hover:shadow-lg group">
                                                        <img src={photoUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Documents & Details Map */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Professional Details */}
                                    {(selectedBouncer.bio || selectedBouncer.skills || selectedBouncer.experience) && (
                                        <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary opacity-[0.03] blur-2xl rounded-full translate-x-12 -translate-y-12"></div>
                                            <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-6 flex justify-between items-center">
                                                <span className="flex items-center gap-3">
                                                    <span className="w-5 h-px bg-primary"></span>
                                                    Professional
                                                </span>
                                                {selectedBouncer.experience ? (
                                                    <span className="px-2 py-1 bg-primary text-black rounded text-[9px] font-black uppercase tracking-tighter">
                                                        {selectedBouncer.experience} YRS
                                                    </span>
                                                ) : null}
                                            </h3>
                                            <div className="space-y-4">
                                                {selectedBouncer.bio && (
                                                    <div className="group">
                                                        <label className="block text-[9px] font-black tracking-widest text-text-tertiary uppercase mb-2">Bio</label>
                                                        <div className="text-sm text-text-secondary leading-relaxed bg-black/30 p-4 rounded-xl border border-border-brand font-medium">
                                                            {selectedBouncer.bio}
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedBouncer.skills && selectedBouncer.skills.length > 0 && (
                                                    <div>
                                                        <label className="block text-[9px] font-black tracking-widest text-text-tertiary uppercase mb-3">Skills</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedBouncer.skills.map((skill, idx) => (
                                                                <span key={idx} className="px-3 py-1.5 bg-surface border border-border-brand text-text-primary text-[10px] font-bold rounded-lg hover:border-primary hover:bg-primary hover:text-black transition-all cursor-default uppercase tracking-tight">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-surface-elevated p-5 rounded-2xl border border-border-brand shadow-2xl">
                                        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-5 flex justify-between items-end border-b border-border-brand pb-3">
                                            <span className="flex items-center gap-2">
                                                <span className="w-6 h-0.5 bg-primary"></span>
                                                Documents
                                            </span>
                                            <span className="text-[9px] text-text-tertiary font-bold uppercase">
                                                <span className="text-primary">Click</span> to enlarge
                                            </span>
                                        </h3>

                                        <div className="space-y-4">
                                            {/* Govt ID */}
                                            <div className="bg-black/80 rounded-xl border border-border-brand overflow-hidden shadow-lg group hover:border-primary transition-all">
                                                <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border-brand">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                        <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">Govt ID</span>
                                                    </div>
                                                    <a href={selectedBouncer.govtIdPhoto} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-primary hover:text-white transition-colors">
                                                        View ↗
                                                    </a>
                                                </div>
                                                <div className="p-3 flex items-center justify-center bg-[#080808] max-h-[180px]">
                                                    <img
                                                        src={selectedBouncer.govtIdPhoto}
                                                        alt="Government ID"
                                                        className="w-full h-auto max-h-[160px] object-contain rounded-lg hover:scale-[1.02] transition-transform duration-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Gun License */}
                                            {selectedBouncer.hasGunLicense && selectedBouncer.gunLicensePhoto && (
                                                <div className="bg-black/80 rounded-xl border border-border-brand overflow-hidden shadow-lg group hover:border-red-500/50 transition-all">
                                                    <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-border-brand">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                            <span className="text-[10px] font-black text-text-primary uppercase tracking-wider">Arms License</span>
                                                        </div>
                                                        <a href={selectedBouncer.gunLicensePhoto} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-red-400 hover:text-white transition-colors">
                                                            View ↗
                                                        </a>
                                                    </div>
                                                    <div className="p-3 flex items-center justify-center bg-[#080808] max-h-[180px]">
                                                        <img
                                                            src={selectedBouncer.gunLicensePhoto}
                                                            alt="Gun License"
                                                            className="w-full h-auto max-h-[160px] object-contain rounded-lg hover:scale-[1.02] transition-transform duration-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Bottom Action Bar */}
                        {selectedBouncer.verificationStatus === 'PENDING' && (
                            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-surface-elevated border-t border-border-brand flex items-center justify-between z-20">
                                <button
                                    onClick={() => setSelectedBouncer(null)}
                                    className="px-6 py-2.5 rounded-xl bg-surface border border-border-brand text-text-secondary hover:text-text-primary hover:border-primary transition-all font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionLoading}
                                        className="px-8 py-2.5 rounded-xl text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all shadow-md bg-error"
                                    >
                                        Deny
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedBouncer.id)}
                                        disabled={actionLoading}
                                        className="px-8 py-2.5 rounded-xl text-white font-bold text-sm uppercase tracking-wide hover:brightness-110 transition-all shadow-md flex items-center gap-2 bg-success"
                                    >
                                        {actionLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <span>Approve</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedBouncer.verificationStatus !== 'PENDING' && (
                            <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-surface-elevated border-t border-border-brand flex items-center justify-center z-20">
                                <button
                                    onClick={() => setSelectedBouncer(null)}
                                    className="px-8 py-3 rounded-xl bg-surface border border-border-brand text-text-secondary hover:text-text-primary hover:border-primary shadow-lg hover:shadow-primary-glow transition-all font-semibold uppercase tracking-wider"
                                >
                                    Close Review
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Rejection Reason Popup (Centered) */}
                    {showRejectModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowRejectModal(false)}></div>
                            <div className="relative w-full max-w-lg bg-surface border border-border-brand rounded-2xl shadow-2xl p-8 animate-scale-up">
                                <h3 className="text-xl font-bold text-text-primary mb-2">Reject Application</h3>
                                <p className="text-text-secondary text-sm mb-6">Please provide a reason for rejecting this application. This will be sent to the applicant.</p>

                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                    className="w-full h-32 bg-surface-elevated border border-border-light rounded-xl p-4 text-text-primary focus:border-error focus:outline-none focus:ring-1 focus:ring-error transition-all resize-none mb-6"
                                    autoFocus
                                />

                                <div className="flex gap-4 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectionReason('');
                                        }}
                                        className="px-6 py-3 rounded-xl text-text-secondary hover:bg-surface-elevated transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleReject(selectedBouncer.id);
                                            setShowRejectModal(false);
                                        }}
                                        disabled={!rejectionReason.trim() || actionLoading}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all"
                                    >
                                        {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )
            }
        </div >
    );
}


