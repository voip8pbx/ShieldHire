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



interface Client {
    id: string;
    userId: string;
    verificationStatus: string;
    createdAt: string;
    user: {
        email: string;
        name: string;
    };
    rejectionReason?: string;
}

export default function VerificationsPage() {

    const [bouncers, setBouncers] = useState<Bouncer[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [verificationType, setVerificationType] = useState<'bouncer' | 'client'>('bouncer');

    const [loading, setLoading] = useState(true);

    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    const [selectedBouncer, setSelectedBouncer] = useState<Bouncer | null>(null);

    const [rejectionReason, setRejectionReason] = useState('');

    const [showRejectModal, setShowRejectModal] = useState(false);

    const [actionLoading, setActionLoading] = useState(false);



    useEffect(() => {

        fetchBouncers();

    }, [filter, verificationType]);



    const fetchBouncers = async () => {

        try {

            setLoading(true);

            const baseEndpoint = verificationType === 'bouncer' ? '/api/verifications' : '/api/verifications/clients';
            const endpoint = filter === 'all'

                ? baseEndpoint

                : `${baseEndpoint}?status=${filter}`;



            const response = await fetch(endpoint, {

                cache: 'no-store',

            });



            if (!response.ok) {

                throw new Error('Failed to fetch verifications');

            }



            const data = await response.json();

            if (verificationType === 'bouncer') {
                setBouncers(data);
                setClients([]);
            } else {
                setClients(data);
                setBouncers([]);
            }

        } catch (error) {

            console.error('Failed to fetch verifications:', error);

        } finally {

            setLoading(false);

        }

    };



    const handleApprove = async (id: string) => {

        if (!confirm(`Are you sure you want to approve this ${verificationType}?`)) return;



        setActionLoading(true);

        try {

            const endpoint = verificationType === 'bouncer'
                ? `/api/verifications/${id}/approve`
                : `/api/verifications/clients/${id}/approve`;

            const response = await fetch(endpoint, {

                method: 'PATCH',

                headers: {

                    'Content-Type': 'application/json',

                },

                body: JSON.stringify({ adminId: 'admin' }),

            });



            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.error || `Failed to approve ${verificationType}`);

            }



            if (data.warning) {

                alert(`${verificationType === 'bouncer' ? 'Bouncer' : 'Client'} approved with warning: ${data.warning}`);

            } else {

                alert(`${verificationType === 'bouncer' ? 'Bouncer' : 'Client'} approved successfully!`);

            }



            setSelectedBouncer(null);
            setSelectedClient(null);

            fetchBouncers();

        } catch (error: any) {

            console.error(`Error approving ${verificationType}:`, error);

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



        if (!confirm(`Are you sure you want to reject this ${verificationType}?`)) return;



        setActionLoading(true);

        try {

            const endpoint = verificationType === 'bouncer'
                ? `/api/verifications/${id}/reject`
                : `/api/verifications/clients/${id}/reject`;

            const response = await fetch(endpoint, {

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

                throw new Error(`Failed to reject ${verificationType}`);

            }



            alert(`${verificationType === 'bouncer' ? 'Bouncer' : 'Client'} rejected`);

            setSelectedBouncer(null);
            setSelectedClient(null);

            setRejectionReason('');

            fetchBouncers();

        } catch (error) {

            console.error(`Error rejecting ${verificationType}:`, error);

            alert('Failed to reject bouncer');

        } finally {

            setActionLoading(false);

        }

    };







    return (
        <div className="layout-container animate-fade-in space-y-8">
            {/* Header */}
            <div className="page-header border-b-3 border-text-primary pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="page-title text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-text-primary">
                        {verificationType === 'bouncer' ? 'Bouncer Verifications' : 'Client Verifications'}
                    </h1>
                    <p className="page-subtitle text-xs font-mono text-text-muted uppercase tracking-wider mt-1">
                        // {verificationType === 'bouncer' ? 'Verify and manage bouncer registration applications' : 'Verify and manage client account credentials'}
                    </p>
                </div>

                {/* Verification Type Toggle */}
                <div className="flex gap-2 bg-bg-secondary p-1 rounded-none border-2 border-text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <button
                        onClick={() => {
                            setVerificationType('bouncer');
                            setSelectedBouncer(null);
                            setSelectedClient(null);
                        }}
                        className={`px-4 py-2 rounded-none font-black font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            verificationType === 'bouncer'
                                ? 'bg-primary-yellow text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                                : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                        Bouncers
                    </button>
                    <button
                        onClick={() => {
                            setVerificationType('client');
                            setSelectedBouncer(null);
                            setSelectedClient(null);
                        }}
                        className={`px-4 py-2 rounded-none font-black font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            verificationType === 'client'
                                ? 'bg-primary-yellow text-black border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]'
                                : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                        Clients
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3 mb-6">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={`px-4 py-2 border-2 border-black font-black font-mono text-xs uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none cursor-pointer ${
                            filter === tab
                                ? 'bg-primary-yellow text-black'
                                : 'bg-bg-secondary text-text-muted hover:bg-surface-hover hover:text-white'
                        }`}
                    >
                        {tab}
                        {tab === 'pending' && !loading && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-none bg-error text-white border border-black font-mono font-black text-[9px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                {verificationType === 'bouncer' ? bouncers.length : clients.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Bouncers Table */}
            {verificationType === 'bouncer' ? (
                <div className="card border-3 border-text-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="table-container">
                        <table className="professional-table">
                            <thead>
                                <tr>
                                    <th>BOUNCER IDENTITY</th>
                                    <th>CONTACT INFO</th>
                                    <th>AGE / GENDER</th>
                                    <th>REGISTRATION</th>
                                    <th>GUN LICENSE</th>
                                    <th>STATUS</th>
                                    <th>APPLIED DATE</th>
                                    <th className="text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={8} className="p-0 text-center py-6">
                                                <div className="skeleton h-12 w-full opacity-20 my-1"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : bouncers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-16 font-mono text-text-tertiary">
                                            NO PENDING BOUNCER APPLICATIONS IN SHIFT LOG
                                        </td>
                                    </tr>
                                ) : (
                                    bouncers.map((bouncer) => (
                                        <tr key={bouncer.id} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    {bouncer.profilePhoto ? (
                                                        <img
                                                            src={bouncer.profilePhoto}
                                                            alt={bouncer.name}
                                                            className="w-10 h-10 rounded-none object-cover border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-none bg-bg-secondary flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]">
                                                            <span className="text-text-tertiary font-black font-mono text-xs">
                                                                {bouncer.name.substring(0, 2).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-black text-text-primary mb-1 uppercase tracking-wide leading-tight">
                                                            {bouncer.name}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-text-dim uppercase">
                                                            {bouncer.user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-text-primary font-bold font-mono text-xs">{bouncer.contactNo}</td>
                                            <td className="text-text-secondary font-mono text-xs uppercase">
                                                {bouncer.age} YRS <span className="text-text-dim">//</span> {bouncer.gender}
                                            </td>
                                            <td>
                                                <span className="px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase bg-info text-white inline-block">
                                                    {bouncer.registrationType}
                                                </span>
                                            </td>
                                            <td>
                                                {bouncer.hasGunLicense ? (
                                                    <span className="px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase bg-success text-black">
                                                        LICENSED
                                                    </span>
                                                ) : (
                                                    <span className="text-text-tertiary font-mono text-xs">UNARMED</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                    bouncer.verificationStatus === 'APPROVED' ? 'bg-success text-black' :
                                                    bouncer.verificationStatus === 'REJECTED' ? 'bg-error text-white' :
                                                    'bg-primary-yellow text-black'
                                                }`}>
                                                    {bouncer.verificationStatus}
                                                </span>
                                            </td>
                                            <td className="text-text-secondary font-mono text-xs">
                                                {new Date(bouncer.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {bouncer.verificationStatus === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApprove(bouncer.id);
                                                                }}
                                                                title="Approve"
                                                                className="w-7 h-7 flex items-center justify-center border-2 border-black bg-success text-black font-black text-sm rounded-none shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedBouncer(bouncer);
                                                                }}
                                                                title="Reject"
                                                                className="w-7 h-7 flex items-center justify-center border-2 border-black bg-error text-white font-black text-sm rounded-none shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                                                            >
                                                                ✕
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedBouncer(bouncer)}
                                                        className="btn btn-sm btn-primary py-1 px-3 border-2 border-black font-mono font-black text-[10px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase"
                                                    >
                                                        INSPECT
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
            ) : (
                /* Clients Table */
                <div className="card border-3 border-text-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="table-container">
                        <table className="professional-table">
                            <thead>
                                <tr>
                                    <th>CLIENT PROFILE</th>
                                    <th>CONTACT INFO</th>
                                    <th>STATUS</th>
                                    <th>APPLIED DATE</th>
                                    <th className="text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan={5} className="p-0 text-center py-6">
                                                <div className="skeleton h-12 w-full opacity-20 my-1"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-16 font-mono text-text-tertiary">
                                            NO PENDING CLIENT APPLICATIONS IN SHIFT LOG
                                        </td>
                                    </tr>
                                ) : (
                                    clients.map((client) => (
                                        <tr key={client.id} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-none bg-bg-secondary flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]">
                                                        <span className="text-text-tertiary font-black font-mono text-xs">
                                                            {client.user?.name?.charAt(0).toUpperCase() || 'C'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-text-primary mb-1 uppercase tracking-wide leading-tight">
                                                            {client.user?.name || 'Client'}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-text-dim uppercase">
                                                            ID: {client.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-text-primary font-bold font-mono text-xs">{client.user?.email}</div>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                    client.verificationStatus === 'APPROVED' ? 'bg-success text-black' :
                                                    client.verificationStatus === 'REJECTED' ? 'bg-error text-white' :
                                                    'bg-primary-yellow text-black'
                                                }`}>
                                                    {client.verificationStatus}
                                                </span>
                                            </td>
                                            <td className="text-text-secondary font-mono text-xs">
                                                {new Date(client.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {client.verificationStatus === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleApprove(client.id);
                                                                }}
                                                                title="Approve"
                                                                className="w-7 h-7 flex items-center justify-center border-2 border-black bg-success text-black font-black text-sm rounded-none shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedClient(client);
                                                                }}
                                                                title="Reject"
                                                                className="w-7 h-7 flex items-center justify-center border-2 border-black bg-error text-white font-black text-sm rounded-none shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                                                            >
                                                                ✕
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedClient(client)}
                                                        className="btn btn-sm btn-primary py-1 px-3 border-2 border-black font-mono font-black text-[10px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase"
                                                    >
                                                        INSPECT
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
            )}

            {/* Bouncer Detail Drawer / Modal Panel */}
            {selectedBouncer && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
                        onClick={() => setSelectedBouncer(null)}
                    />

                    {/* Popup Panel */}
                    <div
                        className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-[95vw] h-screen max-h-[85vh] max-w-[1200px] bg-bg-secondary border-3 border-white rounded-none shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] flex flex-col z-50 overflow-hidden animate-scale-up"
                        style={{ top: '7%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex-none flex items-center justify-between px-8 py-5 border-b-3 border-text-primary bg-bg-primary z-30 shadow-sm">
                            <div className="flex items-center gap-4">
                                {selectedBouncer.profilePhoto ? (
                                    <img
                                        src={selectedBouncer.profilePhoto}
                                        alt={selectedBouncer.name}
                                        className="w-12 h-12 rounded-none object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-none bg-bg-secondary flex items-center justify-center border-2 border-black text-xl font-black text-text-secondary">
                                        {selectedBouncer.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-black text-text-primary tracking-wider uppercase font-mono">{selectedBouncer.name}</h2>
                                        {selectedBouncer.isGunman && (
                                            <span className="bg-primary-yellow text-black text-[9px] font-black px-2 py-0.5 border border-black font-mono rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                                                GUNMAN
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 font-mono">
                                        <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase ${
                                            selectedBouncer.verificationStatus === 'APPROVED' ? 'bg-success text-black' :
                                            selectedBouncer.verificationStatus === 'REJECTED' ? 'bg-error text-white' :
                                            'bg-primary-yellow text-black'
                                        }`}>
                                            {selectedBouncer.verificationStatus === 'PENDING' ? 'Under Review' : selectedBouncer.verificationStatus}
                                        </span>
                                        <span className="text-text-tertiary text-[10px] uppercase">
                                            ID: {selectedBouncer.id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedBouncer(null)}
                                className="text-2xl text-text-tertiary hover:text-white font-black font-mono"
                            >
                                [✕]
                            </button>
                        </div>

                        {/* Popup Content */}
                        <div className="flex-1 px-8 py-6 space-y-6 bg-bg-primary overflow-y-auto">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-bg-secondary p-4 border-2 border-text-primary rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                                    <div className="text-[10px] font-black font-mono tracking-wider text-text-dim uppercase mb-1">// REGISTRATION</div>
                                    <div className="text-sm font-black font-mono text-text-primary uppercase">{selectedBouncer.registrationType}</div>
                                </div>

                                <div className="bg-bg-secondary p-4 border-2 border-text-primary rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                                    <div className="text-[10px] font-black font-mono tracking-wider text-text-dim uppercase mb-1">// CONTACT</div>
                                    <div className="text-sm font-black font-mono text-text-primary">{selectedBouncer.contactNo}</div>
                                </div>

                                <div className="bg-bg-secondary p-4 border-2 border-text-primary rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                                    <div className="text-[10px] font-black font-mono tracking-wider text-text-dim uppercase mb-1">// BIOLOGICAL_DATA</div>
                                    <div className="text-sm font-black font-mono text-text-primary uppercase">{selectedBouncer.age}Y // {selectedBouncer.gender}</div>
                                </div>

                                <div className="bg-bg-secondary p-4 border-2 border-text-primary rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center">
                                    <div className="text-[10px] font-black font-mono tracking-wider text-text-dim uppercase mb-1">// STATUS</div>
                                    <div className={`text-sm font-black font-mono uppercase ${selectedBouncer.hasGunLicense ? 'text-success' : 'text-text-dim'}`}>
                                        {selectedBouncer.hasGunLicense ? 'GUN_LICENSED' : 'UNARMED'}
                                    </div>
                                </div>
                            </div>

                            {/* Details & Documents */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left: Personal Details */}
                                <div className="space-y-6">
                                    <div className="card bg-bg-secondary border-2 border-text-primary rounded-none p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-yellow"></div>
                                        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2 font-mono">
                                            // IDENTITY_DATA
                                        </h3>
                                        <div className="space-y-4 font-mono">
                                            <div>
                                                <label className="block text-[9px] font-black tracking-widest text-text-dim uppercase mb-1">Registered Email</label>
                                                <div className="text-sm font-bold text-text-primary font-mono">{selectedBouncer.user.email}</div>
                                            </div>
                                            {selectedBouncer.agencyReferralCode && (
                                                <div>
                                                    <label className="block text-[9px] font-black tracking-widest text-text-dim uppercase mb-1">Agency Referral Code</label>
                                                    <span className="inline-block px-2.5 py-1 bg-black border border-primary-yellow text-primary-yellow text-xs font-black font-mono">
                                                        {selectedBouncer.agencyReferralCode}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedBouncer.verificationStatus === 'REJECTED' && selectedBouncer.rejectionReason && (
                                                <div className="bg-red-950/20 border-2 border-error p-4 rounded-none mt-4">
                                                    <label className="block text-[9px] font-black uppercase tracking-widest text-error mb-1">// REJECTION_REASON</label>
                                                    <div className="text-xs font-bold text-red-200 italic leading-relaxed">
                                                        "{selectedBouncer.rejectionReason}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(selectedBouncer.bio || selectedBouncer.skills || selectedBouncer.experience) && (
                                        <div className="card bg-bg-secondary border-2 border-text-primary rounded-none p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-info"></div>
                                            <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex justify-between items-center font-mono">
                                                <span>// PROFESSIONAL_DATA</span>
                                                {selectedBouncer.experience && (
                                                    <span className="px-2 py-0.5 bg-info text-white font-mono font-black text-[9px] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                        {selectedBouncer.experience} YRS_EXP
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="space-y-4 font-mono">
                                                {selectedBouncer.bio && (
                                                    <div>
                                                        <label className="block text-[9px] font-black tracking-widest text-text-dim uppercase mb-1">Bio Summary</label>
                                                        <div className="text-xs text-text-secondary leading-relaxed bg-bg-primary p-3 border border-text-primary">
                                                            {selectedBouncer.bio}
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedBouncer.skills && selectedBouncer.skills.length > 0 && (
                                                    <div>
                                                        <label className="block text-[9px] font-black tracking-widest text-text-dim uppercase mb-2">Primary Skills</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedBouncer.skills.map((skill, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-bg-primary border border-text-primary text-text-primary text-[9px] font-black font-mono uppercase rounded-none">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Documents */}
                                <div className="space-y-6">
                                    <div className="card bg-bg-secondary border-2 border-text-primary rounded-none p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-4 flex justify-between items-center font-mono">
                                            <span>// DOCUMENTS_VERIFICATION</span>
                                            <span className="text-[8px] text-text-dim uppercase font-black">Click link to view original</span>
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Govt ID */}
                                            <div className="border-2 border-text-primary bg-bg-primary rounded-none overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <div className="flex items-center justify-between px-4 py-2 border-b-2 border-text-primary bg-bg-secondary font-mono">
                                                    <span className="text-[9px] font-black text-text-primary uppercase">// GOVERNMENT_ID</span>
                                                    <a href={selectedBouncer.govtIdPhoto} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-primary-yellow hover:underline">
                                                        VIEW_ORIGINAL ↗
                                                    </a>
                                                </div>
                                                <div className="p-3 flex items-center justify-center bg-black max-h-[220px]">
                                                    <img
                                                        src={selectedBouncer.govtIdPhoto}
                                                        alt="Government ID"
                                                        className="max-w-full max-h-[190px] object-contain border border-zinc-800"
                                                    />
                                                </div>
                                            </div>

                                            {/* Gun License */}
                                            {selectedBouncer.hasGunLicense && selectedBouncer.gunLicensePhoto && (
                                                <div className="border-2 border-text-primary bg-bg-primary rounded-none overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <div className="flex items-center justify-between px-4 py-2 border-b-2 border-text-primary bg-bg-secondary font-mono">
                                                        <span className="text-[9px] font-black text-text-primary uppercase">// WEAPONS_LICENSE</span>
                                                        <a href={selectedBouncer.gunLicensePhoto} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-primary-yellow hover:underline">
                                                            VIEW_ORIGINAL ↗
                                                        </a>
                                                    </div>
                                                    <div className="p-3 flex items-center justify-center bg-black max-h-[220px]">
                                                        <img
                                                            src={selectedBouncer.gunLicensePhoto}
                                                            alt="Gun License"
                                                            className="max-w-full max-h-[190px] object-contain border border-zinc-800"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Bottom Actions */}
                        {selectedBouncer.verificationStatus === 'PENDING' && (
                            <div className="flex-none bg-bg-secondary border-t-3 border-text-primary flex items-center justify-between px-8 py-4 z-30">
                                <button
                                    onClick={() => setSelectedBouncer(null)}
                                    className="px-4 py-2 border border-text-primary hover:bg-surface-hover text-xs font-black font-mono uppercase tracking-wider text-text-muted hover:text-white rounded-none cursor-pointer"
                                >
                                    [ CANCEL ]
                                </button>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionLoading}
                                        className="btn btn-sm border-2 border-black bg-error hover:bg-red-700 text-white font-mono font-black text-xs py-1.5 px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                    >
                                        DENY_APPLICATION
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedBouncer.id)}
                                        disabled={actionLoading}
                                        className="btn btn-sm btn-primary border-2 border-black bg-success hover:bg-green-600 text-black font-mono font-black text-xs py-1.5 px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                    >
                                        {actionLoading ? 'APPROVING...' : 'APPROVE_APPLICATION'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedBouncer.verificationStatus !== 'PENDING' && (
                            <div className="flex-none bg-bg-secondary border-t-3 border-text-primary flex items-center justify-center px-8 py-4 z-20">
                                <button
                                    onClick={() => setSelectedBouncer(null)}
                                    className="w-full btn btn-primary border-2 border-black text-black font-mono font-black text-xs py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                >
                                    CLOSE_REVIEW_PANEL
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Client Detail Drawer */}
            {selectedClient && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
                        onClick={() => setSelectedClient(null)}
                    />
                    <div className="fixed right-0 top-0 bottom-0 w-full max-w-[450px] bg-bg-secondary border-l-3 border-text-primary z-50 flex flex-col shadow-2xl animate-slide-in p-6 overflow-y-auto rounded-none">
                        {/* Drawer Header */}
                        <div className="flex-none pb-4 border-b-2 border-text-primary flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black uppercase tracking-wider text-text-primary font-mono">// CLIENT_DETAILS</h2>
                            <button onClick={() => setSelectedClient(null)} className="text-zinc-400 hover:text-white text-2xl font-black font-mono">[✕]</button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 space-y-6 font-mono">
                            <div>
                                <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Full Name</div>
                                <div className="text-base font-bold text-text-primary uppercase">{selectedClient.user?.name || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Email Address</div>
                                <div className="text-base font-bold text-text-primary font-mono">{selectedClient.user?.email}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Client ID</div>
                                <div className="text-xs font-mono text-text-secondary">{selectedClient.id}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Verification Status</div>
                                <div className="mt-1.5">
                                    <span className={`px-2.5 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase ${
                                        selectedClient.verificationStatus === 'APPROVED' ? 'bg-success text-black' :
                                        selectedClient.verificationStatus === 'REJECTED' ? 'bg-error text-white' :
                                        'bg-primary-yellow text-black'
                                    }`}>
                                        {selectedClient.verificationStatus}
                                    </span>
                                </div>
                            </div>
                            {selectedClient.verificationStatus === 'REJECTED' && selectedClient.rejectionReason && (
                                <div className="bg-red-950/20 border-2 border-error p-4 rounded-none mt-4">
                                    <div className="text-[9px] text-error font-black uppercase tracking-wider mb-1">// REJECTION_REASON</div>
                                    <div className="text-xs font-bold text-red-200 italic">
                                        "{selectedClient.rejectionReason}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                        {selectedClient.verificationStatus === 'PENDING' ? (
                            <div className="flex-none pt-4 border-t-2 border-text-primary bg-bg-secondary flex flex-col gap-3 mt-6">
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="flex-1 btn border-2 border-black bg-error hover:bg-red-700 text-white font-mono font-black text-xs py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer text-center"
                                    >
                                        REJECT
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedClient.id)}
                                        disabled={actionLoading}
                                        className="flex-1 btn btn-primary border-2 border-black bg-success hover:bg-green-600 text-black font-mono font-black text-xs py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer text-center"
                                    >
                                        {actionLoading ? 'APPROVING...' : 'APPROVE'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setSelectedClient(null)}
                                    className="w-full text-center text-text-muted hover:text-white font-black font-mono text-[10px] uppercase py-2"
                                >
                                    [ CLOSE_REVIEW ]
                                </button>
                            </div>
                        ) : (
                            <div className="flex-none pt-4 border-t-2 border-text-primary bg-bg-secondary flex justify-center mt-6">
                                <button
                                    onClick={() => setSelectedClient(null)}
                                    className="w-full btn btn-primary border-2 border-black text-black font-mono font-black text-xs py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase cursor-pointer"
                                >
                                    CLOSE_REVIEW
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Rejection Reason Popup Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-fade-in" onClick={() => setShowRejectModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-bg-secondary border-3 border-white rounded-none shadow-[6px_6px_0px_0px_rgba(250,204,21,1)] p-8 animate-scale-up z-10">
                        <h3 className="text-xl font-black text-white mb-2 uppercase font-mono tracking-wider">// REJECT_APPLICATION</h3>
                        <p className="text-text-secondary text-xs mb-6 font-mono uppercase tracking-wider">// Explain the reason for rejection. This will be transmitted directly to the user profile.</p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection logs..."
                            className="w-full h-32 bg-bg-primary border-2 border-text-primary rounded-none p-4 text-text-primary focus:border-error focus:outline-none transition-all resize-none mb-6 font-mono text-sm placeholder-white/20"
                            autoFocus
                        />

                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="px-6 py-2.5 text-xs font-black text-text-muted hover:text-white transition-colors uppercase font-mono cursor-pointer"
                            >
                                [ CANCEL ]
                            </button>
                            <button
                                onClick={() => {
                                    handleReject(verificationType === 'bouncer' ? selectedBouncer!.id : selectedClient!.id);
                                    setShowRejectModal(false);
                                }}
                                disabled={!rejectionReason.trim() || actionLoading}
                                className="px-6 py-2.5 border-2 border-black bg-error hover:bg-red-700 text-white font-mono font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {actionLoading ? 'REJECTING...' : 'CONFIRM_REJECT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




