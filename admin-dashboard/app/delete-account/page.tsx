'use client';

import { useState } from 'react';

export default function DeleteAccountPage() {
    const [step, setStep] = useState<'form' | 'submitted'>('form');
    const [email, setEmail] = useState('');
    const [accountType, setAccountType] = useState<'CLIENT' | 'BOUNCER'>('CLIENT');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refId, setRefId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch('/api/delete-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, accountType, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');
            setRefId(data.refId || '');
            setStep('submitted');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 32, height: 32, backgroundColor: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', letterSpacing: '-0.3px' }}>ShieldHire</span>
            </div>

            <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 60px' }}>

                {step === 'submitted' ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ width: 56, height: 56, backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Request Submitted</h2>
                        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
                            We've received your deletion request for <strong style={{ color: '#111827' }}>{email}</strong>.
                        </p>
                        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>
                            Your account and personal data will be deleted within <strong style={{ color: '#111827' }}>30 days</strong>. You'll receive a confirmation email once complete.
                        </p>
                        {refId && (
                            <p style={{ marginTop: 20, fontSize: 13, color: '#9ca3af' }}>Reference: {refId}</p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Title */}
                        <div style={{ marginBottom: 32 }}>
                            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 8, letterSpacing: '-0.5px' }}>Delete Your Account</h1>
                            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>
                                Submit a request to permanently delete your ShieldHire account and all associated personal data.
                            </p>
                        </div>

                        {/* Info sections */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px' }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Data Deleted</p>
                                {['Account & profile', 'Contact & personal info', 'Government ID photos', 'Profile photos', 'Location history', 'Chat messages'].map(item => (
                                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px' }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Retained</p>
                                {[
                                    ['Booking records', '7 years (legal)'],
                                    ['Payment records', '7 years (tax)'],
                                    ['Dispute logs', '3 years (fraud)'],
                                ].map(([label, period]) => (
                                    <div key={label} style={{ marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, color: '#374151', display: 'block' }}>{label}</span>
                                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{period}</span>
                                    </div>
                                ))}
                                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, lineHeight: 1.5 }}>Retained data is anonymised and not linked to your identity.</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px' }}>
                            {error && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', marginBottom: 20, color: '#dc2626', fontSize: 14 }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: 18 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        disabled={loading}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                                    />
                                </div>

                                <div style={{ marginBottom: 18 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Account type</label>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {(['CLIENT', 'BOUNCER'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setAccountType(type)}
                                                style={{
                                                    flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                                    border: accountType === type ? '2px solid #111827' : '1px solid #d1d5db',
                                                    backgroundColor: accountType === type ? '#111827' : '#fff',
                                                    color: accountType === type ? '#fff' : '#374151',
                                                }}
                                            >
                                                {type === 'CLIENT' ? 'Client (User)' : 'Bouncer'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Reason <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                                    <textarea
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Tell us why you're leaving..."
                                        rows={3}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#111827', outline: 'none', resize: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                                    />
                                </div>

                                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                                    <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>⚠ This action is permanent</p>
                                    <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>Once processed, your account cannot be recovered. Please complete or cancel any active bookings before requesting deletion.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: '12px', backgroundColor: loading ? '#9ca3af' : '#dc2626', color: '#fff',
                                        border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    {loading ? 'Submitting...' : 'Submit Deletion Request'}
                                </button>
                            </form>
                        </div>

                        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9ca3af' }}>
                            Need help?{' '}
                            <a href="mailto:support@shieldhire.com" style={{ color: '#6b7280', textDecoration: 'underline' }}>support@shieldhire.com</a>
                            {' · '}
                            <a href="https://doc-hosting.flycricket.io/sos-shieldhire-privacy-policy/ced1d6d0-453d-44e7-81a0-7f7d1d26d250/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
