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
            case 'APPROVED': return 'text-[var(--success)] bg-[var(--success-glow)] border-[var(--success)]';
            case 'REJECTED': return 'text-[var(--error)] bg-[var(--error-glow)] border-[var(--error)]';
            default: return 'text-[var(--pending)] bg-[var(--pending-glow)] border-[var(--pending)]';
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
            <div className="flex gap-2 mb-8 border-b border-[var(--border)] pb-1">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={`px-6 py-3 rounded-t-lg font-semibold text-sm uppercase tracking-wide transition-all border-b-2 ${filter === tab
                            ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--surface-elevated)]'
                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                            }`}
                    >
                        {tab}
                        {tab === 'pending' && !loading && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--error)] text-white text-[10px] font-bold">
                                {bouncers.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Bouncers Table */}
            <div className="card overflow-hidden shadow-xl border-[var(--border-light)]">
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
                                        <div className="text-[var(--text-tertiary)] text-lg mb-2">No records found</div>
                                        <div className="text-sm text-[var(--text-tertiary)] opacity-70">
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
                                                        className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border)] group-hover:ring-[var(--primary)] transition-all"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center ring-2 ring-[var(--border)]">
                                                        <span className="text-[var(--text-tertiary)] font-bold text-xs">
                                                            {bouncer.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-[var(--text-primary)]">
                                                        {bouncer.name}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-tertiary)]">
                                                        {bouncer.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-[var(--text-secondary)] font-mono text-sm">{bouncer.contactNo}</td>
                                        <td className="text-[var(--text-secondary)]">
                                            {bouncer.age} <span className="opacity-40 mx-1">|</span> {bouncer.gender}
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                                                {bouncer.registrationType}
                                            </span>
                                        </td>
                                        <td>
                                            {bouncer.hasGunLicense ? (
                                                <div className="flex items-center text-[var(--success)] text-xs font-bold uppercase tracking-wider">
                                                    <span className="w-2 h-2 bg-[var(--success)] rounded-full mr-2"></span>
                                                    Licensed
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)] text-xs opacity-50">Not Applicable</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(bouncer.verificationStatus)}`}>
                                                {bouncer.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="text-[var(--text-tertiary)] text-xs">
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
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--success-glow)] text-[var(--success)] border border-transparent hover:border-[var(--success)] transition-all"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedBouncer(bouncer); // Opens modal for rejection reason
                                                            }}
                                                            title="Reject"
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--error-glow)] text-[var(--error)] border border-transparent hover:border-[var(--error)] transition-all"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setSelectedBouncer(bouncer)}
                                                    className="btn-base btn-secondary hover:text-[var(--primary)] hover:border-[var(--primary)] text-xs py-1 px-3 ml-2"
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
                        className="fixed inset-y-0 right-0 w-full max-w-5xl bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out animate-slide-in-right"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border)] bg-[var(--surface-elevated)] sticky top-0 z-10">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    {selectedBouncer.profilePhoto ? (
                                        <img
                                            src={selectedBouncer.profilePhoto}
                                            alt={selectedBouncer.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-[var(--primary)] shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center border border-[var(--border)] text-2xl font-bold text-[var(--text-secondary)]">
                                            {selectedBouncer.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[var(--surface-elevated)] ${selectedBouncer.isAvailable ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{selectedBouncer.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${selectedBouncer.verificationStatus === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            selectedBouncer.verificationStatus === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                            {selectedBouncer.verificationStatus}
                                        </span>
                                        <span className="text-[var(--text-tertiary)] text-sm">•</span>
                                        <span className="text-[var(--text-secondary)] text-sm font-mono tracking-wide">{selectedBouncer.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {selectedBouncer.verificationStatus === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={actionLoading}
                                            className="px-6 py-2 rounded-full text-white font-bold text-xs uppercase tracking-wide hover:brightness-110 transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                                            style={{ backgroundColor: '#ef4444' }}
                                        >
                                            Deny
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedBouncer.id)}
                                            disabled={actionLoading}
                                            className="px-6 py-2 rounded-full text-white font-bold text-xs uppercase tracking-wide hover:brightness-110 transition-all shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                                            style={{ backgroundColor: '#22c55e' }}
                                        >
                                            {actionLoading ? (
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                            ) : (
                                                <span>Approve</span>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-8 pb-40 space-y-8 custom-scrollbar bg-gradient-to-b from-[var(--surface)] to-[var(--surface-elevated)]">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-light)] hover:border-[var(--primary-glow)] transition-colors group">
                                    <div className="text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase mb-1 group-hover:text-[var(--primary)] transition-colors">Registration</div>
                                    <div className="text-lg font-semibold text-[var(--text-primary)]">{selectedBouncer.registrationType}</div>
                                </div>
                                <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-light)] hover:border-[var(--primary-glow)] transition-colors group">
                                    <div className="text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase mb-1 group-hover:text-[var(--primary)] transition-colors">Contact</div>
                                    <div className="text-lg font-semibold text-[var(--text-primary)] font-mono">{selectedBouncer.contactNo}</div>
                                </div>
                                <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-light)] hover:border-[var(--primary-glow)] transition-colors group">
                                    <div className="text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase mb-1 group-hover:text-[var(--primary)] transition-colors">Demographics</div>
                                    <div className="text-lg font-semibold text-[var(--text-primary)]">{selectedBouncer.age} Yrs / {selectedBouncer.gender}</div>
                                </div>
                                <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-light)] hover:border-[var(--primary-glow)] transition-colors group">
                                    <div className="text-xs font-bold tracking-widest text-[var(--text-tertiary)] uppercase mb-1 group-hover:text-[var(--primary)] transition-colors">Gun License</div>
                                    <div className={`text-lg font-semibold ${selectedBouncer.hasGunLicense ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'}`}>
                                        {selectedBouncer.hasGunLicense ? '✓ Licensed' : 'No License'}
                                    </div>
                                </div>
                            </div>

                            {/* Details & Documents */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left: Personal Details */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-[var(--surface-elevated)]/50 p-6 rounded-2xl border border-[var(--border-light)]">
                                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 border-b border-[var(--border)] pb-2">
                                            Identity Details
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-xs font-bold tracking-widest text-[var(--text-tertiary)] mb-1">Email Address</label>
                                                <div className="text-base text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors break-words">{selectedBouncer.user.email}</div>
                                            </div>
                                            {selectedBouncer.agencyReferralCode && (
                                                <div className="group">
                                                    <label className="block text-xs font-bold tracking-widest text-[var(--text-tertiary)] mb-1">Agency Code</label>
                                                    <div className="text-base text-[var(--primary)] font-mono">{selectedBouncer.agencyReferralCode}</div>
                                                </div>
                                            )}
                                            {selectedBouncer.verificationStatus === 'REJECTED' && selectedBouncer.rejectionReason && (
                                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mt-4 animate-pulse">
                                                    <label className="block text-xs font-bold uppercase tracking-wide mb-1 opacity-70">Rejection Reason</label>
                                                    <div className="text-sm italic">"{selectedBouncer.rejectionReason}"</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Optional Gallery / Extra Photos */}
                                    {selectedBouncer.gallery && selectedBouncer.gallery.length > 0 && (
                                        <div className="bg-[var(--surface-elevated)]/50 p-6 rounded-2xl border border-[var(--border-light)] mt-6">
                                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 border-b border-[var(--border)] pb-2 flex justify-between items-center">
                                                <span>Gallery</span>
                                                <span className="text-xs text-[var(--primary)]">{selectedBouncer.gallery.length} Photos</span>
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedBouncer.gallery.map((photoUrl, idx) => (
                                                    <a key={idx} href={photoUrl} target="_blank" rel="noopener noreferrer" className="block w-full aspect-square rounded-xl overflow-hidden border border-[var(--border-light)] hover:border-[var(--primary)] transition-colors hover:shadow-lg group">
                                                        <img src={photoUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Documents & Details Map */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Professional Details mapped to top right to utilize width better */}
                                    {(selectedBouncer.bio || selectedBouncer.skills || selectedBouncer.experience) && (
                                        <div className="bg-[var(--surface-elevated)]/50 p-6 rounded-2xl border border-[var(--border-light)]">
                                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 border-b border-[var(--border)] pb-2 flex justify-between items-center">
                                                <span>Professional Details</span>
                                                {selectedBouncer.experience ? (
                                                    <span className="text-xs text-[var(--primary)] font-bold">{selectedBouncer.experience} Years Exp.</span>
                                                ) : null}
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6">
                                                {selectedBouncer.bio && (
                                                    <div className="group">
                                                        <label className="block text-xs font-bold tracking-widest text-[var(--text-tertiary)] mb-2">Professional Bio</label>
                                                        <div className="text-sm text-[var(--text-secondary)] leading-relaxed bg-black/20 p-4 rounded-xl border border-[var(--border)]">{selectedBouncer.bio}</div>
                                                    </div>
                                                )}
                                                {selectedBouncer.skills && selectedBouncer.skills.length > 0 && (
                                                    <div>
                                                        <label className="block text-xs font-bold tracking-widest text-[var(--text-tertiary)] mb-2">Tactical Skills & Qualifications</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedBouncer.skills.map((skill, idx) => (
                                                                <span key={idx} className="px-3 py-1 bg-[var(--surface)] border border-[var(--border-light)] text-[var(--text-secondary)] text-sm rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-[var(--surface-elevated)]/50 p-6 rounded-2xl border border-[var(--border-light)]">
                                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 border-b border-[var(--border)] pb-2 flex justify-between items-center">
                                            <span>Verification Documents</span>
                                            <span className="text-xs text-[var(--text-tertiary)] font-normal normal-case">Click to expand • Full Resolution</span>
                                        </h3>

                                        <div className="space-y-8">
                                            {/* Govt ID */}
                                            <div className="bg-black/80 rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl">
                                                <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-elevated)] border-b border-[var(--border)]">
                                                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Government ID</span>
                                                    <a href={selectedBouncer.govtIdPhoto} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 group">
                                                        Open Full Size <span className="group-hover:translate-x-1 transition-transform">↗</span>
                                                    </a>
                                                </div>
                                                <div className="p-4 flex items-center justify-center bg-[#050505]">
                                                    <img
                                                        src={selectedBouncer.govtIdPhoto}
                                                        alt="Government ID"
                                                        className="w-full h-auto max-h-[600px] object-contain rounded-lg hover:scale-[1.01] transition-transform duration-500"
                                                    />
                                                </div>

                                                {/* Action Buttons Below Image */}

                                            </div>

                                            {/* Gun License */}
                                            {selectedBouncer.hasGunLicense && selectedBouncer.gunLicensePhoto && (
                                                <div className="bg-black/80 rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl">
                                                    <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-elevated)] border-b border-[var(--border)]">
                                                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Gun License</span>
                                                        <a href={selectedBouncer.gunLicensePhoto} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 group">
                                                            Open Full Size <span className="group-hover:translate-x-1 transition-transform">↗</span>
                                                        </a>
                                                    </div>
                                                    <div className="p-4 flex items-center justify-center bg-[#050505]">
                                                        <img
                                                            src={selectedBouncer.gunLicensePhoto}
                                                            alt="Gun License"
                                                            className="w-full h-auto max-h-[600px] object-contain rounded-lg hover:scale-[1.01] transition-transform duration-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Large Floating Action Buttons */}


                        {selectedBouncer.verificationStatus !== 'PENDING' && (
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
                                <button
                                    onClick={() => setSelectedBouncer(null)}
                                    className="px-8 py-3 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] shadow-lg hover:shadow-[var(--primary-glow)] transition-all font-medium uppercase tracking-wider"
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
                            <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 animate-scale-up">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Reject Application</h3>
                                <p className="text-[var(--text-secondary)] text-sm mb-6">Please provide a reason for rejecting this application. This will be sent to the applicant.</p>

                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                    className="w-full h-32 bg-[var(--surface-elevated)] border border-[var(--border-light)] rounded-xl p-4 text-[var(--text-primary)] focus:border-[var(--error)] focus:outline-none focus:ring-1 focus:ring-[var(--error)] transition-all resize-none mb-6"
                                    autoFocus
                                />

                                <div className="flex gap-4 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setRejectionReason('');
                                        }}
                                        className="px-6 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors font-medium"
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
