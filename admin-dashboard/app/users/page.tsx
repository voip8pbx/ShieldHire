'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    contactNo?: string;
    role: string;
    createdAt: string;
    profilePhoto?: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="page-header border-b-3 border-text-primary pb-6 mb-8">
                <div>
                    <h1 className="page-title text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-text-primary">
                        Users Directory
                    </h1>
                    <p className="page-subtitle text-xs font-mono text-text-muted uppercase tracking-wider mt-1">
                        // System access registry and operational accounts
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// TOTAL_ACCOUNTS</div>
                        <div className="text-3xl font-black font-mono text-text-primary">{users.length}</div>
                    </div>
                </div>

                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// BOUNCER_AGENTS</div>
                        <div className="text-3xl font-black font-mono text-primary-yellow">
                            {users.filter(u => u.role === 'BOUNCER').length}
                        </div>
                    </div>
                </div>

                <div className="card border-3 border-text-primary bg-bg-secondary p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <div className="flex justify-between items-center">
                        <div className="text-xs font-black font-mono text-text-dim uppercase tracking-wider">// CLIENT_ACCOUNTS</div>
                        <div className="text-3xl font-black font-mono text-info">
                            {users.filter(u => u.role === 'USER').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card border-3 border-text-primary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="table-container">
                    <table className="professional-table">
                        <thead>
                            <tr>
                                <th>USER ID / NAME</th>
                                <th>CONTACT INFORMATION</th>
                                <th>SYSTEM ROLE</th>
                                <th className="hidden sm:table-cell">REGISTRATION DATE</th>
                                <th className="text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <div className="skeleton h-8 w-32 mx-auto"></div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-text-tertiary font-mono">
                                        NO USERS REGISTERED IN DATABASE
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div>
                                                <div className="font-black text-text-primary mb-1 uppercase tracking-wide">
                                                    {user.name}
                                                </div>
                                                <div className="text-[10px] font-mono text-text-dim uppercase">
                                                    ID: {user.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <div className="text-text-primary font-bold font-mono">
                                                    {user.email}
                                                </div>
                                                {user.contactNo && (
                                                    <div className="text-[10px] font-mono text-text-dim">
                                                        TEL: {user.contactNo}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`px-2.5 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase inline-block ${
                                                user.role === 'BOUNCER'
                                                    ? 'bg-primary-yellow text-black'
                                                    : user.role === 'USER'
                                                        ? 'bg-info text-white'
                                                        : 'bg-surface-hover text-text-primary border-text-primary'
                                            }`}>
                                                {user.role === 'USER' ? 'CLIENT' : user.role}
                                            </span>
                                        </td>
                                        <td className="hidden sm:table-cell">
                                            <div className="text-text-secondary font-mono font-bold text-xs">
                                                {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="btn btn-sm btn-primary py-1 px-3 border-2 border-black font-mono font-black text-[10px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase"
                                            >
                                                INSPECT_USER
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div
                    className="fixed inset-0 bg-black/85 flex items-center justify-center p-8 z-50 animate-fade-in"
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        className="card bg-bg-secondary border-3 border-white rounded-none p-8 max-w-2xl w-full shadow-[6px_6px_0px_0px_rgba(250,204,21,1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center border-b-3 border-text-primary pb-3 mb-6">
                            <h2 className="text-xl font-black uppercase text-white font-mono tracking-wider">
                                // ACCOUNT_INSPECTION_PANEL
                            </h2>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-2xl text-text-tertiary hover:text-white font-black font-mono"
                            >
                                [✕]
                            </button>
                        </div>

                        <div className="space-y-4 font-mono">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-text-dim uppercase">FULL NAME</span>
                                <span className="text-sm font-bold text-white uppercase">{selectedUser.name}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-text-dim uppercase">SYSTEM ID</span>
                                <span className="text-xs font-bold text-primary-yellow font-mono">{selectedUser.id}</span>
                            </div>

                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-text-dim uppercase">EMAIL ADDRESS</span>
                                <span className="text-sm font-bold text-white font-mono">{selectedUser.email}</span>
                            </div>

                            {selectedUser.contactNo && (
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs font-black text-text-dim uppercase">TELEPHONE NO</span>
                                    <span className="text-sm font-bold text-white font-mono">{selectedUser.contactNo}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-text-dim uppercase">ACCESS ROLE</span>
                                <span className={`px-2.5 py-0.5 border border-black font-mono font-black text-[9px] rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase ${
                                    selectedUser.role === 'BOUNCER'
                                        ? 'bg-primary-yellow text-black'
                                        : 'bg-info text-white'
                                }`}>
                                    {selectedUser.role === 'USER' ? 'CLIENT' : selectedUser.role}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-text-dim uppercase">REGISTERED AT</span>
                                <span className="text-sm font-bold text-white">
                                    {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-full btn btn-primary border-2 border-black font-mono font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all uppercase"
                            >
                                DISMISS_INSPECTION
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


