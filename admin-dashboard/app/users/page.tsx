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
        <div className="content-spacing">
            {/* Header */}
            <div className="section-spacing">
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                    Users Directory
                </h1>
                <p className="text-base text-[var(--text-secondary)]">
                    Manage and monitor all registered users
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 section-spacing">
                <div className="card card-spacing">
                    <div className="detail-row">
                        <div className="detail-label">Total Users</div>
                        <div className="detail-value text-2xl font-bold">{users.length}</div>
                    </div>
                </div>

                <div className="card card-spacing">
                    <div className="detail-row">
                        <div className="detail-label">Bouncer Accounts</div>
                        <div className="detail-value text-2xl font-bold text-[var(--primary)]">
                            {users.filter(u => u.role === 'BOUNCER').length}
                        </div>
                    </div>
                </div>

                <div className="card card-spacing">
                    <div className="detail-row">
                        <div className="detail-label">Client Accounts</div>
                        <div className="detail-value text-2xl font-bold text-[var(--secondary)]">
                            {users.filter(u => u.role === 'USER').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <table className="professional-table">
                    <thead>
                        <tr>
                            <th>User Details</th>
                            <th>Contact Information</th>
                            <th>Role</th>
                            <th>Joined Date</th>
                            <th>Actions</th>
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
                                <td colSpan={5} className="text-center py-12 text-[var(--text-tertiary)]">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div>
                                            <div className="font-bold text-[var(--text-primary)] mb-1">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-tertiary)]">
                                                ID: {user.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>
                                            <div className="text-[var(--text-primary)] mb-1">
                                                {user.email}
                                            </div>
                                            {user.contactNo && (
                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                    {user.contactNo}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-3 py-1 rounded-md text-xs font-semibold ${user.role === 'BOUNCER'
                                                ? 'bg-[var(--primary-glow)] text-[var(--primary)] border border-[var(--primary)]'
                                                : user.role === 'USER'
                                                    ? 'bg-[var(--secondary-glow)] text-[var(--secondary)] border border-[var(--secondary)]'
                                                    : 'bg-[var(--surface-elevated)] text-[var(--text-tertiary)]'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="text-[var(--text-secondary)]">
                                            {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-light)] transition-all text-sm font-semibold"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-8 z-50"
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        className="card p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="float-right text-3xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-bold"
                        >
                            ×
                        </button>

                        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
                            User Details
                        </h2>

                        <div className="space-y-6">
                            <div className="detail-row">
                                <div className="detail-label">Full Name</div>
                                <div className="detail-value">{selectedUser.name}</div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Email Address</div>
                                <div className="detail-value">{selectedUser.email}</div>
                            </div>

                            {selectedUser.contactNo && (
                                <div className="detail-row">
                                    <div className="detail-label">Contact Number</div>
                                    <div className="detail-value">{selectedUser.contactNo}</div>
                                </div>
                            )}

                            <div className="detail-row">
                                <div className="detail-label">Account Type</div>
                                <div className="detail-value">
                                    <span className={`px-3 py-1 rounded-md text-sm font-semibold ${selectedUser.role === 'BOUNCER'
                                            ? 'bg-[var(--primary-glow)] text-[var(--primary)] border border-[var(--primary)]'
                                            : 'bg-[var(--secondary-glow)] text-[var(--secondary)] border border-[var(--secondary)]'
                                        }`}>
                                        {selectedUser.role}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-row">
                                <div className="detail-label">Registered On</div>
                                <div className="detail-value">
                                    {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-8 border-t border-[var(--border)]">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 btn-outline py-4"
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


